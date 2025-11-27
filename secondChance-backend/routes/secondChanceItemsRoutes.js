const express = require('express');
const multer = require('multer');
const { ObjectId } = require('mongodb');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { notificationService } = require('./notificationsRoutes');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath); // Specify the upload directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });

const releaseExpiredReservations = async (collection) => {
    const now = new Date();
    await collection.updateMany(
        {
            status: 'reserved',
            reservedUntil: { $lt: now }
        },
        {
            $set: {
                status: 'available',
                reservedByUserId: null,
                reservedUntil: null
            }
        }
    );

    await collection.updateMany(
        { status: { $exists: false } },
        {
            $set: {
                status: 'available',
                reservedByUserId: null,
                reservedUntil: null
            }
        }
    );
};

const APPROVAL_STATUSES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

let approvalsIndexEnsured = false;
const ensureApprovalsIndex = async (db) => {
    if (approvalsIndexEnsured) {
        return;
    }
    const approvalsCollection = db.collection('itemApprovals');
    await approvalsCollection.createIndex(
        { itemId: 1, buyerId: 1, sellerId: 1 },
        { unique: true }
    );
    approvalsIndexEnsured = true;
};

const getApprovalDoc = async (db, itemId, buyerId, sellerId) => {
    const approvalsCollection = db.collection('itemApprovals');
    return approvalsCollection.findOne({ itemId, buyerId, sellerId });
};

const buildItemQuery = (params) => {
    const query = {};

    if (params.name && params.name.trim() !== '') {
        query.name = { $regex: params.name.trim(), $options: "i" };
    }
    if (params.category) {
        query.category = params.category;
    }
    if (params.condition) {
        query.condition = params.condition;
    }
    if (params.age_years) {
        const ageYears = parseInt(params.age_years, 10);
        if (!isNaN(ageYears)) {
            query.age_years = { $lte: ageYears };
        }
    }
    if (params.city && params.city.trim() !== '') {
        query.city = params.city.trim();
    }
    if (params.area && params.area.trim() !== '') {
        query.area = params.area.trim();
    }

    return query;
};

const buildSortOptions = (sortParam) => {
    if (sortParam === 'rating_desc') {
        return { averageRating: -1, ratingCount: -1 };
    }
    return {};
};

// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    try {
        const db = await connectToDatabase();

        const collection = db.collection("secondChanceItems");
        await releaseExpiredReservations(collection);
        const query = buildItemQuery(req.query || {});
        const sortOptions = buildSortOptions(req.query?.sort);
        let cursor = collection.find(query);
        if (Object.keys(sortOptions).length) {
            cursor = cursor.sort(sortOptions);
        }
        const secondChanceItems = await cursor.toArray();
        res.json(secondChanceItems);
    } catch (e) {
        logger.error('Something went wrong ', e);
        next(e);
    }
});

// Get currently reserved items for logged-in user
router.get('/reservations/me', authenticate, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        await releaseExpiredReservations(collection);

        const items = await collection.find({
            status: 'reserved',
            reservedByUserId: req.user.id
        }).toArray();

        res.json(items);
    } catch (e) {
        next(e);
    }
});

