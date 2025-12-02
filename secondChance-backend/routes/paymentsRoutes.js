const express = require('express');
const { authenticate } = require('../middleware/auth');
const connectToDatabase = require('../models/db');
const {
    getStripeClient,
    stripePublicKey,
    paypalConfig,
    paymentsMode,
    isDemoPayments,
} = require('../config/payments');
const { notificationService } = require('./notificationsRoutes');
const { recordItemSold, finalizeBadges } = require('../services/userStats');

const router = express.Router();

const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
const SUCCESS_BASE_URL = process.env.STRIPE_SUCCESS_URL || `${FRONTEND_BASE_URL}/app/payment-success`;
const CANCEL_BASE_URL = process.env.STRIPE_CANCEL_URL || `${FRONTEND_BASE_URL}/app/payment-cancel`;

let orderIndexesEnsured = false;
const ensureOrderIndexes = async (db) => {
    if (orderIndexesEnsured) {
        return;
    }
    await db.collection('orders').createIndex({ providerSessionId: 1 }, { unique: true });
    await db.collection('orders').createIndex({ itemId: 1 });
    orderIndexesEnsured = true;
};

const requireStripe = () => {
    const stripe = getStripeClient();
    if (!stripe) {
        const err = new Error('Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PUBLIC_KEY');
        err.statusCode = 500;
        throw err;
    }
    return stripe;
};

const notifySellerOfSale = async ({ sellerId, item, buyerId }) => {
    if (!sellerId || !item) {
        return;
    }
    try {
        await notificationService.notifyItemSold({
            sellerId,
            itemId: item.id,
            itemName: item.name || 'Your item',
            buyerId,
        });
        await recordItemSold({ sellerId });
        await finalizeBadges(sellerId);
    } catch (err) {
        console.error('Failed to send sale notification', err);
    }
};

const buildSuccessUrl = () =>
    `${SUCCESS_BASE_URL}${SUCCESS_BASE_URL.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`;

const buildCancelUrl = (itemId) => {
    const base = `${CANCEL_BASE_URL}${CANCEL_BASE_URL.includes('?') ? '&' : '?'}`;
    return `${base}item_id=${encodeURIComponent(itemId)}`;
};

const mapOrderResponse = (doc) => {
    if (!doc) {
        return null;
    }
    const { _id, ...rest } = doc;
    return {
        id: _id?.toString(),
        ...rest,
    };
};

router.get('/config', authenticate, (req, res) => {
    res.json({
        stripePublicKey,
        paypalConfigured: Boolean(paypalConfig.clientId && paypalConfig.clientSecret),
    });
});

router.post('/create-checkout-session', authenticate, async (req, res) => {
    try {
        const { itemId } = req.body || {};

        if (!itemId) {
            return res.status(400).json({ error: 'itemId is required' });
        }

        const db = await connectToDatabase();
        const itemsCollection = db.collection('secondChanceItems');
        const demoSessionsCollection = db.collection('paymentSessions');

        const item = await itemsCollection.findOne({ id: itemId });
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const numericPrice = Number(item.price || 0);
        if (!numericPrice || numericPrice <= 0) {
            return res.status(400).json({ error: 'Item is free and does not require payment' });
        }
        if ((item.status || 'available') !== 'available') {
            return res.status(400).json({ error: 'Item is not available for purchase' });
        }
        if (item.ownerId === req.user.id) {
            return res.status(400).json({ error: 'You cannot purchase your own item' });
        }

        const unitAmount = Math.round(numericPrice * 100);
        if (unitAmount <= 0) {
            return res.status(400).json({ error: 'Invalid price for item' });
        }

        const publicBaseUrl = process.env.BACKEND_PUBLIC_URL || '';
        const productData = {
            name: item.name,
            description: item.description?.slice(0, 200) || 'SecondChance item',
        };
        if (publicBaseUrl && item.image) {
            const normalizedBase = publicBaseUrl.endsWith('/') ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
            const normalizedImage = item.image.startsWith('/') ? item.image : `/${item.image}`;
            productData.images = [`${normalizedBase}${normalizedImage}`];
        }

        if (isDemoPayments) {
            const sessionId = `demo_${item.id}_${req.user.id}_${Date.now()}`;
            await demoSessionsCollection.insertOne({
                sessionId,
                itemId: item.id,
                buyerId: req.user.id,
                sellerId: item.ownerId || null,
                amount: numericPrice,
                currency: STRIPE_CURRENCY,
                createdAt: new Date(),
            });
            return res.json({
                sessionId,
                checkoutUrl: `${SUCCESS_BASE_URL}?session_id=${sessionId}`,
                publishableKey: stripePublicKey,
                mode: 'demo',
            });
        }

        const stripe = requireStripe();

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            customer_email: req.user.email,
            client_reference_id: item.id,
            success_url: buildSuccessUrl(),
            cancel_url: buildCancelUrl(item.id),
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: STRIPE_CURRENCY,
                        unit_amount: unitAmount,
                        product_data: productData,
                    },
                },
            ],
            metadata: {
                itemId: item.id,
                buyerId: req.user.id,
                sellerId: item.ownerId || '',
            },
            automatic_tax: { enabled: false },
            invoice_creation: { enabled: false },
        });

        return res.json({
            sessionId: session.id,
            checkoutUrl: session.url,
            publishableKey: stripePublicKey,
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Failed to start checkout session';
        console.error('Stripe checkout session error:', message);
        if (error.raw?.message) {
            console.error('Stripe details:', error.raw.message);
        }
        return res.status(statusCode).json({ error: message });
    }
});

