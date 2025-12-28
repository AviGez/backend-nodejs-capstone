const { ObjectId } = require('mongodb');

const toObjectId = (value) => {
    try {
        return new ObjectId(value);
    } catch (e) {
        return null;
    }
};

async function releaseExpiredReservations(db, notificationService) {
    if (!db) {
        return;
    }
    const itemsCollection = db.collection('secondChanceItems');
    const usersCollection = db.collection('users');
    const now = new Date();

    const expiredItems = await itemsCollection.find({
        status: 'reserved',
        reservedUntil: { $lt: now },
    }).toArray();

    if (expiredItems.length === 0) {
        return;
    }

    // Notify users about released items before updating
    if (notificationService && typeof notificationService.notifyItemReleased === 'function') {
        for (const item of expiredItems) {
            if (item.reservedByUserId && item.name) {
                try {
                    await notificationService.notifyItemReleased({
                        userId: item.reservedByUserId,
                        itemId: item.id,
                        itemName: item.name,
                    });
                } catch (err) {
                    console.error('Failed to notify user about released item', err);
                }
            }
        }
    }

    await itemsCollection.updateMany(
        {
            status: 'reserved',
            reservedUntil: { $lt: now },
        },
        {
            $set: {
                status: 'available',
                reservedByUserId: null,
                reservedUntil: null,
                reservedReason: null,
                pickupApprovedAt: null,
            },
        }
    );

    await itemsCollection.updateMany(
        { status: { $exists: false } },
        {
            $set: {
                status: 'available',
                reservedByUserId: null,
                reservedUntil: null,
                reservedReason: null,
                pickupApprovedAt: null,
            },
        }
    );

    const buyerCounts = expiredItems.reduce((acc, item) => {
        if (item.reservedByUserId && item.reservedReason === 'pickupApproval') {
            acc[item.reservedByUserId] = (acc[item.reservedByUserId] || 0) + 1;
        }
        return acc;
    }, {});

    const flaggedBuyers = [];

    for (const [buyerId, increment] of Object.entries(buyerCounts)) {
        const buyerObjectId = toObjectId(buyerId);
        if (!buyerObjectId) {
            continue;
        }
        const updateResult = await usersCollection.findOneAndUpdate(
            { _id: buyerObjectId },
            {
                $inc: { pickupTimeoutCount: increment },
            },
            { returnDocument: 'after' }
        );

        const user = updateResult.value;
        if (!user) {
            continue;
        }

        if (user.pickupTimeoutCount >= 3 && !user.pickupTimeoutFlagged) {
            await usersCollection.updateOne(
                { _id: buyerObjectId },
                { $set: { pickupTimeoutFlagged: true } }
            );
            flaggedBuyers.push(user);
        }
    }

    if (flaggedBuyers.length && notificationService && typeof notificationService.notifyAdminsBuyerNoShow === 'function') {
        for (const user of flaggedBuyers) {
            const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email || user._id.toString();
            await notificationService.notifyAdminsBuyerNoShow({
                buyerId: user._id.toString(),
                buyerName: displayName,
                email: user.email,
                count: user.pickupTimeoutCount,
            });
        }
    }
}

module.exports = {
    releaseExpiredReservations,
};