// Admin - high level statistics
router.get('/admin/stats', authenticate, authorizeAdmin, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const itemsCollection = db.collection("secondChanceItems");
        const usersCollection = db.collection("users");
        await releaseExpiredReservations(itemsCollection);

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixMonthsAgoSeconds = Math.floor((now.getTime() - (180 * 24 * 60 * 60 * 1000)) / 1000);

        const [
            totalUsers,
            newUsersLast30Days,
            totalItems,
            statusAggregation,
            ratingAggregation,
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
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: { $ifNull: ['$averageRating', 0] } },
                        totalRatings: { $sum: { $ifNull: ['$ratingCount', 0] } }
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
                        averageRating: 1,
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

        const ratingStats = ratingAggregation[0] || { avgRating: 0, totalRatings: 0 };

        res.json({
            summaries: {
                totalUsers,
                newUsersLast30Days,
                totalItems,
                availableItems: statusCounts.available || 0,
                activeReservations: statusCounts.reserved || 0,
                pendingItems: statusCounts.pending || 0,
                soldItems: statusCounts.sold || 0,
                averageRating: Number((ratingStats.avgRating || 0).toFixed(2)),
                totalRatings: ratingStats.totalRatings || 0
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
                averageRating: item.averageRating || 0,
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
        const collection = db.collection("secondChanceItems");
        await releaseExpiredReservations(collection);
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

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        await releaseExpiredReservations(collection);
        const id = req.params.id;
        const secondChanceItem = await collection.findOne({ id: id });

        if (!secondChanceItem) {
            return res.status(404).json({ error: "secondChanceItem not found" });
        }

        res.json(secondChanceItem);
    } catch (e) {
        next(e);
    }
});


// Add a new item
router.post('/', authenticate, upload.single('file'), async(req, res,next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const lastItemQuery = await collection.find().sort({'id': -1}).limit(1);
        let secondChanceItem = req.body;

        await lastItemQuery.forEach(item => {
            secondChanceItem.id = (parseInt(item.id) + 1).toString();
        });

        if (!secondChanceItem.id) {
            secondChanceItem.id = '1';
        }

        const date_added = Math.floor(new Date().getTime() / 1000);
        secondChanceItem.date_added = date_added;
        secondChanceItem.ownerId = req.user.id;
        secondChanceItem.ownerEmail = req.user.email;
        secondChanceItem.status = 'available';
        secondChanceItem.reservedByUserId = null;
        secondChanceItem.reservedUntil = null;
        secondChanceItem.averageRating = 0;
        secondChanceItem.ratingCount = 0;
        secondChanceItem.ratings = [];
        secondChanceItem.city = req.body.city || '';
        secondChanceItem.area = req.body.area || '';
        secondChanceItem.mapUrl = req.body.mapUrl || '';
        secondChanceItem.price = Number(req.body.price) || 0;

        const insertResult = await collection.insertOne(secondChanceItem);
        notificationService.notifyAdminsNewItem({
            itemId: secondChanceItem.id,
            itemName: secondChanceItem.name,
        }).catch((err) => logger.error('Failed to notify admins', err));

        res.status(201).json(insertResult);
    } catch (e) {
        next(e);
    }
});

// Update an existing item
router.put('/:id', authenticate, async(req, res,next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        await releaseExpiredReservations(collection);
        const id = req.params.id;
        const secondChanceItem = await collection.findOne({ id });

        if (!secondChanceItem) {
            logger.error('secondChanceItem not found');
            return res.status(404).json({ error: "secondChanceItem not found" });
        }

        const isOwner = secondChanceItem.ownerId && secondChanceItem.ownerId === req.user.id;
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ error: "You do not have permission to update this item" });
        }

        secondChanceItem.category = req.body.category;
        secondChanceItem.condition = req.body.condition;
        secondChanceItem.age_days = req.body.age_days;
        secondChanceItem.description = req.body.description;
        secondChanceItem.age_years = Number((secondChanceItem.age_days/365).toFixed(1));
        secondChanceItem.city = req.body.city || secondChanceItem.city || '';
        secondChanceItem.area = req.body.area || secondChanceItem.area || '';
        secondChanceItem.mapUrl = req.body.mapUrl || secondChanceItem.mapUrl || '';
        if (typeof req.body.price !== 'undefined') {
            secondChanceItem.price = Number(req.body.price) || 0;
        }
        secondChanceItem.updatedAt = new Date();

        const updatedItem = await collection.findOneAndUpdate(
            { id },
            { $set: secondChanceItem },
            { returnDocument: 'after' }
        );

        if(updatedItem.value) {
            res.json({ updated: "success" });
        } else {
            res.status(500).json({ error: "Failed to update item" });
        }

        notificationService.notifyNewItemInCategory({
            category: secondChanceItem.category,
            itemId: secondChanceItem.id,
            itemName: secondChanceItem.name,
        }).catch((err) => logger.error('Failed to notify interested users', err));

    } catch (e) {
        next(e);
    }
});

