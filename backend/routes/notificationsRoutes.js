/*
 * התראות ושירות התראות: notificationsRoutes.js
 * --------------------------------------------
 * תכלית: נקודות קצה לקריאה, סימון ומחיקה של התראות משתמש,
 * וכן שירות עזר (`notificationService`) ליצירת התראות ממודולים אחרים.
 */
const express = require('express');
const { ObjectId } = require('mongodb');
const connectToDatabase = require('../models/db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const router = express.Router();

// סוגי התראות נתמכים
const NOTIFICATION_TYPES = {
    NEW_ITEM_CATEGORY: 'newItemInCategory',
    FEEDBACK: 'feedback',
    ITEM_RELEASED: 'itemReleased',
    NEW_ITEM_ADMIN: 'adminNewItem',
    ITEM_SOLD: 'itemSold',
    PICKUP_APPROVAL_REQUEST: 'pickupApprovalRequest',
    CAROUSEL_EXIT_SOON: 'carouselExitSoon',
    BUYER_FLAGGED: 'buyerFlagged',
};

const normalizeType = (type) => {
    return Object.values(NOTIFICATION_TYPES).includes(type) ? type : NOTIFICATION_TYPES.FEEDBACK;
};

router.get('/', authenticate, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const notificationsCollection = db.collection('notifications');

        const items = await notificationsCollection.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();

        res.json(items);
    } catch (e) {
        next(e);
    }
});

router.post('/mark-read', authenticate, async (req, res, next) => {
    try {
        const { ids = [] } = req.body;
        const db = await connectToDatabase();
        const notificationsCollection = db.collection('notifications');

        if (!Array.isArray(ids) || ids.length === 0) {
            await notificationsCollection.updateMany(
                { userId: req.user.id, readAt: null },
                { $set: { readAt: new Date() } }
            );
            return res.json({ updatedAll: true });
        }

        const objectIds = ids.reduce((acc, id) => {
            try {
                acc.push(new ObjectId(id));
            } catch (e) {
            }
            return acc;
        }, []);

        if (objectIds.length === 0) {
            return res.status(400).json({ error: 'Invalid notification IDs' });
        }

        await notificationsCollection.updateMany(
            { _id: { $in: objectIds }, userId: req.user.id },
            { $set: { readAt: new Date() } }
        );

        res.json({ updated: objectIds.length });
    } catch (e) {
        next(e);
    }
});

router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const notificationsCollection = db.collection('notifications');
        const id = req.params.id;

        let objectId;
        try {
            objectId = new ObjectId(id);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid notification ID' });
        }

        const result = await notificationsCollection.deleteOne({ _id: objectId, userId: req.user.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        res.json({ deleted: true });
    } catch (e) {
        next(e);
    }
});

router.post('/preferences', authenticate, async (req, res, next) => {
    try {
        const { categories = [] } = req.body;
        const db = await connectToDatabase();
        const preferencesCollection = db.collection('notificationPreferences');

        await preferencesCollection.updateOne(
            { userId: req.user.id },
            { $set: { categories, updatedAt: new Date() } },
            { upsert: true }
        );

        res.json({ saved: true });
    } catch (e) {
        next(e);
    }
});

router.get('/preferences', authenticate, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const preferencesCollection = db.collection('notificationPreferences');

        const prefs = await preferencesCollection.findOne({ userId: req.user.id }) || { categories: [] };
        res.json(prefs);
    } catch (e) {
        next(e);
    }
});

