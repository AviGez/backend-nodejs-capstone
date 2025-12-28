const express = require('express');
const router = express.Router();
const connectToDatabase = require('../../models/db');
const { notificationService } = require('../notificationsRoutes');
const { releaseExpiredReservations } = require('../../services/reservations');
const { CAROUSEL_WINDOW_SECONDS, CAROUSEL_NOTICE_SECONDS } = require('../utils/constants');

router.get('/carousel', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        await releaseExpiredReservations(db, notificationService);
        const collection = db.collection('secondChanceItems');

        const nowSeconds = Math.floor(Date.now() / 1000);
        const windowStart = nowSeconds - CAROUSEL_WINDOW_SECONDS;
        const noticeThreshold = nowSeconds - CAROUSEL_NOTICE_SECONDS;

        const [items, notifyCandidates] = await Promise.all([
            collection.find({
                date_added: { $gte: windowStart },
                status: { $ne: 'sold' },
            })
                .sort({ date_added: -1 })
                .limit(20)
                .toArray(),
            collection.find({
                date_added: { $lte: noticeThreshold, $gte: windowStart },
                carouselExitNotified: { $ne: true },
                ownerId: { $exists: true, $ne: null },
            }, {
                projection: { _id: 1, id: 1, name: 1, ownerId: 1, date_added: 1 },
            }).toArray(),
        ]);

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

module.exports = router;


