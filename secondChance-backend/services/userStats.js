const connectToDatabase = require('../models/db');
const { BADGES, SELLER_LEVELS } = require('./badges');
const { notificationService } = require('../routes/notificationsRoutes');

const getStatsCollection = async () => {
    const db = await connectToDatabase();
    return db.collection('userStats');
};

const normalizeNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isNaN(num) ? fallback : num;
};

const calcAvgHours = (totalHours, approvals) => {
    const hours = normalizeNumber(totalHours);
    const count = normalizeNumber(approvals, 1);
    return hours / count;
};

const computeBadgesForStats = (stats) => {
    if (!stats) {
        return [];
    }
    const earned = [];
    for (const badge of BADGES) {
        const value = normalizeNumber(stats[badge.type], 0);
        if (badge.comparison === 'lt') {
            if (value > 0 && value < badge.threshold) {
                earned.push(badge);
            }
        } else if (value >= badge.threshold) {
            earned.push(badge);
        }
    }
    return earned;
};

const computeSellerLevel = (stats) => {
    const sold = normalizeNumber(stats?.itemsSold, 0);
    let level = SELLER_LEVELS[0];
    for (const candidate of SELLER_LEVELS) {
        if (sold >= candidate.minScore) {
            level = candidate;
        }
    }
    return level;
};

const updateUserStats = async (userId, update) => {
    if (!userId) {
        return null;
    }
    const collection = await getStatsCollection();
    const now = new Date();
    const result = await collection.findOneAndUpdate(
        { userId },
        {
            $setOnInsert: { createdAt: now },
            $set: { updatedAt: now, ...(update.$set || {}) },
            ...(update.$inc ? { $inc: update.$inc } : {}),
        },
        { returnDocument: 'after', upsert: true }
    );
    return result.value;
};

const recordItemListed = async ({ userId, price }) => {
    if (!userId) {
        return null;
    }
    return updateUserStats(userId, {
        $inc: {
            itemsListed: 1,
            freeItemsPosted: price > 0 ? 0 : 1,
        },
    });
};

const recordItemSold = async ({ sellerId }) => {
    if (!sellerId) {
        return null;
    }
    return updateUserStats(sellerId, {
        $inc: {
            itemsSold: 1,
        },
    });
};

const recordApprovalResponse = async ({ sellerId, responseHours }) => {
    if (!sellerId || typeof responseHours === 'undefined') {
        return null;
    }
    return updateUserStats(sellerId, {
        $inc: {
            totalApprovalResponseHours: responseHours,
            approvalsHandled: 1,
        },
    });
};

const finalizeBadges = async (userId) => {
    if (!userId) {
        return;
    }
    const collection = await getStatsCollection();
    const stats = await collection.findOne({ userId });
    if (!stats) {
        return;
    }
    const badges = computeBadgesForStats(stats).map((badge) => badge.id);
    const level = computeSellerLevel(stats);
    const update = await collection.findOneAndUpdate(
        { userId },
        {
            $set: {
                badges,
                sellerLevel: level.id,
            },
        },
        { returnDocument: 'after' }
    );

    const previousBadges = stats.badges || [];
    const newBadges = badges.filter((badgeId) => !previousBadges.includes(badgeId));
    for (const badgeId of newBadges) {
        const badgeMeta = BADGES.find((badge) => badge.id === badgeId);
        if (badgeMeta) {
            await notificationService.notifyBadgeEarned({
                userId,
                badgeId,
                label: badgeMeta.label,
            });
        }
    }
    return update.value;
};

const getSellerLevelLabel = (levelId) => {
    const level = SELLER_LEVELS.find((lvl) => lvl.id === levelId);
    return level ? level.label : SELLER_LEVELS[0].label;
};

module.exports = {
    updateUserStats,
    recordItemListed,
    recordItemSold,
    recordApprovalResponse,
    finalizeBadges,
    getSellerLevelLabel,
};

