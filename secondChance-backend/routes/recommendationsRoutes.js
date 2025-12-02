const express = require('express');
const { ObjectId } = require('mongodb');
const connectToDatabase = require('../models/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const normalizeObjectId = (id) => {
    try {
        return new ObjectId(id);
    } catch (err) {
        return null;
    }
};

const categoriesFallback = ['Living', 'Bedroom', 'Kitchen', 'Office', 'Outdoor', 'Kids', 'Electronics'];

const DEFAULT_RECOMMENDATION_LIMIT = 12;
const TRENDING_WINDOW_HOURS = 24;

router.get('/personal', authenticate, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const interactionsCollection = db.collection('userInteractions');
        const itemsCollection = db.collection('secondChanceItems');

        const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : DEFAULT_RECOMMENDATION_LIMIT;

        const stats = await interactionsCollection.findOne({ userId: req.user.id });

        const preferredCategories = stats?.preferredCategories?.length
            ? stats.preferredCategories
            : categoriesFallback;
        const preferredAreas = stats?.preferredAreas?.filter(Boolean) || [];
        const preferredPriceRange = stats?.preferredPriceRange;

        const priceFilter = preferredPriceRange
            ? {
                price: {
                    $gte: preferredPriceRange.min,
                    $lte: preferredPriceRange.max,
                },
            }
            : {};

        const areaFilter =
            preferredAreas.length > 0
                ? { area: { $in: preferredAreas } }
                : {};

        const pipeline = [
            {
                $match: {
                    status: { $ne: 'sold' },
                    category: { $in: preferredCategories },
                    ...priceFilter,
                    ...areaFilter,
                },
            },
            {
                $addFields: {
                    recScore: {
                        $add: [
                            { $multiply: [{ $rand: {}, }, 0.5] },
                            stats?.recencyWeight || 0,
                        ],
                    },
                },
            },
            { $sort: { recScore: -1, date_added: -1 } },
            { $limit: limit },
        ];

        const items = await itemsCollection.aggregate(pipeline).toArray();
        res.json(items);
    } catch (e) {
        next(e);
    }
});

router.post('/record', authenticate, async (req, res, next) => {
    try {
        const { itemId, action } = req.body || {};
        if (!itemId) {
            return res.status(400).json({ error: 'itemId is required' });
        }
        const validActions = ['view', 'click', 'favorite', 'purchase', 'search'];
        if (action && !validActions.includes(action)) {
            return res.status(400).json({ error: 'Invalid action' });
        }

        const db = await connectToDatabase();
        const interactionsCollection = db.collection('userInteractions');
        const itemsCollection = db.collection('secondChanceItems');

        const item = await itemsCollection.findOne({ id: itemId });
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const now = new Date();
        const update = {
            $setOnInsert: {
                userId: req.user.id,
                createdAt: now,
            },
            $set: {
                updatedAt: now,
            },
            $push: {
                events: {
                    action: action || 'view',
                    itemId,
                    category: item.category,
                    city: item.city,
                    area: item.area,
                    price: item.price,
                    at: now,
                },
            },
        };

        const preferredCategories = item.category
            ? [item.category]
            : [];
        const preferredAreas = item.area
            ? [item.area]
            : [];

        if (preferredCategories.length) {
            update.$addToSet = {
                preferredCategories: { $each: preferredCategories },
            };
        }
        if (preferredAreas.length) {
            update.$addToSet = update.$addToSet || {};
            update.$addToSet.preferredAreas = { $each: preferredAreas };
        }

        await interactionsCollection.updateOne(
            { userId: req.user.id },
            update,
            { upsert: true }
        );

        res.json({ recorded: true });
    } catch (e) {
        next(e);
    }
});

router.get('/trending', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const itemsCollection = db.collection('secondChanceItems');

        const windowStart = new Date(Date.now() - TRENDING_WINDOW_HOURS * 60 * 60 * 1000);

        const items = await itemsCollection.aggregate([
            {
                $match: {
                    date_added: { $gte: Math.floor(windowStart.getTime() / 1000) },
                    status: { $ne: 'sold' },
                },
            },
            {
                $addFields: {
                    trendingScore: {
                        $add: [
                            { $multiply: ['$ratingCount', 2] },
                            { $rand: {} },
                        ],
                    },
                },
            },
            { $sort: { trendingScore: -1, date_added: -1 } },
            { $limit: Number(req.query.limit) > 0 ? Number(req.query.limit) : 10 },
        ]).toArray();

        res.json(items);
    } catch (e) {
        next(e);
    }
});

module.exports = router;

