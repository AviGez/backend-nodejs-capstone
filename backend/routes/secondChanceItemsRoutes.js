/*
 * ניהול פריטים (Marketplace): secondChanceItemsRoutes.js
 * -----------------------------------------------------
 * תכלית: נקודות קצה ליצירה/עדכון/מחיקה/חיפוש של פריטים,
 * טיפול בהעלאת תמונות, לוגיקת הזמנות ואישורים מנהליים.
 */
const express = require('express');
const multer = require('multer');
const { ObjectId } = require('mongodb');
const path = require('path');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { notificationService } = require('./notificationsRoutes');
const { releaseExpiredReservations } = require('../services/reservations');

// מיקום לשמירת תמונות שהועלו
const directoryPath = 'public/images';

// קונפיגורציית אחסון עבור multer: קביעת תיקייה ושם קובץ ייחודי
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
        // מגדירים את תיקיית היעד לשמירת הקבצים שהועלו
        cb(null, directoryPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    const safeBaseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 32) || 'item';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBaseName}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage: storage });

// סטטוסים אפשריים לאישור פריט
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
// קבלת מסמך אישור פריט
const getApprovalDoc = async (db, itemId, buyerId, sellerId) => {
    const approvalsCollection = db.collection('itemApprovals');
    return approvalsCollection.findOne({ itemId, buyerId, sellerId });
};

const MAX_PICKUP_LOCATIONS = 1;
// משך זמן (בשניות) לפריט להיות ב'קרוסלה' (כאן 7 ימים)
const CAROUSEL_WINDOW_SECONDS = 7 * 24 * 60 * 60;
// התרעה לפני הוצאת הפריט מהקרוסלה (כאן 2 ימים לפני הסוף)
const CAROUSEL_NOTICE_SECONDS = CAROUSEL_WINDOW_SECONDS - (2 * 24 * 60 * 60);
const MAX_LAT = 90;
const MIN_LAT = -90;
const MAX_LNG = 180;
const MIN_LNG = -180;

// פונקציה לסינון והמרת קואורדינטות (latitude/longitude)
const parseCoordinate = (value, min, max) => {
    if (typeof value === 'undefined' || value === null || value === '') {
        return undefined;
    }
    const num = Number(value);
    if (Number.isNaN(num) || !Number.isFinite(num)) {
        return undefined;
    }
    if (num < min || num > max) {
        return undefined;
    }
    return num;
};

const parseLatitude = (value) => parseCoordinate(value, MIN_LAT, MAX_LAT);
const parseLongitude = (value) => parseCoordinate(value, MIN_LNG, MAX_LNG);

// פרסינג וניקוי של מיקומי איסוף שהמשתמש מספק
const parsePickupLocationsInput = (input) => {
    if (!input) {
        return [];
    }

    let parsed = input;
    if (typeof input === 'string') {
        try {
            parsed = JSON.parse(input);
        } catch (e) {
            return [];
        }
    }

    if (!Array.isArray(parsed)) {
        return [];
    }

    const cleaned = [];
    for (const entry of parsed) {
        if (!entry) {
            continue;
        }
        const label = (entry.label || '').toString().trim();
        const city = (entry.city || '').toString().trim();
        const address = (entry.address || '').toString().trim();
        if (!label || !city || !address) {
            continue;
        }
        const location = {
            label,
            city,
            area: (entry.area || '').toString().trim(),
            address,
        };
        const lat = Number(entry.lat);
        const lng = Number(entry.lng);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            location.lat = lat;
            location.lng = lng;
        }
        cleaned.push(location);
        if (cleaned.length >= MAX_PICKUP_LOCATIONS) {
            break;
        }
    }
    return cleaned;
};

