/*
 * נתיבי אימות ומשתמשים: authRoutes.js
 * -----------------------------------
 * תכלית: לספק נקודות קצה לרישום משתמשים, התחברות ועדכון פרופיל.
 * - `/register` : יצירת משתמש והחזרת JWT
 * - `/login`    : אימות סיסמה והחזרת JWT ופרטי משתמש בסיסיים
 * - `/update`   : עדכון פרופיל עבור משתמש מאומת
 */
const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../models/db');
const router = express.Router();
const dotenv = require('dotenv');
const pino = require('pino');  // Import Pino logger
const { authenticate } = require('../middleware/auth');

const { body, validationResult } = require('express-validator');


const logger = pino();  // Create a Pino logger instance

const ALLOWED_ROLES = ['user', 'admin'];

const normalizeRole = (incomingRole) => {
    if (!incomingRole) {
        return null;
    }
    const role = incomingRole.toLowerCase();
    return ALLOWED_ROLES.includes(role) ? role : null;
};

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

// רישום משתמש חדש
router.post('/register', async (req, res) => {
        try {
            // התחברות למסד הנתונים ושימוש באוסף המשתמשים
            const db = await connectToDatabase();
            const collection = db.collection("users");
            const existingEmail = await collection.findOne({ email: req.body.email });

        if (existingEmail) {
            logger.error('Email id already exists');
            return res.status(400).json({ error: 'Email id already exists' });
        }

        if (req.body.role && !normalizeRole(req.body.role)) {
            logger.error(`Invalid role provided: ${req.body.role}`);
            return res.status(400).json({ error: 'Invalid role specified. Allowed values: user, admin.' });
        }

        const userCount = await collection.countDocuments();
        const normalizedRole = normalizeRole(req.body.role);
        const role = userCount === 0 ? 'admin' : (normalizedRole || 'user');

        const salt = await bcryptjs.genSalt(10);
        const hash = await bcryptjs.hash(req.body.password, salt);
        const email=req.body.email;
        console.log('email is',email);
        const newUser = await collection.insertOne({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hash,
            role,
            createdAt: new Date(),
        });

        const userId = newUser.insertedId.toString();

        const payload = {
            user: {
                id: userId,
                role,
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);
        logger.info('User registered successfully');
        res.json({ authtoken,email, role, userId });
    } catch (e) {
        logger.error(e);
        return res.status(500).send('Internal server error');
    }
});

// התחברות משתמש (login)
router.post('/login', async (req, res) => {
    console.log("\n\n Inside login")

    try {
        // שאילתת משתמש לפי אימייל
        const db = await connectToDatabase();
        const collection = db.collection('users');
        const theUser = await collection.findOne({ email: req.body.email });

        if (theUser) {
            const userRole = theUser.role || 'user';
            let result = await bcryptjs.compare(req.body.password, theUser.password)
            if(!result) {
                logger.error('Passwords do not match');
                return res.status(404).json({ error: 'Wrong pasword' });
            }
            let payload = {
                user: {
                    id: theUser._id.toString(),
                    role: userRole,
                },
            };

            const userName = theUser.firstName;
            const userEmail = theUser.email;

            const authtoken = jwt.sign(payload, JWT_SECRET);
            const userId = theUser._id.toString();

            logger.info('User logged in successfully');
            return res.status(200).json({ authtoken, userName, userEmail, userRole, userId });
        } else {
            logger.error('User not found');
            return res.status(404).json({ error: 'User not found' });
        }
    } catch (e) {
        logger.error(e);
        return res.status(500).json({ error: 'Internal server error', details: e.message });
      }
});

// עדכון פרטי משתמש מאומת
router.put('/update', authenticate, async (req, res) => {
    // בדיקת תקינות הקלט
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        logger.error('Validation errors in update request', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // דואג שקיים אימייל במשתמש המאומת
        const email = req.user?.email;

        if (!email) {
            logger.error('Email not found for the authenticated user');
            return res.status(400).json({ error: "Email not found for the authenticated user" });
        }

        // התחברות למסד הנתונים
        const db = await connectToDatabase();
        const collection = db.collection("users");

        // מציאת פרטי המשתמש
        const existingUser = await collection.findOne({ email });

        if (!existingUser) {
            logger.error('User not found');
            return res.status(404).json({ error: "User not found" });
        }

        existingUser.firstName = req.body.name;
        existingUser.role = existingUser.role || 'user';
        existingUser.updatedAt = new Date();

        // עדכון פרטי המשתמש במסד הנתונים
        const updatedUser = await collection.findOneAndUpdate(
            { email },
            { $set: existingUser },
            { returnDocument: 'after' }
        );

        // יצירת JWT עם user._id כמשקל באמצעות מפתח סודי מקובץ .env
        if (!updatedUser.value) {
            logger.error('User not found after update attempt');
            return res.status(404).json({ error: "User not found" });
        }

        const payload = {
            user: {
                id: updatedUser.value._id.toString(),
                role: updatedUser.value.role || 'user',
            },
        };

        const authtoken = jwt.sign(payload, JWT_SECRET);
        logger.info('User updated successfully');

        res.json({ authtoken, role: payload.user.role });
    } catch (error) {
        logger.error(error);
        return res.status(500).send("Internal Server Error");
    }
});
module.exports = router;