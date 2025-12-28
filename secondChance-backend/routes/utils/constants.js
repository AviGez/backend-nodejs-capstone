// Constants used across item routes
const APPROVAL_STATUSES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

const MAX_PICKUP_LOCATIONS = 1;
const MAX_IMAGES_PER_ITEM = 5;
const CAROUSEL_WINDOW_SECONDS = 7 * 24 * 60 * 60; // keep featured items for 7 days
const CAROUSEL_NOTICE_SECONDS = CAROUSEL_WINDOW_SECONDS - (2 * 24 * 60 * 60); // notify with 2 days remaining
const MAX_LAT = 90;
const MIN_LAT = -90;
const MAX_LNG = 180;
const MIN_LNG = -180;

module.exports = {
    APPROVAL_STATUSES,
    MAX_PICKUP_LOCATIONS,
    MAX_IMAGES_PER_ITEM,
    CAROUSEL_WINDOW_SECONDS,
    CAROUSEL_NOTICE_SECONDS,
    MAX_LAT,
    MIN_LAT,
    MAX_LNG,
    MIN_LNG,
};