// ניקוי/הגבלת שדות במיקומי איסוף לפני החזרת תגובה ללקוח
const sanitizePickupLocations = (locations = [], canViewFullDetails = false) => {
    return locations.slice(0, MAX_PICKUP_LOCATIONS).map((loc) => {
        const sanitized = {
            label: loc.label,
            city: loc.city,
            area: loc.area,
        };
        if (canViewFullDetails) {
            sanitized.address = loc.address;
            if (typeof loc.lat === 'number') {
                sanitized.lat = loc.lat;
            }
            if (typeof loc.lng === 'number') {
                sanitized.lng = loc.lng;
            }
        }
        return sanitized;
    });
};

const toRadians = (deg) => (deg * Math.PI) / 180;
const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
// חישוב ניקוד התאמה לפי מיקום (עיר ואזור)
const computeCityMatchScore = (location, buyerCity = '', buyerArea = '') => {
    let score = 0;
    if (
        buyerCity &&
        location.city &&
        location.city.toLowerCase() === buyerCity.toLowerCase()
    ) {
        score += 2;
    }
    if (
        buyerArea &&
        location.area &&
        location.area.toLowerCase() === buyerArea.toLowerCase()
    ) {
        score += 1;
    }
    return score;
};

// בניית שאילתת MongoDB לפי פרמטרי חיפוש
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

const buildSortOptions = () => ({});

// נקודת קצה: החזרת כל הפריטים (עם יישום סינון חיפוש)
router.get('/', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        await releaseExpiredReservations(db, notificationService);
        const collection = db.collection("secondChanceItems");
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
// נקודת קצה: החזרת פריטי הקרוסלה
router.get('/carousel', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        await releaseExpiredReservations(db, notificationService);
        const collection = db.collection('secondChanceItems');

        const nowSeconds = Math.floor(Date.now() / 1000);
        const windowStart = nowSeconds - CAROUSEL_WINDOW_SECONDS;
        const noticeThreshold = nowSeconds - CAROUSEL_NOTICE_SECONDS;

        // Always return the 15 newest items, regardless of date
        const items = await collection.find({
            status: { $ne: 'sold' },
        })
            .sort({ date_added: -1 })
            .limit(15)
            .toArray();

        // Check for items that need carousel exit notification (within the 7-day window)
        const notifyCandidates = await collection.find({
            date_added: { $lte: noticeThreshold, $gte: windowStart },
            carouselExitNotified: { $ne: true },
            ownerId: { $exists: true, $ne: null },
        }, {
            projection: { _id: 1, id: 1, name: 1, ownerId: 1, date_added: 1 },
        }).toArray();

        for (const candidate of notifyCandidates) {
            const ageSeconds = nowSeconds - (candidate.date_added || nowSeconds);
            const secondsLeft = Math.max(CAROUSEL_WINDOW_SECONDS - ageSeconds, 0);
            const daysLeft = Math.max(1, Math.round(secondsLeft / (24 * 60 * 60)));

            await notificationService.notifyCarouselExitSoon({
                sellerId: candidate.ownerId,
                itemId: candidate.id,
                itemName: candidate.name,
                daysLeft,
            });

            await collection.updateOne(
                { _id: candidate._id },
                { $set: { carouselExitNotified: true, carouselExitNotifiedAt: new Date() } }
            );
        }

        res.json(items);
    } catch (e) {
        next(e);
    }
});

// נקודת קצה: החזרת פריטי שמורים נוכחיים למשתמש המחובר
router.get('/reservations/me', authenticate, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        await releaseExpiredReservations(db, notificationService);
        const collection = db.collection("secondChanceItems");

        const items = await collection.find({
            status: 'reserved',
            reservedByUserId: req.user.id
        }).toArray();

        res.json(items);
    } catch (e) {
        next(e);
    }
});
// נקודת קצה: החזרת כל הפריטים של המשתמש המחובר
router.get('/mine', authenticate, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        await releaseExpiredReservations(db, notificationService);
        const collection = db.collection("secondChanceItems");

        const items = await collection.find({
            ownerId: req.user.id,
        })
            .sort({ date_added: -1 })
            .limit(100)
            .toArray();

        res.json(items);
    } catch (e) {
        next(e);
    }
});

