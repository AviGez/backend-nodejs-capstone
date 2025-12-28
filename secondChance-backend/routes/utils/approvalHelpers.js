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

module.exports = {
    ensureApprovalsIndex,
    getApprovalDoc,
};


