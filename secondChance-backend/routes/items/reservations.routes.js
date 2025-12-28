const express = require('express');
const router = express.Router();
const connectToDatabase = require('../../models/db');
const { authenticate } = require('../../middleware/auth');
const { notificationService } = require('../notificationsRoutes');
const { releaseExpiredReservations } = require('../../services/reservations');

// Get currently reserved items for logged-in user
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

// Reserve an item for 10 hours
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

module.exports = router;