router.post('/:id/request-approval', authenticate, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        await ensureApprovalsIndex(db);
        const approvalsCollection = db.collection('itemApprovals');
        const itemsCollection = db.collection("secondChanceItems");
        const itemId = req.params.id;
        const item = await itemsCollection.findOne({ id: itemId });

        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }
        if (item.ownerId === req.user.id) {
            return res.status(400).json({ error: "You cannot request approval for your own item" });
        }

        const sellerId = item.ownerId;
        const buyerId = req.user.id;

        const existing = await approvalsCollection.findOne({ itemId, buyerId, sellerId });
        if (existing) {
            return res.json(existing);
        }

        const now = new Date();
        const approval = {
            itemId,
            buyerId,
            sellerId,
            status: APPROVAL_STATUSES.PENDING,
            createdAt: now,
            updatedAt: now,
        };

        const insertResult = await approvalsCollection.insertOne(approval);
        const saved = await approvalsCollection.findOne({ _id: insertResult.insertedId });
        res.status(201).json(saved);
    } catch (e) {
        next(e);
    }
});

router.post('/:id/approve-buyer', authenticate, async (req, res, next) => {
    try {
        const { buyerId } = req.body;
        if (!buyerId) {
            return res.status(400).json({ error: "buyerId is required" });
        }

        const db = await connectToDatabase();
        await ensureApprovalsIndex(db);
        const approvalsCollection = db.collection('itemApprovals');
        const itemsCollection = db.collection("secondChanceItems");
        const chatsCollection = db.collection('chats');

        const itemId = req.params.id;
        const item = await itemsCollection.findOne({ id: itemId });

        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }
        if (item.ownerId !== req.user.id) {
            return res.status(403).json({ error: "Only the owner can approve buyers" });
        }

        const sellerId = item.ownerId;
        const now = new Date();

        await approvalsCollection.updateOne(
            { itemId, buyerId, sellerId },
            {
                $set: {
                    status: APPROVAL_STATUSES.APPROVED,
                    updatedAt: now,
                    createdAt: now,
                },
            },
            { upsert: true }
        );

        let chat = await chatsCollection.findOne({ itemId, buyerId, sellerId });
        if (!chat) {
            const insertResult = await chatsCollection.insertOne({
                itemId,
                buyerId,
                sellerId,
                isApproved: true,
                createdAt: now,
                updatedAt: now,
            });
            chat = await chatsCollection.findOne({ _id: insertResult.insertedId });
        } else if (!chat.isApproved) {
            await chatsCollection.updateOne(
                { _id: chat._id },
                { $set: { isApproved: true, updatedAt: now } }
            );
            chat = await chatsCollection.findOne({ _id: chat._id });
        }

        const approval = await approvalsCollection.findOne({ itemId, buyerId, sellerId });

        res.json({
            approval,
            chatId: chat?._id?.toString(),
        });
    } catch (e) {
        next(e);
    }
});

router.get('/:id/secure', authenticate, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        await ensureApprovalsIndex(db);
        const itemsCollection = db.collection("secondChanceItems");
        const approvalsCollection = db.collection('itemApprovals');
        const usersCollection = db.collection('users');
        const chatsCollection = db.collection('chats');

        const itemId = req.params.id;
        const item = await itemsCollection.findOne({ id: itemId });
        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }

        let role = 'viewer';
        if (item.ownerId === req.user.id) {
            role = 'seller';
        }

        const response = {
            role,
            approvalStatus: null,
            approvals: [],
            chatId: null,
        };

        if (role === 'seller') {
            const approvals = await approvalsCollection.find({
                itemId,
                sellerId: req.user.id,
            }).toArray();

            const buyerIds = approvals.map((a) => new ObjectId(a.buyerId)).filter(Boolean);
            let buyersMap = {};
            if (buyerIds.length > 0) {
                const buyers = await usersCollection.find({ _id: { $in: buyerIds } }).toArray();
                buyersMap = buyers.reduce((acc, user) => {
                    acc[user._id.toString()] = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
                    return acc;
                }, {});
            }

            const approvalsWithNames = [];
            for (const approval of approvals) {
                let chatId = null;
                const chat = await chatsCollection.findOne({
                    itemId,
                    buyerId: approval.buyerId,
                    sellerId: approval.sellerId,
                });
                if (chat) {
                    chatId = chat._id.toString();
                }
                approvalsWithNames.push({
                    buyerId: approval.buyerId,
                    buyerName: buyersMap[approval.buyerId] || approval.buyerId,
                    status: approval.status,
                    updatedAt: approval.updatedAt,
                    chatId,
                });
            }

            response.approvals = approvalsWithNames;
        } else {
            const approval = await approvalsCollection.findOne({
                itemId,
                buyerId: req.user.id,
            });

            if (approval) {
                response.approvalStatus = approval.status;

                if (approval.status === APPROVAL_STATUSES.APPROVED) {
                    const chat = await chatsCollection.findOne({
                        itemId,
                        buyerId: req.user.id,
                        sellerId: item.ownerId,
                    });
                    if (chat) {
                        response.chatId = chat._id.toString();
                    }
                }
            }
        }

        res.json(response);
    } catch (e) {
        next(e);
    }
});

