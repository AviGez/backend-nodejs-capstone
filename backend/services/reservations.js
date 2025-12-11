/*
 * ניהול הזמנות: reservations.js
 * -----------------------------
 * תכלית: לסרוק הזמנות שפגו ולשחררן, לעדכן ספירות timeout של קונים
 * ולדווח למנהלים על קונים שחזרו על ההיעדרות.
 */
const { ObjectId } = require('mongodb');

// המרה בטוחה ל‑ObjectId; תחזיר null אם לא ניתן להמיר
const toObjectId = (value) => {
    try {
        return new ObjectId(value);
    } catch (e) {
        return null;
    }
};

// שחרור פריטים שמצבם "reserved" ו־reservedUntil שלהם קטן מהזמן הנוכחי
async function releaseExpiredReservations(db, notificationService) {
    if (!db) {
        return;
    }
    const itemsCollection = db.collection('secondChanceItems');
    const usersCollection = db.collection('users');
    const now = new Date();

    // שליפת פריטים שפג תוקפם
    const expiredItems = await itemsCollection.find({
        status: 'reserved',
        reservedUntil: { $lt: now },
    }).toArray();

    if (expiredItems.length === 0) {
        return;
    }

    // עדכון הפריטים: החזרה למצב זמין
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

    // תיקון פריטים חסרי שדה סטטוס - הגדירו כזמינים
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

    // ספירת ההזמנות שפג תוקפן לפי קונה (רק למקרים של pickupApproval)
    const buyerCounts = expiredItems.reduce((acc, item) => {
        if (item.reservedByUserId && item.reservedReason === 'pickupApproval') {
            acc[item.reservedByUserId] = (acc[item.reservedByUserId] || 0) + 1;
        }
        return acc;
    }, {});

    const flaggedBuyers = [];

    // עדכון ספירת timeouts לכל קונה ועזיבת דגל במידה וצריך
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

        // אם עבר מספר סף, סמן ודווח למנהלים
        if (user.pickupTimeoutCount >= 3 && !user.pickupTimeoutFlagged) {
            await usersCollection.updateOne(
                { _id: buyerObjectId },
                { $set: { pickupTimeoutFlagged: true } }
            );
            flaggedBuyers.push(user);
        }
    }

    // שליחת התראות למנהלים עבור קונים שמסומנים
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

