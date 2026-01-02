/*
 * Payment Routes - נתיבי תשלום
 * ניהול תהליך התשלום באמצעות PayPal Sandbox
 */
const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');
const { authenticate } = require('../middleware/auth');
const { ObjectId } = require('mongodb');
const axios = require('axios');

// Note: Pay-with-balance endpoint removed in favor of PayPal Sandbox integration.

// יצירת הזמנת תשלום
router.post('/create-order', authenticate, async (req, res, next) => {
    try {
        const { itemId, amount } = req.body;
        
        if (!itemId || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const db = await connectToDatabase();
        const itemsCollection = db.collection('secondChanceItems');
        const paymentsCollection = db.collection('payments');
        
        // בדיקה שהפריט קיים
        const item = await itemsCollection.findOne({ id: itemId });
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // בדיקה שהפריט לא נמכר
        if (item.status === 'sold') {
            return res.status(400).json({ error: 'Item already sold' });
        }

        // בדיקה שהמחיר תואם
        if (item.price !== amount) {
            return res.status(400).json({ error: 'Price mismatch' });
        }

        // בדיקה שהקונה לא הבעלים של הפריט
        if (item.ownerId === req.user.id) {
            return res.status(400).json({ error: 'Cannot buy your own item' });
        }

        // If PayPal credentials exist, create PayPal order in Sandbox
        const clientId = process.env.PAYPAL_CLIENT_ID;
        const clientSecret = process.env.PAYPAL_SECRET;

        if (!clientId || !clientSecret) {
            // Fallback: create a pending local order (simulated)
            const payment = {
                orderId: `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                itemId,
                buyerId: req.user.id,
                sellerId: item.ownerId,
                amount,
                status: 'pending', // pending, completed, cancelled
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await paymentsCollection.insertOne(payment);

            logger.info(`Payment order created (sim): ${payment.orderId} for item ${itemId}`);

            return res.json({ orderId: payment.orderId, amount: payment.amount });
        }

        // Get PayPal access token
        const tokenResp = await axios({
            method: 'post',
            url: 'https://api-m.sandbox.paypal.com/v1/oauth2/token',
            auth: {
                username: clientId,
                password: clientSecret,
            },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: 'grant_type=client_credentials',
        });

        const accessToken = tokenResp.data.access_token;

        // Create PayPal order
        const orderResp = await axios({
            method: 'post',
            url: 'https://api-m.sandbox.paypal.com/v2/checkout/orders',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            data: {
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'USD',
                            value: amount.toString(),
                        },
                        reference_id: itemId,
                    },
                ],
            },
        });

        const paypalOrderId = orderResp.data.id;

        // create local pending payment record referencing PayPal order
        const payment = {
            orderId: paypalOrderId,
            provider: 'paypal',
            itemId,
            buyerId: req.user.id,
            sellerId: item.ownerId,
            amount,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await paymentsCollection.insertOne(payment);

        logger.info(`PayPal order created: ${paypalOrderId} for item ${itemId}`);

        res.json({ orderId: paypalOrderId, amount: payment.amount, provider: 'paypal' });
    } catch (error) {
        logger.error('Error creating payment order:', error);
        next(error);
    }
});

// אישור תשלום (סימולציה של PayPal)
router.post('/capture-order', authenticate, async (req, res, next) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: 'Missing orderId' });
        }

        const db = await connectToDatabase();
        const paymentsCollection = db.collection('payments');
        const itemsCollection = db.collection('secondChanceItems');

        // מציאת ההזמנה
        const payment = await paymentsCollection.findOne({ orderId });
        if (!payment) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // בדיקה שהתשלום שייך למשתמש המחובר
        if (payment.buyerId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (payment.provider === 'paypal') {
            const clientId = process.env.PAYPAL_CLIENT_ID;
            const clientSecret = process.env.PAYPAL_SECRET;

            if (!clientId || !clientSecret) {
                return res.status(500).json({ error: 'PayPal credentials not configured' });
            }

            // get access token
            const tokenResp = await axios({
                method: 'post',
                url: 'https://api-m.sandbox.paypal.com/v1/oauth2/token',
                auth: { username: clientId, password: clientSecret },
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: 'grant_type=client_credentials',
            });

            const accessToken = tokenResp.data.access_token;

            // capture the order
            const capResp = await axios({
                method: 'post',
                url: `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
                headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            });

            // Update local payment record
            await paymentsCollection.updateOne(
                { orderId },
                {
                    $set: {
                        status: 'completed',
                        completedAt: new Date(),
                        updatedAt: new Date(),
                        providerResponse: capResp.data,
                    },
                }
            );

            // mark item sold
            await itemsCollection.updateOne(
                { id: payment.itemId },
                { $set: { status: 'sold', soldTo: payment.buyerId, soldAt: new Date() } }
            );

            logger.info(`PayPal payment captured: ${orderId} for item ${payment.itemId}`);

            return res.json({ success: true, orderId, status: 'completed', providerResponse: capResp.data });
        }

        // Fallback: local simulated capture
        if (payment.status !== 'pending') {
            return res.status(400).json({ error: `Order already ${payment.status}` });
        }

        await paymentsCollection.updateOne(
            { orderId },
            {
                $set: {
                    status: 'completed',
                    completedAt: new Date(),
                    updatedAt: new Date(),
                },
            }
        );

        await itemsCollection.updateOne(
            { id: payment.itemId },
            {
                $set: {
                    status: 'sold',
                    soldTo: payment.buyerId,
                    soldAt: new Date(),
                },
            }
        );

        logger.info(`Payment captured (sim): ${orderId} for item ${payment.itemId}`);

        res.json({ success: true, orderId, status: 'completed' });
    } catch (error) {
        logger.error('Error capturing payment:', error);
        next(error);
    }
});

