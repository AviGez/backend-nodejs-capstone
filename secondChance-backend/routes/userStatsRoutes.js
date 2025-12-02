const express = require('express');
const { authenticate } = require('../middleware/auth');
const connectToDatabase = require('../models/db');
const { getSellerLevelLabel } = require('../services/userStats');

const router = express.Router();

const getStatsCollection = async () => {
    const db = await connectToDatabase();
    return db.collection('userStats');
};

const sanitizeStats = (doc, includePrivate = false) => {
    if (!doc) {
        return {
            badges: [],
            sellerLevel: 'rookie',
            sellerLevelLabel: getSellerLevelLabel('rookie'),
        };
    }
    const base = {
        badges: doc.badges || [],
        sellerLevel: doc.sellerLevel || 'rookie',
        sellerLevelLabel: getSellerLevelLabel(doc.sellerLevel),
    };
    if (includePrivate) {
        base.itemsListed = doc.itemsListed || 0;
        base.itemsSold = doc.itemsSold || 0;
        base.freeItemsPosted = doc.freeItemsPosted || 0;
        base.averageApprovalHours = doc.approvalsHandled
            ? (doc.totalApprovalResponseHours || 0) / doc.approvalsHandled
            : null;
    }
    return base;
};

router.get('/me', authenticate, async (req, res, next) => {
    try {
        const collection = await getStatsCollection();
        const stats = await collection.findOne({ userId: req.user.id });
        res.json(sanitizeStats(stats, true));
    } catch (e) {
        next(e);
    }
});

router.get('/:userId/public', authenticate, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const collection = await getStatsCollection();
        const stats = await collection.findOne({ userId });
        res.json(sanitizeStats(stats, false));
    } catch (e) {
        next(e);
    }
});

module.exports = router;