// Reserve an item for 10 hours
router.post('/:id/reserve', authenticate, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        await releaseExpiredReservations(collection);

        const id = req.params.id;
        const secondChanceItem = await collection.findOne({ id });

        if (!secondChanceItem) {
            return res.status(404).json({ error: "secondChanceItem not found" });
        }

        if (secondChanceItem.status && secondChanceItem.status !== 'available') {
            return res.status(409).json({ error: "Item is not available for reservation" });
        }

        const reservedUntil = new Date(Date.now() + 10 * 60 * 60 * 1000);

        const updated = await collection.findOneAndUpdate(
            { id, $or: [{ status: { $exists: false } }, { status: 'available' }] },
            {
                $set: {
                    status: 'reserved',
                    reservedByUserId: req.user.id,
                    reservedUntil
                }
            },
            { returnDocument: 'after' }
        );

        if (!updated.value) {
            return res.status(409).json({ error: "Item could not be reserved" });
        }

        res.json(updated.value);
    } catch (e) {
        next(e);
    }
});

// Rate an item (1-5 stars)
router.post('/:id/rate', authenticate, async (req, res, next) => {
    try {
        const { value } = req.body;
        const numericValue = parseInt(value, 10);

        if (isNaN(numericValue) || numericValue < 1 || numericValue > 5) {
            return res.status(400).json({ error: "Rating value must be an integer between 1 and 5" });
        }

        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const id = req.params.id;

        const secondChanceItem = await collection.findOne({ id });

        if (!secondChanceItem) {
            return res.status(404).json({ error: "secondChanceItem not found" });
        }

        const ratings = secondChanceItem.ratings || [];
        const userId = req.user.id;
        const existingIndex = ratings.findIndex((rating) => rating.userId === userId);

        if (existingIndex >= 0) {
            ratings[existingIndex].value = numericValue;
        } else {
            ratings.push({ userId, value: numericValue });
        }

        const ratingCount = ratings.length;
        const ratingSum = ratings.reduce((sum, rating) => sum + rating.value, 0);
        const averageRating = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(2)) : 0;

        const updated = await collection.findOneAndUpdate(
            { id },
            {
                $set: {
                    ratings,
                    ratingCount,
                    averageRating
                }
            },
            { returnDocument: 'after' }
        );

        if (!updated.value) {
            return res.status(500).json({ error: "Failed to update rating" });
        }

        res.json(updated.value);
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

// Delete an existing item (owner or admin)
router.delete('/:id', authenticate, async(req, res,next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const id = req.params.id;
        const secondChanceItem = await collection.findOne({ id });

        if (!secondChanceItem) {
            logger.error('secondChanceItem not found');
            return res.status(404).json({ error: "secondChanceItem not found" });
        }

        const isOwner = secondChanceItem.ownerId && secondChanceItem.ownerId === req.user.id;
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ error: "You do not have permission to delete this item" });
        }

        await collection.deleteOne({ id });
        res.json({"deleted":"success"});
    } catch (e) {
        next(e);
    }
});

module.exports = router;