// ביטול תשלום
router.post('/cancel-order', authenticate, async (req, res, next) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: 'Missing orderId' });
        }

        const db = await connectToDatabase();
        const paymentsCollection = db.collection('payments');

        const payment = await paymentsCollection.findOne({ orderId });
        if (!payment) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (payment.buyerId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (payment.status !== 'pending') {
            return res.status(400).json({ error: `Cannot cancel ${payment.status} order` });
        }

        await paymentsCollection.updateOne(
            { orderId },
            {
                $set: {
                    status: 'cancelled',
                    cancelledAt: new Date(),
                    updatedAt: new Date(),
                },
            }
        );

        logger.info(`Payment cancelled: ${orderId}`);

        res.json({
            success: true,
            orderId,
            status: 'cancelled',
        });
    } catch (error) {
        logger.error('Error cancelling payment:', error);
        next(error);
    }
});

// קבלת היסטוריית רכישות של משתמש
router.get('/my-purchases', authenticate, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const paymentsCollection = db.collection('payments');

        const purchases = await paymentsCollection
            .find({ buyerId: req.user.id })
            .sort({ createdAt: -1 })
            .toArray();

        res.json(purchases);
    } catch (error) {
        logger.error('Error fetching purchases:', error);
        next(error);
    }
});

// קבלת היסטוריית מכירות של משתמש
router.get('/my-sales', authenticate, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const paymentsCollection = db.collection('payments');

        const sales = await paymentsCollection
            .find({ sellerId: req.user.id, status: 'completed' })
            .sort({ createdAt: -1 })
            .toArray();

        res.json(sales);
    } catch (error) {
        logger.error('Error fetching sales:', error);
        next(error);
    }
});

// קבלת היתרה של המשתמש (balance)
// Balance endpoint removed.

module.exports = router;

// Endpoint to expose PayPal client id to frontend (safe for sandbox usage)
router.get('/paypal-config', (req, res) => {
    const clientId = process.env.PAYPAL_CLIENT_ID || null;
    res.json({ clientId });
});
