const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');
const { authenticate } = require('../middleware/auth');

const MAX_ROUTE_ITEMS = 5;

const toRadians = (deg) => (deg * Math.PI) / 180;
const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const isValidLat = (value) => typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 90;
const isValidLng = (value) => typeof value === 'number' && Number.isFinite(value) && value >= -180 && value <= 180;

const normalizeCoordinate = (value) => {
    if (typeof value === 'number') {
        return value;
    }
    const num = Number(value);
    if (Number.isNaN(num) || !Number.isFinite(num)) {
        return undefined;
    }
    return num;
};

const generatePermutations = (items) => {
    if (items.length <= 1) {
        return [items];
    }
    const perms = [];
    items.forEach((item, index) => {
        const remaining = items.slice(0, index).concat(items.slice(index + 1));
        const innerPerms = generatePermutations(remaining);
        innerPerms.forEach((perm) => {
            perms.push([item, ...perm]);
        });
    });
    return perms;
};

const computeRouteDistance = (start, order) => {
    let total = 0;
    let previous = start;
    order.forEach((stop) => {
        total += haversineDistanceKm(previous.lat, previous.lng, stop.lat, stop.lng);
        previous = stop;
    });
    return total;
};

const formatCoord = (lat, lng) => `${lat},${lng}`;

const buildGoogleMapsUrl = (start, order) => {
    if (!order.length) {
        return '';
    }
    const origin = formatCoord(start.lat, start.lng);
    const destination = formatCoord(order[order.length - 1].lat, order[order.length - 1].lng);
    const params = new URLSearchParams({
        api: '1',
        origin,
        destination,
        travelmode: 'driving',
    });
    if (order.length > 1) {
        const waypoints = order
            .slice(0, -1)
            .map((stop) => formatCoord(stop.lat, stop.lng))
            .join('|');
        params.set('waypoints', waypoints);
    }
    return `https://www.google.com/maps/dir/?${params.toString()}`;
};

router.post('/collect', authenticate, async (req, res, next) => {
    try {
        const { start, itemIds } = req.body || {};
        if (!start || typeof start.lat === 'undefined' || typeof start.lng === 'undefined') {
            return res.status(400).json({ error: 'start.lat and start.lng are required' });
        }

        const startLat = normalizeCoordinate(start.lat);
        const startLng = normalizeCoordinate(start.lng);
        if (!isValidLat(startLat) || !isValidLng(startLng)) {
            return res.status(400).json({ error: 'Start coordinates must be valid numbers' });
        }

        if (!Array.isArray(itemIds) || itemIds.length === 0) {
            return res.status(400).json({ error: 'At least one itemId is required' });
        }
        if (itemIds.length > MAX_ROUTE_ITEMS) {
            return res.status(400).json({ error: `You can plan a route for up to ${MAX_ROUTE_ITEMS} items` });
        }

        const normalizedIds = [...new Set(itemIds.map((id) => id && id.toString().trim()).filter(Boolean))];
        if (!normalizedIds.length) {
            return res.status(400).json({ error: 'Invalid itemIds provided' });
        }

        const db = await connectToDatabase();
        const collection = db.collection('secondChanceItems');
        const items = await collection.find({ id: { $in: normalizedIds } }).toArray();
        const missingIds = normalizedIds.filter((id) => !items.find((item) => item.id === id));
        if (missingIds.length) {
            return res.status(404).json({ error: `Items not found: ${missingIds.join(', ')}` });
        }

        const stops = [];
        for (const item of items) {
            const lat = normalizeCoordinate(item.lat);
            const lng = normalizeCoordinate(item.lng);
            if (!isValidLat(lat) || !isValidLng(lng)) {
                return res.status(400).json({
                    error: `Item "${item.name || item.id}" is missing coordinates. Ask the seller to provide latitude and longitude.`,
                });
            }
            stops.push({
                itemId: item.id,
                name: item.name,
                city: item.city,
                area: item.area,
                lat,
                lng,
            });
        }

        const permutations = generatePermutations(stops);
        let bestOrder = [];
        let bestDistance = Number.POSITIVE_INFINITY;
        permutations.forEach((order) => {
            const distance = computeRouteDistance({ lat: startLat, lng: startLng }, order);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestOrder = order;
            }
        });

        if (!bestOrder.length) {
            return res.status(400).json({ error: 'Unable to compute route' });
        }

        const stopsResponse = [
            {
                order: 1,
                type: 'start',
                lat: startLat,
                lng: startLng,
            },
        ];
        let previous = { lat: startLat, lng: startLng };
        bestOrder.forEach((stop, index) => {
            const segmentDistance = haversineDistanceKm(previous.lat, previous.lng, stop.lat, stop.lng);
            stopsResponse.push({
                order: index + 2,
                type: 'item',
                itemId: stop.itemId,
                name: stop.name,
                city: stop.city,
                area: stop.area,
                lat: stop.lat,
                lng: stop.lng,
                distanceFromPreviousKm: Number(segmentDistance.toFixed(2)),
            });
            previous = stop;
        });

        const responsePayload = {
            totalDistanceKm: Number(bestDistance.toFixed(2)),
            stops: stopsResponse,
        };
        const googleMapsUrl = buildGoogleMapsUrl({ lat: startLat, lng: startLng }, bestOrder);
        if (googleMapsUrl) {
            responsePayload.googleMapsUrl = googleMapsUrl;
        }

        res.json(responsePayload);
    } catch (err) {
        next(err);
    }
});

module.exports = router;

