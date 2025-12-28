const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const connectToDatabase = require('../../models/db');
const { authenticate } = require('../../middleware/auth');
const { APPROVAL_STATUSES, MAX_PICKUP_LOCATIONS } = require('../utils/constants');
const { ensureApprovalsIndex } = require('../utils/approvalHelpers');
const { sanitizePickupLocations } = require('../utils/itemHelpers');
const { haversineDistanceKm, computeCityMatchScore } = require('../utils/locationHelpers');

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

module.exports = router;


