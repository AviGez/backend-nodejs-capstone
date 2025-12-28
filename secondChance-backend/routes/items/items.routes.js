const express = require('express');
const router = express.Router();
const connectToDatabase = require('../../models/db');
const logger = require('../../logger');
const { authenticate } = require('../../middleware/auth');
const { notificationService } = require('../notificationsRoutes');
const { releaseExpiredReservations } = require('../../services/reservations');
const { upload } = require('../utils/uploadConfig');
const { MAX_IMAGES_PER_ITEM } = require('../utils/constants');
const {
    buildItemQuery,
    buildSortOptions,
    parsePickupLocationsInput,
} = require('../utils/itemHelpers');
const { parseLatitude, parseLongitude } = require('../utils/locationHelpers');

// Get all secondChanceItems
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

// Get a single secondChanceItem by ID
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

// Get currently reserved items for logged-in user
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

// Add a new item
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
        console.log('[ITEMS] Item created, calling notifyAdminsNewItem:', { itemId: secondChanceItem.id, itemName: secondChanceItem.name });
        if (notificationService && typeof notificationService.notifyAdminsNewItem === 'function') {
            notificationService.notifyAdminsNewItem({
                itemId: secondChanceItem.id,
                itemName: secondChanceItem.name,
            }).catch((err) => {
                logger.error('Failed to notify admins', err);
                console.error('[ITEMS] Error notifying admins:', err);
            });
        } else {
            console.error('[ITEMS] notificationService.notifyAdminsNewItem is not a function!', typeof notificationService);
        }

        res.status(201).json(insertResult);
    } catch (e) {
        next(e);
    }
});

// Update an existing item
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

        console.log('[ITEMS] Item updated, calling notifyNewItemInCategory:', { category: secondChanceItem.category, itemId: secondChanceItem.id });
        if (notificationService && typeof notificationService.notifyNewItemInCategory === 'function') {
            notificationService.notifyNewItemInCategory({
                category: secondChanceItem.category,
                itemId: secondChanceItem.id,
                itemName: secondChanceItem.name,
            }).catch((err) => {
                logger.error('Failed to notify interested users', err);
                console.error('[ITEMS] Error notifying users:', err);
            });
        } else {
            console.error('[ITEMS] notificationService.notifyNewItemInCategory is not a function!');
        }

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

