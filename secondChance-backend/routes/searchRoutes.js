const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');
require('dotenv').config();
const { notificationService } = require('./notificationsRoutes');
const { releaseExpiredReservations } = require('../services/reservations');

const buildSortOptions = () => ({});

// Search for gifts
router.get('/', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        await releaseExpiredReservations(db, notificationService);
        const collection = db.collection(process.env.MONGO_COLLECTION);
        // Initialize the query object
        let query = {};

        // Add the name filter to the query if the name parameter is not empty
        if (req.query.name && req.query.name.trim() !== '') {
            query.name = { $regex: req.query.name, $options: "i" }; // Using regex for partial match, case-insensitive
        }

        // Add other filters to the query
        if (req.query.category) {
            query.category = req.query.category;
        }
        if (req.query.condition) {
            query.condition = req.query.condition;
        }
        if (req.query.age_years) {
            query.age_years = { $lte: parseInt(req.query.age_years) };
        }
        if (req.query.city && req.query.city.trim() !== '') {
            query.city = req.query.city.trim();
        }
        if (req.query.area && req.query.area.trim() !== '') {
            query.area = req.query.area.trim();
        }

        const sortOptions = buildSortOptions(req.query?.sort);
        let cursor = collection.find(query);
        if (Object.keys(sortOptions).length) {
            cursor = cursor.sort(sortOptions);
        }
        const gifts = await cursor.toArray();
        res.json(gifts);
    } catch (e) {
        next(e);
    }
});

module.exports = router;