router.get('/verify-session', authenticate, async (req, res) => {
    try {
        const sessionId = req.query.session_id;
        if (!sessionId) {
            return res.status(400).json({ error: 'session_id query param is required' });
        }

        const db = await connectToDatabase();
        await ensureOrderIndexes(db);
        const ordersCollection = db.collection('orders');
        const itemsCollection = db.collection('secondChanceItems');
        const demoSessionsCollection = db.collection('paymentSessions');

        const cachedOrder = await ordersCollection.findOne({ providerSessionId: sessionId });
        if (cachedOrder) {
            const item = await itemsCollection.findOne({ id: cachedOrder.itemId });
            return res.json({
                order: mapOrderResponse(cachedOrder),
                item,
            });
        }

        if (isDemoPayments) {
            const demoSession = await demoSessionsCollection.findOne({ sessionId });
            if (!demoSession) {
                return res.status(404).json({ error: 'Demo checkout session not found' });
            }
            if (demoSession.buyerId !== req.user.id) {
                return res.status(403).json({ error: 'You are not allowed to finalize this payment' });
            }

            const item = await itemsCollection.findOne({ id: demoSession.itemId });
            if (!item) {
                return res.status(404).json({ error: 'Item not found for session' });
            }
            if ((item.status || 'available') === 'sold' && item.soldToUserId && item.soldToUserId !== demoSession.buyerId) {
                return res.status(400).json({ error: 'Item already sold to a different buyer' });
            }

            const soldDoc = await itemsCollection.findOneAndUpdate(
                { id: demoSession.itemId },
                {
                    $set: {
                        status: 'sold',
                        soldAt: new Date(),
                        soldToUserId: demoSession.buyerId,
                        soldPrice: demoSession.amount,
                        soldCurrency: demoSession.currency || STRIPE_CURRENCY,
                    },
                    $unset: {
                        reservedByUserId: '',
                        reservedUntil: '',
                    },
                },
                { returnDocument: 'after' }
            );

            const orderDoc = {
                itemId: demoSession.itemId,
                buyerId: demoSession.buyerId,
                sellerId: demoSession.sellerId || item.ownerId || null,
                amount: demoSession.amount,
                currency: demoSession.currency || STRIPE_CURRENCY,
                paymentProvider: 'demo',
                providerSessionId: sessionId,
                providerPaymentIntentId: null,
                receiptEmail: req.user.email,
                paymentStatus: 'paid',
                createdAt: new Date(),
            };

            await ordersCollection.updateOne(
                { providerSessionId: sessionId },
                { $setOnInsert: orderDoc },
                { upsert: true }
            );
            const savedOrder = await ordersCollection.findOne({ providerSessionId: sessionId });
            await demoSessionsCollection.deleteOne({ sessionId });
            await notifySellerOfSale({
                sellerId: orderDoc.sellerId,
                item: soldDoc.value || item,
                buyerId: demoSession.buyerId,
            });

            return res.json({
                order: mapOrderResponse(savedOrder),
                item: soldDoc.value || item,
            });
        }

        const stripe = requireStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent'],
        });

        if (!session) {
            return res.status(404).json({ error: 'Checkout session not found' });
        }
        if (session.payment_status !== 'paid') {
            return res.status(400).json({
                error: 'Payment not completed yet',
                paymentStatus: session.payment_status,
            });
        }

        const metadata = session.metadata || {};
        const itemId = metadata.itemId;
        const buyerId = metadata.buyerId || req.user.id;

        if (!itemId) {
            return res.status(400).json({ error: 'Session missing item metadata' });
        }
        if (buyerId !== req.user.id) {
            return res.status(403).json({ error: 'You are not allowed to finalize this payment' });
        }

        const item = await itemsCollection.findOne({ id: itemId });
        if (!item) {
            return res.status(404).json({ error: 'Item not found for session' });
        }
        if ((item.status || 'available') === 'sold' && item.soldToUserId && item.soldToUserId !== buyerId) {
            return res.status(400).json({ error: 'Item already sold to a different buyer' });
        }

        const soldDoc = await itemsCollection.findOneAndUpdate(
            { id: itemId },
            {
                $set: {
                    status: 'sold',
                    soldAt: new Date(),
                    soldToUserId: buyerId,
                    soldPrice: (session.amount_total || 0) / 100,
                    soldCurrency: session.currency || STRIPE_CURRENCY,
                },
                $unset: {
                    reservedByUserId: '',
                    reservedUntil: '',
                },
            },
            { returnDocument: 'after' }
        );

        const orderDoc = {
            itemId,
            buyerId,
            sellerId: metadata.sellerId || item.ownerId || null,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || STRIPE_CURRENCY,
            paymentProvider: 'stripe',
            providerSessionId: session.id,
            providerPaymentIntentId:
                typeof session.payment_intent === 'string'
                    ? session.payment_intent
                    : session.payment_intent?.id || null,
            receiptEmail: session.customer_details?.email || req.user.email,
            paymentStatus: session.payment_status,
            createdAt: new Date(),
        };

        await ordersCollection.updateOne(
            { providerSessionId: session.id },
            { $setOnInsert: orderDoc },
            { upsert: true }
        );
        const savedOrder = await ordersCollection.findOne({ providerSessionId: session.id });
        await notifySellerOfSale({
            sellerId: orderDoc.sellerId,
            item: soldDoc.value || item,
            buyerId,
        });

        return res.json({
            order: mapOrderResponse(savedOrder),
            item: soldDoc.value || item,
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Failed to verify payment';
        console.error('Stripe verify session error:', message);
        if (error.raw?.message) {
            console.error('Stripe details:', error.raw.message);
        }
        return res.status(statusCode).json({ error: message });
    }
});

module.exports = router;

