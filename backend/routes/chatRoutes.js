/*
 * נתיבי צ'אט: chatRoutes.js
 * -------------------------
 * תכלית: נקודות קצה לפתיחת צ'אט לפריטים, רשימת צ'אטים של משתמש,
 * אישור צ'אט, שליפת הודעות ושליחת הודעות.
 */
const express = require('express');
const { ObjectId } = require('mongodb');
const connectToDatabase = require('../models/db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// וידוא יצירת אינדקסים על אוספי צ'אטים והודעות
let indexesEnsured = false;
async function ensureChatIndexes(db) {
    if (indexesEnsured) {
        return;
    }
    const chatsCollection = db.collection('chats');
    const messagesCollection = db.collection('chatMessages');
    await chatsCollection.createIndex(
        { itemId: 1, buyerId: 1, sellerId: 1 },
        { unique: true }
    );
    await messagesCollection.createIndex({ chatId: 1, createdAt: 1 });
    indexesEnsured = true;
}

// המרה של מסמך צ'אט למבנה תגובה ללקוח
const mapChatResponse = (chat) => ({
    id: chat._id?.toString(),
    itemId: chat.itemId,
    buyerId: chat.buyerId,
    sellerId: chat.sellerId,
    isApproved: !!chat.isApproved,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
});

// בדיקה האם המשתמש יכול לגשת לצ'אט (קונה/מוכר)
const canAccessChat = (chat, userId) => {
    return chat.buyerId === userId || chat.sellerId === userId;
};

// יצירת צ'אט חדש עבור פריט (אם לא קיים)
router.post('/:itemId', authenticate, async (req, res, next) => {
    try {
        const itemId = req.params.itemId;
        const db = await connectToDatabase();
        await ensureChatIndexes(db);

        const itemsCollection = db.collection('secondChanceItems');
        const chatsCollection = db.collection('chats');

        const item = await itemsCollection.findOne({ id: itemId });
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const sellerId = item.ownerId;
        const buyerId = req.user.id;

        if (!sellerId) {
            return res.status(400).json({ error: 'Item does not have an owner assigned' });
        }
        if (sellerId === buyerId) {
            return res.status(400).json({ error: 'Cannot open chat on your own item' });
        }

        const now = new Date();

        try {
            const insertResult = await chatsCollection.insertOne({
                itemId,
                buyerId,
                sellerId,
                isApproved: false,
                createdAt: now,
                updatedAt: now,
            });
            const chat = await chatsCollection.findOne({ _id: insertResult.insertedId });
            return res.status(201).json(mapChatResponse(chat));
        } catch (error) {
            if (error.code === 11000) {
                const chat = await chatsCollection.findOne({ itemId, buyerId, sellerId });
                return res.json(mapChatResponse(chat));
            }
            throw error;
        }
    } catch (e) {
        next(e);
    }
});

// החזרת רשימת הצ'אטים של המשתמש (קונה/מוכר)
router.get('/', authenticate, async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        await ensureChatIndexes(db);
        const chatsCollection = db.collection('chats');

        const chats = await chatsCollection.find({
            $or: [
                { buyerId: req.user.id },
                { sellerId: req.user.id },
            ],
        })
            .sort({ updatedAt: -1 })
            .limit(50)
            .toArray();

        res.json(chats.map(mapChatResponse));
    } catch (e) {
        next(e);
    }
});

// אישור צ'אט על ידי המוכר או מנהל
router.patch('/:chatId/approve', authenticate, async (req, res, next) => {
    try {
        const chatId = req.params.chatId;
        const db = await connectToDatabase();
        await ensureChatIndexes(db);
        const chatsCollection = db.collection('chats');

        let objectId;
        try {
            objectId = new ObjectId(chatId);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid chat ID' });
        }

        const chat = await chatsCollection.findOne({ _id: objectId });
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        if (chat.sellerId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only seller or admin can approve chat' });
        }

        await chatsCollection.updateOne(
            { _id: objectId },
            { $set: { isApproved: true, updatedAt: new Date() } }
        );

        const updatedChat = await chatsCollection.findOne({ _id: objectId });
        res.json(mapChatResponse(updatedChat));
    } catch (e) {
        next(e);
    }
});

// שליפת הודעות של צ'אט מסוים
router.get('/:chatId/messages', authenticate, async (req, res, next) => {
    try {
        const chatId = req.params.chatId;
        const db = await connectToDatabase();
        await ensureChatIndexes(db);
        const chatsCollection = db.collection('chats');
        const messagesCollection = db.collection('chatMessages');

        let objectId;
        try {
            objectId = new ObjectId(chatId);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid chat ID' });
        }

        const chat = await chatsCollection.findOne({ _id: objectId });
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        if (!canAccessChat(chat, req.user.id)) {
            return res.status(403).json({ error: 'Not allowed to view this chat' });
        }
        if (!chat.isApproved && req.user.id === chat.buyerId) {
            return res.status(403).json({ error: 'Chat not yet approved' });
        }

        const messages = await messagesCollection.find({ chatId: objectId })
            .sort({ createdAt: 1 })
            .limit(200)
            .toArray();

        res.json(messages.map((msg) => ({
            id: msg._id?.toString(),
            chatId: msg.chatId?.toString(),
            senderId: msg.senderId,
            content: msg.content,
            createdAt: msg.createdAt,
        })));
    } catch (e) {
        next(e);
    }
});

// פרסום הודעה חדשה בצ'אט
router.post('/:chatId/messages', authenticate, async (req, res, next) => {
    try {
        const chatId = req.params.chatId;
        const { content } = req.body;
        if (!content || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        const db = await connectToDatabase();
        await ensureChatIndexes(db);
        const chatsCollection = db.collection('chats');
        const messagesCollection = db.collection('chatMessages');

        let objectId;
        try {
            objectId = new ObjectId(chatId);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid chat ID' });
        }

        const chat = await chatsCollection.findOne({ _id: objectId });
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        if (!canAccessChat(chat, req.user.id)) {
            return res.status(403).json({ error: 'Not allowed to post in this chat' });
        }
        if (!chat.isApproved) {
            return res.status(403).json({ error: 'Chat not yet approved' });
        }

        const now = new Date();
        const insertResult = await messagesCollection.insertOne({
            chatId: objectId,
            senderId: req.user.id,
            content: content.trim(),
            createdAt: now,
        });

        await chatsCollection.updateOne(
            { _id: objectId },
            { $set: { updatedAt: now } }
        );

        const message = await messagesCollection.findOne({ _id: insertResult.insertedId });
        res.status(201).json({
            id: message._id?.toString(),
            chatId: message.chatId?.toString(),
            senderId: message.senderId,
            content: message.content,
            createdAt: message.createdAt,
        });
    } catch (e) {
        next(e);
    }
});

// מחיקת צ'אט והודעותיו (מותר לבעלים או למנהל)
router.delete('/:chatId', authenticate, async (req, res, next) => {
    try {
        const chatId = req.params.chatId;
        const db = await connectToDatabase();
        await ensureChatIndexes(db);
        const chatsCollection = db.collection('chats');
        const messagesCollection = db.collection('chatMessages');

        let objectId;
        try {
            objectId = new ObjectId(chatId);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid chat ID' });
        }

        const chat = await chatsCollection.findOne({ _id: objectId });
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        if (!canAccessChat(chat, req.user.id) && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not allowed to delete this chat' });
        }

        await messagesCollection.deleteMany({ chatId: objectId });
        await chatsCollection.deleteOne({ _id: objectId });

        res.json({ deleted: true });
    } catch (e) {
        next(e);
    }
});

module.exports = router;