const notificationService = {
    async createNotification({ userIds, type, title, message, context = {} }) {
        if (!Array.isArray(userIds) || userIds.length === 0) {
            return;
        }

        const db = await connectToDatabase();
        const notificationsCollection = db.collection('notifications');

        const now = new Date();
        const docs = userIds.map((userId) => ({
            userId,
            type: normalizeType(type),
            title,
            message,
            context,
            createdAt: now,
            readAt: null,
        }));

        await notificationsCollection.insertMany(docs);
    },

    async notifyNewItemInCategory({ category, itemId, itemName }) {
        const db = await connectToDatabase();
        const prefsCollection = db.collection('notificationPreferences');

        const interestedUsers = await prefsCollection.find({ categories: category }).toArray();
        const userIds = interestedUsers.map((pref) => pref.userId);

        if (userIds.length === 0) {
            return;
        }

        await this.createNotification({
            userIds,
            type: NOTIFICATION_TYPES.NEW_ITEM_CATEGORY,
            title: 'New item in your favorite category',
            message: `${itemName} was just posted in ${category}.`,
            context: { itemId },
        });
    },

    async notifyAdminsNewItem({ itemId, itemName }) {
        const db = await connectToDatabase();
        const usersCollection = db.collection('users');

        const admins = await usersCollection.find({ role: 'admin' }).toArray();
        const userIds = admins.map((admin) => admin._id.toString());
        if (userIds.length === 0) {
            return;
        }

        await this.createNotification({
            userIds,
            type: NOTIFICATION_TYPES.NEW_ITEM_ADMIN,
            title: 'New item pending review',
            message: `${itemName} is awaiting your review.`,
            context: { itemId },
        });
    },

    async notifyFeedback({ userId, fromUserName, itemName, feedbackId }) {
        await this.createNotification({
            userIds: [userId],
            type: NOTIFICATION_TYPES.FEEDBACK,
            title: 'You received feedback',
            message: `${fromUserName} left feedback on ${itemName}.`,
            context: { feedbackId },
        });
    },

    async notifyItemReleased({ userId, itemId, itemName }) {
        await this.createNotification({
            userIds: [userId],
            type: NOTIFICATION_TYPES.ITEM_RELEASED,
            title: 'Reserved item released',
            message: `${itemName} is available again.`,
            context: { itemId },
        });
    },

    async notifyItemSold({ sellerId, itemId, itemName, buyerId }) {
        if (!sellerId) {
            return;
        }
        await this.createNotification({
            userIds: [sellerId],
            type: NOTIFICATION_TYPES.ITEM_SOLD,
            title: 'Your item was sold',
            message: `${itemName} has been purchased. Open the chat to coordinate pickup.`,
            context: { itemId, buyerId },
        });
    },

    async notifyPickupApprovalRequest({ sellerId, itemId, itemName, buyerId }) {
        if (!sellerId) {
            return;
        }
        await this.createNotification({
            userIds: [sellerId],
            type: NOTIFICATION_TYPES.PICKUP_APPROVAL_REQUEST,
            title: 'New pickup approval request',
            message: `A buyer asked to pick up ${itemName || 'your item'}. Review the request in chat.`,
            context: { itemId, buyerId },
        });
    },

    async notifyCarouselExitSoon({ sellerId, itemId, itemName, daysLeft }) {
        if (!sellerId) {
            return;
        }
        await this.createNotification({
            userIds: [sellerId],
            type: NOTIFICATION_TYPES.CAROUSEL_EXIT_SOON,
            title: 'Your item is leaving the carousel soon',
            message: `${itemName || 'One of your items'} will rotate out of the featured carousel in ${daysLeft} days.`,
            context: { itemId },
        });
    },

    async notifyAdminsBuyerNoShow({ buyerId, buyerName, email, count }) {
        const db = await connectToDatabase();
        const usersCollection = db.collection('users');
        const admins = await usersCollection.find({ role: 'admin' }).toArray();
        const userIds = admins.map((admin) => admin._id.toString());
        if (userIds.length === 0) {
            return;
        }
        await this.createNotification({
            userIds,
            type: NOTIFICATION_TYPES.BUYER_FLAGGED,
            title: 'Buyer missed pickup repeatedly',
            message: `${buyerName || buyerId} missed pickup ${count} times. Review their account.`,
            context: { buyerId, email, misses: count },
        });
    },

    async notifyBadgeEarned({ userId, badgeId, label }) {
        if (!userId || !badgeId) {
            return;
        }
        await this.createNotification({
            userIds: [userId],
            type: 'badgeEarned',
            title: 'Level up!',
            message: `You earned the ${label} badge.`,
            context: { badgeId, label },
        });
    },
};

router.get('/admin/unread', authenticate, authorizeAdmin, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const notificationsCollection = db.collection('notifications');

        const unread = await notificationsCollection.countDocuments({
            type: NOTIFICATION_TYPES.NEW_ITEM_ADMIN,
            readAt: null
        });

        res.json({ unread });
    } catch (e) {
        next(e);
    }
});

module.exports = {
    notificationsRouter: router,
    notificationService,
    NOTIFICATION_TYPES,
};