// נקודת קצה: סטטיסטיקות מנהל עבור לוח בקרה
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

// נקודת קצה: החזרת כל הפריטים (למנהל)
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

// נקודת קצה: החזרת פריט בודד לפי מזהה
router.get('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        await releaseExpiredReservations(db, notificationService);
        const collection = db.collection("secondChanceItems");
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


// הוספת פריט חדש
const MAX_IMAGES_PER_ITEM = 5;

router.post('/', authenticate, upload.array('images', MAX_IMAGES_PER_ITEM), async (req, res, next) => {
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

        const descriptionInput = (req.body.description || '').toString();

        const date_added = Math.floor(new Date().getTime() / 1000);
        secondChanceItem.date_added = date_added;
        secondChanceItem.ownerId = req.user.id;
        secondChanceItem.ownerEmail = req.user.email;
        secondChanceItem.status = 'available';
        secondChanceItem.reservedByUserId = null;
        secondChanceItem.reservedUntil = null;
        secondChanceItem.carouselExitNotified = false;
        const files = Array.isArray(req.files) ? req.files : [];
        const galleryImages = files.map((file) => `/images/${file.filename || file.originalname}`);
        if (galleryImages.length > 0) {
            secondChanceItem.image = galleryImages[0];
            secondChanceItem.galleryImages = galleryImages;
        } else {
            secondChanceItem.image = secondChanceItem.image || '';
            if (secondChanceItem.galleryImages) {
                try {
                    const parsed = JSON.parse(secondChanceItem.galleryImages);
                    secondChanceItem.galleryImages = Array.isArray(parsed) ? parsed : [];
                } catch (err) {
                    secondChanceItem.galleryImages = [];
                }
            } else {
                secondChanceItem.galleryImages = [];
            }
        }
        secondChanceItem.city = req.body.city || '';
        secondChanceItem.area = req.body.area || '';
        secondChanceItem.mapUrl = req.body.mapUrl || '';
        secondChanceItem.price = Number(req.body.price) || 0;
        const lat = parseLatitude(req.body.lat);
        const lng = parseLongitude(req.body.lng);
        if (typeof lat === 'number') {
            secondChanceItem.lat = lat;
        }
        if (typeof lng === 'number') {
            secondChanceItem.lng = lng;
        }
        secondChanceItem.description = descriptionInput;
        secondChanceItem.pickupLocations = parsePickupLocationsInput(req.body.pickupLocations);

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

// עדכון פריט קיים
router.put('/:id', authenticate, async(req, res,next) => {
    try {
        const db = await connectToDatabase();
        await releaseExpiredReservations(db, notificationService);
        const collection = db.collection("secondChanceItems");
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
        if (typeof req.body.description === 'string') {
            secondChanceItem.description = req.body.description;
        }
        secondChanceItem.age_years = Number((secondChanceItem.age_days/365).toFixed(1));
        secondChanceItem.city = req.body.city || secondChanceItem.city || '';
        secondChanceItem.area = req.body.area || secondChanceItem.area || '';
        secondChanceItem.mapUrl = req.body.mapUrl || secondChanceItem.mapUrl || '';
        if (typeof req.body.price !== 'undefined') {
            secondChanceItem.price = Number(req.body.price) || 0;
        }
        if (typeof req.body.lat !== 'undefined') {
            const lat = parseLatitude(req.body.lat);
            if (typeof lat === 'number') {
                secondChanceItem.lat = lat;
            }
        }
        if (typeof req.body.lng !== 'undefined') {
            const lng = parseLongitude(req.body.lng);
            if (typeof lng === 'number') {
                secondChanceItem.lng = lng;
            }
        }
        if (typeof req.body.pickupLocations !== 'undefined') {
            secondChanceItem.pickupLocations = parsePickupLocationsInput(req.body.pickupLocations);
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
// בקשת אישור לאיסוף פריט
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
        notificationService.notifyPickupApprovalRequest({
            sellerId,
            buyerId,
            itemId,
            itemName: item.name,
        }).catch((err) => logger.error('Failed to notify seller of pickup request', err));
        res.status(201).json(saved);
    } catch (e) {
        next(e);
    }
});
// אישור בקשת איסוף פריט על ידי המוכר
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
        if (item.status === 'sold') {
            return res.status(409).json({ error: "Item is already sold" });
        }
        if (item.status === 'reserved' && item.reservedByUserId && item.reservedByUserId !== buyerId) {
            return res.status(409).json({ error: "Item is currently reserved for another buyer" });
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

        const pickupDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const itemUpdateResult = await itemsCollection.updateOne(
            {
                id: itemId,
                $or: [
                    { status: { $exists: false } },
                    { status: 'available' },
                    { status: 'reserved', reservedByUserId: buyerId },
                ],
                status: { $ne: 'sold' },
            },
            {
                $set: {
                    status: 'reserved',
                    reservedByUserId: buyerId,
                    reservedUntil: pickupDeadline,
                    reservedReason: 'pickupApproval',
                    pickupApprovedAt: now,
                },
            }
        );

        if (itemUpdateResult.matchedCount === 0) {
            return res.status(409).json({ error: "Item is not available for pickup approval" });
        }

        res.json({
            approval,
            chatId: chat?._id?.toString(),
        });
    } catch (e) {
        next(e);
    }
});
// נקודת קצה: קבלת מידע מאובטח על פריט בהתאם לתפקיד המשתמש
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

        const canViewFullPickupLocations =
            role === 'seller' || response.approvalStatus === APPROVAL_STATUSES.APPROVED;
        response.pickupLocations = sanitizePickupLocations(
            item.pickupLocations || [],
            canViewFullPickupLocations
        );

        res.json(response);
    } catch (e) {
        next(e);
    }
});
// נקודת קצה: קבלת אפשרויות איסוף פריט עם סינון ומיון
router.get('/:id/pickup-options', authenticate, async (req, res, next) => {
    try {
        const { lat, lng, city: buyerCity = '', area: buyerArea = '' } = req.query || {};
        const db = await connectToDatabase();
        await ensureApprovalsIndex(db);
        const itemsCollection = db.collection("secondChanceItems");
        const approvalsCollection = db.collection('itemApprovals');

        const itemId = req.params.id;
        const item = await itemsCollection.findOne({ id: itemId });
        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }

        const pickupLocations = Array.isArray(item.pickupLocations) ? item.pickupLocations.slice(0, MAX_PICKUP_LOCATIONS) : [];
        if (!pickupLocations.length) {
            return res.json([]);
        }

        let canViewFullDetails = false;
        if (item.ownerId === req.user.id) {
            canViewFullDetails = true;
        } else {
            const approval = await approvalsCollection.findOne({
                itemId,
                buyerId: req.user.id,
                status: APPROVAL_STATUSES.APPROVED,
            });
            if (approval) {
                canViewFullDetails = true;
            }
        }

        const hasCoordsQuery =
            typeof lat !== 'undefined' &&
            typeof lng !== 'undefined' &&
            lat !== '' &&
            lng !== '' &&
            !Number.isNaN(parseFloat(lat)) &&
            !Number.isNaN(parseFloat(lng));

        const buyerLat = hasCoordsQuery ? parseFloat(lat) : null;
        const buyerLng = hasCoordsQuery ? parseFloat(lng) : null;

        const enriched = pickupLocations.map((loc) => {
            let distanceKm = null;
            if (
                hasCoordsQuery &&
                typeof loc.lat !== 'undefined' &&
                typeof loc.lng !== 'undefined' &&
                !Number.isNaN(Number(loc.lat)) &&
                !Number.isNaN(Number(loc.lng))
            ) {
                distanceKm = haversineDistanceKm(
                    buyerLat,
                    buyerLng,
                    Number(loc.lat),
                    Number(loc.lng)
                );
            }
            const cityScore = hasCoordsQuery ? null : computeCityMatchScore(loc, buyerCity, buyerArea);
            return { location: loc, distanceKm, cityScore };
        });

        enriched.sort((a, b) => {
            if (hasCoordsQuery) {
                if (a.distanceKm == null && b.distanceKm == null) {
                    return 0;
                }
                if (a.distanceKm == null) {
                    return 1;
                }
                if (b.distanceKm == null) {
                    return -1;
                }
                return a.distanceKm - b.distanceKm;
            }
            const scoreA = a.cityScore || 0;
            const scoreB = b.cityScore || 0;
            return scoreB - scoreA;
        });
        // הגבלת מספר מיקומי האיסוף המוחזרים
        const result = enriched.slice(0, MAX_PICKUP_LOCATIONS).map(({ location, distanceKm }) => {
            const base = {
                label: location.label,
                city: location.city,
                area: location.area,
            };
            if (distanceKm != null) {
                base.distanceKm = Number(distanceKm.toFixed(2));
            }
            if (canViewFullDetails) {
                base.address = location.address;
                if (typeof location.lat !== 'undefined') {
                    base.lat = location.lat;
                }
                if (typeof location.lng !== 'undefined') {
                    base.lng = location.lng;
                }
            }
            return base;
        });

        res.json(result);
    } catch (e) {
        next(e);
    }
});

