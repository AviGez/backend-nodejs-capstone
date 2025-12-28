const express = require('express');
const router = express.Router();
const connectToDatabase = require('../../models/db');
const { authenticate } = require('../../middleware/auth');
const { notificationService, NOTIFICATION_TYPES } = require('../notificationsRoutes');
const logger = require('../../logger');
const { APPROVAL_STATUSES } = require('../utils/constants');
const { ensureApprovalsIndex } = require('../utils/approvalHelpers');

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
        console.log('[ITEMS] Pickup approval requested, calling notifyPickupApprovalRequest:', { sellerId, buyerId, itemId });
        if (notificationService && typeof notificationService.notifyPickupApprovalRequest === 'function') {
            notificationService.notifyPickupApprovalRequest({
                sellerId,
                buyerId,
                itemId,
                itemName: item.name,
            }).catch((err) => {
                logger.error('Failed to notify seller of pickup request', err);
                console.error('[ITEMS] Error notifying seller:', err);
            });
        } else {
            console.error('[ITEMS] notificationService.notifyPickupApprovalRequest is not a function!');
        }
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

        // Notify buyer that they were approved
        if (notificationService && typeof notificationService.createNotification === 'function') {
            notificationService.createNotification({
                userIds: [buyerId],
                type: NOTIFICATION_TYPES.PICKUP_APPROVAL_REQUEST,
                title: 'Pickup approved!',
                message: `Your request to pick up ${item.name} has been approved. Check the chat for pickup details.`,
                context: { itemId, chatId: chat?._id?.toString() },
            }).catch((err) => logger.error('Failed to notify buyer of approval', err));
        }

        res.json({
            approval,
            chatId: chat?._id?.toString(),
        });
    } catch (e) {
        next(e);
    }
});

module.exports = router;


