/*
 * נקודת חיפוש: searchRoutes.js
 * ---------------------------
 * תכלית: נקודת קצה לחיפוש פריטים/מתנות לפי מסננים שונים (שם, קטגוריה,
 * מצב, גיל, עיר ואזור). מריצה ניקוי הזמנות שפגו לפני השאילתה.
 */
const express = require('express');
const router = express.Router();
const connectToDatabase = require('../models/db');
require('dotenv').config();
const { notificationService } = require('./notificationsRoutes');
const { releaseExpiredReservations } = require('../services/reservations');

const buildSortOptions = () => ({});

// נקודת חיפוש לפריטים/מתנות
router.get('/', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        await releaseExpiredReservations(db, notificationService);
        const collection = db.collection(process.env.MONGO_COLLECTION);
        // Initialize the query object
        // אתחול אובייקט השאילתה
        let query = {};

        // הוספת פילטר לפי שם אם הועבר פרמטר name
        if (req.query.name && req.query.name.trim() !== '') {
            // שימוש ב‑regex לחיפוש חלקי, ללא תלות באותיות גדולות/קטנות
            query.name = { $regex: req.query.name, $options: "i" };
        }

        // הוספת שאר המסננים (קטגוריה, מצב, גיל, עיר ואזור)
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