const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const connectToDatabase = require('../../models/db');
const { authenticate, authorizeAdmin } = require('../../middleware/auth');
const { notificationService } = require('../notificationsRoutes');
const { releaseExpiredReservations } = require('../../services/reservations');
const logger = require('../../logger');

// Admin - high level statistics
router.get('/admin/stats', authenticate, authorizeAdmin, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        await releaseExpiredReservations(db, notificationService);
        const itemsCollection = db.collection("secondChanceItems");
        const usersCollection = db.collection("users");

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixMonthsAgoSeconds = Math.floor((now.getTime() - (180 * 24 * 60 * 60 * 1000)) / 1000);

        const [
            totalUsers,
            newUsersLast30Days,
            totalItems,
            statusAggregation,
            topCategories,
            recentItems,
            monthlyItems
        ] = await Promise.all([
            usersCollection.countDocuments(),
            usersCollection.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            itemsCollection.countDocuments(),
            itemsCollection.aggregate([
                {
                    $group: {
                        _id: { $ifNull: ['$status', 'available'] },
                        count: { $sum: 1 }
                    }
                }
            ]).toArray(),
            itemsCollection.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ]).toArray(),
            itemsCollection.find(
                {},
                {
                    projection: {
                        id: 1,
                        name: 1,
                        status: 1,
                        category: 1,
                        date_added: 1
                    }
                }
            ).sort({ date_added: -1 }).limit(6).toArray(),
            itemsCollection.aggregate([
                { $match: { date_added: { $gte: sixMonthsAgoSeconds } } },
                {
                    $project: {
                        bucket: {
                            $dateToString: {
                                format: "%Y-%m",
                                date: { $toDate: { $multiply: ['$date_added', 1000] } }
                            }
                        }
                    }
                },
                { $group: { _id: '$bucket', count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]).toArray()
        ]);

        const statusCounts = statusAggregation.reduce((acc, entry) => {
            if (!entry || typeof entry.count !== 'number') {
                return acc;
            }
            const key = entry._id || 'available';
            acc[key] = entry.count;
            return acc;
        }, { available: 0, reserved: 0, sold: 0, pending: 0 });

        res.json({
            summaries: {
                totalUsers,
                newUsersLast30Days,
                totalItems,
                availableItems: statusCounts.available || 0,
                activeReservations: statusCounts.reserved || 0,
                pendingItems: statusCounts.pending || 0,
                soldItems: statusCounts.sold || 0
            },
            statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
                status,
                count
            })),
            topCategories: topCategories.map(cat => ({
                label: cat._id || 'Uncategorized',
                count: cat.count
            })),
            monthlyItems: monthlyItems.map(item => ({
                label: item._id,
                count: item.count
            })),
            recentItems: recentItems.map(item => ({
                id: item.id,
                name: item.name,
                status: item.status || 'available',
                category: item.category || 'General',
                dateAdded: item.date_added
            }))
        });
    } catch (e) {
        next(e);
    }
});

// Admin - get all items with owner details
router.get('/admin/all', authenticate, authorizeAdmin, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        await releaseExpiredReservations(db, notificationService);
        const collection = db.collection("secondChanceItems");
        const usersCollection = db.collection("users");
        const items = await collection.find({}).toArray();

        const ownerIds = [...new Set(items.filter(item => item.ownerId).map(item => item.ownerId))];
        let ownersMap = {};

        if (ownerIds.length > 0) {
            const ownerObjectIds = ownerIds.reduce((acc, id) => {
                try {
                    acc.push(new ObjectId(id));
                } catch (error) {
                    logger.warn(`Skipping invalid ownerId ${id}`);
                }
                return acc;
            }, []);

            if (ownerObjectIds.length > 0) {
                const owners = await usersCollection.find({ _id: { $in: ownerObjectIds } }).toArray();
                ownersMap = owners.reduce((acc, owner) => {
                    acc[owner._id.toString()] = {
                        id: owner._id.toString(),
                        email: owner.email,
                        firstName: owner.firstName,
                        lastName: owner.lastName,
                    };
                    return acc;
                }, {});
            }
        }

        const enrichedItems = items.map(item => ({
            ...item,
            owner: ownersMap[item.ownerId] || null,
        }));

        res.json(enrichedItems);
    } catch (e) {
        next(e);
    }
});

// Admin delete any item
router.delete('/admin/:id', authenticate, authorizeAdmin, async(req, res,next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const id = req.params.id;

        const deleteResult = await collection.deleteOne({ id });
        if (deleteResult.deletedCount === 0) {
            return res.status(404).json({ error: "secondChanceItem not found" });
        }

        res.json({"deleted":"success", "adminOverride": true});
    } catch (e) {
        next(e);
    }
});

module.exports = router;