// שמירת פריט (הזמנתו) על ידי משתמש מחובר
router.post('/:id/reserve', authenticate, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        await releaseExpiredReservations(db, notificationService);
        const collection = db.collection("secondChanceItems");

        const id = req.params.id;
        const secondChanceItem = await collection.findOne({ id });

        if (!secondChanceItem) {
            return res.status(404).json({ error: "secondChanceItem not found" });
        }

        if (secondChanceItem.status && secondChanceItem.status !== 'available') {
            return res.status(409).json({ error: "Item is not available for reservation" });
        }

        const reservedUntil = new Date(Date.now() + 10 * 60 * 60 * 1000);

        const updateResult = await collection.updateOne(
            { id, $or: [{ status: { $exists: false } }, { status: 'available' }] },
            {
                $set: {
                    status: 'reserved',
                    reservedByUserId: req.user.id,
                    reservedUntil
                }
            }
        );

        if (updateResult.modifiedCount === 0) {
            logger.error(`Failed to reserve item: ${id}`);
            return res.status(409).json({ error: "Item could not be reserved" });
        }

        const updatedItem = await collection.findOne({ id });
        logger.info(`Item reserved successfully: ${id} by user: ${req.user.id}`);
        res.json(updatedItem);
    } catch (e) {
        next(e);
    }
});

