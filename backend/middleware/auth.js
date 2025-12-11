/*
 * middleware אימות: auth.js
 * -----------------------
 * תכלית: לספק middleware לאימות בקשות בעזרת JWT (attach ל־`req.user`)
 * וכן middleware לאימות מנהלים (`authorizeAdmin`).
 */
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { ObjectId } = require('mongodb');
const connectToDatabase = require('../models/db');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const unauthorizedResponse = (res, message = 'Authentication required') =>
    res.status(401).json({ error: message });

// middleware שמוודא שהבקשה מכילה טוקן תקף ומצמיד את פרטי המשתמש ל־req.user
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return unauthorizedResponse(res);
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        if (!decoded?.user?.id) {
            return unauthorizedResponse(res, 'Invalid token payload');
        }

        const db = await connectToDatabase();
        const collection = db.collection('users');
        const user = await collection.findOne({ _id: new ObjectId(decoded.user.id) });

        if (!user) {
            return unauthorizedResponse(res, 'User not found');
        }

        req.user = {
            id: user._id.toString(),
            role: decoded.user.role || user.role || 'user',
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        };

        return next();
    } catch (error) {
        return unauthorizedResponse(res, 'Invalid or expired token');
    }
};

// middleware שמוודא שהמשתמש הוא מנהל
const authorizeAdmin = (req, res, next) => {
    if (req.user?.role === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Admin access required' });
};

module.exports = {
    authenticate,
    authorizeAdmin,
};

