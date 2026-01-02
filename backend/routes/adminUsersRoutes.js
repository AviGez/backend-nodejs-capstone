const express = require('express');
const { ObjectId } = require('mongodb');
const connectToDatabase = require('../models/db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { notificationService } = require('./notificationsRoutes');

const router = express.Router();

// Get list of users (admin only)
router.get('/', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    const mapped = users.map((u) => ({
      id: u._id.toString(),
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      createdAt: u.createdAt,
    }));

    res.json(mapped);
  } catch (e) {
    next(e);
  }
});

// Delete user by id (admin only)
router.delete('/:id', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'Missing user id' });

    if (req.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    // prevent deleting last admin
    const targetUser = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (targetUser.role === 'admin') {
      const adminCount = await usersCollection.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin' });
      }
    }

    await usersCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

// Send message/notification to a user (admin only)
router.post('/:id/message', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const id = req.params.id;
    const { title, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Use notificationService to create an in-app notification
    await notificationService.createNotification({
      userIds: [id],
      type: 'feedback',
      title: title || 'Message from admin',
      message,
      context: {},
    });

    res.json({ sent: true });
  } catch (e) {
    next(e);
  }
});

module.exports = {
  adminUsersRouter: router,
};