// מחיקת פריט כלשהו על ידי מנהל
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

// נקודת קצה: מחיקת פריט על ידי הבעלים או מנהל
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

// ביטול הזמנת פריט על ידי משתמש שהזמין אותו
router.post('/:id/cancel-reservation', authenticate, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const id = req.params.id;

        const item = await collection.findOne({ id });
        
        logger.info(`Cancel reservation attempt - Item: ${id}, Status: ${item?.status}, ReservedBy: ${item?.reservedByUserId}, CurrentUser: ${req.user.id}`);

        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }

        if (item.status !== 'reserved') {
            return res.status(400).json({ error: `Item is not reserved. Current status: ${item.status || 'available'}` });
        }

        if (item.reservedByUserId !== req.user.id) {
            return res.status(403).json({ error: "You did not reserve this item" });
        }

        const updateResult = await collection.updateOne(
            { id },
            {
                $set: { status: 'available' },
                $unset: { reservedByUserId: '', reservedUntil: '' }
            }
        );

        if (updateResult.modifiedCount === 0) {
            logger.error(`Failed to cancel reservation for item: ${id}`);
            return res.status(409).json({ error: "Reservation could not be cancelled" });
        }

        const updatedItem = await collection.findOne({ id });
        logger.info(`Reservation cancelled successfully for item: ${id}`);
        res.json(updatedItem);
    } catch (e) {
        next(e);
    }
});

module.exports = router;