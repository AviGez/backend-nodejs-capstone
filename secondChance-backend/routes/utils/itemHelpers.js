const { MAX_PICKUP_LOCATIONS } = require('./constants');
const { parseLatitude, parseLongitude } = require('./locationHelpers');

const parsePickupLocationsInput = (input) => {
    if (!input) {
        return [];
    }

    let parsed = input;
    if (typeof input === 'string') {
        try {
            parsed = JSON.parse(input);
        } catch (e) {
            return [];
        }
    }

    if (!Array.isArray(parsed)) {
        return [];
    }

    const cleaned = [];
    for (const entry of parsed) {
        if (!entry) {
            continue;
        }
        const label = (entry.label || '').toString().trim();
        const city = (entry.city || '').toString().trim();
        const address = (entry.address || '').toString().trim();
        if (!label || !city || !address) {
            continue;
        }
        const location = {
            label,
            city,
            area: (entry.area || '').toString().trim(),
            address,
        };
        const lat = Number(entry.lat);
        const lng = Number(entry.lng);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
            location.lat = lat;
            location.lng = lng;
        }
        cleaned.push(location);
        if (cleaned.length >= MAX_PICKUP_LOCATIONS) {
            break;
        }
    }
    return cleaned;
};

const sanitizePickupLocations = (locations = [], canViewFullDetails = false) => {
    return locations.slice(0, MAX_PICKUP_LOCATIONS).map((loc) => {
        const sanitized = {
            label: loc.label,
            city: loc.city,
            area: loc.area,
        };
        if (canViewFullDetails) {
            sanitized.address = loc.address;
            if (typeof loc.lat === 'number') {
                sanitized.lat = loc.lat;
            }
            if (typeof loc.lng === 'number') {
                sanitized.lng = loc.lng;
            }
        }
        return sanitized;
    });
};

const buildItemQuery = (params) => {
    const query = {};

    if (params.name && params.name.trim() !== '') {
        query.name = { $regex: params.name.trim(), $options: "i" };
    }
    if (params.category) {
        query.category = params.category;
    }
    if (params.condition) {
        query.condition = params.condition;
    }
    if (params.age_years) {
        const ageYears = parseInt(params.age_years, 10);
        if (!isNaN(ageYears)) {
            query.age_years = { $lte: ageYears };
        }
    }
    if (params.city && params.city.trim() !== '') {
        query.city = params.city.trim();
    }
    if (params.area && params.area.trim() !== '') {
        query.area = params.area.trim();
    }

    return query;
};

const buildSortOptions = () => ({});

module.exports = {
    parsePickupLocationsInput,
    sanitizePickupLocations,
    buildItemQuery,
    buildSortOptions,
};

