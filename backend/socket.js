/*
 * קבצי WebSocket: socket.js
 * -------------------------
 * תכלית: לאתחל Socket.IO על אותו HTTP server, לאמת חיבורים בעזרת JWT,
 * ולטפל באירועים של צ'אט (הצטרפות לחדר ושליחת הודעות).
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const connectToDatabase = require('./models/db');

// קידומת לחדרי צ'אט כדי שנשתמש ב־room names כמו "chat:<chatId>"
const CHAT_ROOM_PREFIX = 'chat:';

const getChatById = async (db, chatId) => {
    let objectId;
    try {
        objectId = new ObjectId(chatId);
    } catch (e) {
        return null;
    }

    const chat = await db.collection('chats').findOne({ _id: objectId });
    return { chat, objectId };
};

const userInChat = (chat, userId) => chat && (chat.buyerId === userId || chat.sellerId === userId);

function initSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: '*',
        },
    });

    // middleware לאימות חיבור socket באמצעות JWT
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) {
                return next(new Error('Authentication required'));
            }
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            const userId = payload?.user?.id;
            if (!userId) {
                return next(new Error('Invalid token payload'));
            }
            socket.userId = userId;
            next();
        } catch (err) {
            next(err);
        }
    });

    io.on('connection', (socket) => {
        // טיפול בבקשה להצטרף לחדר צ'אט
        socket.on('join_chat', async ({ chatId }) => {
            if (!chatId) {
                return socket.emit('error', { message: 'chatId is required' });
            }

            try {
                const db = await connectToDatabase();
                const { chat } = await getChatById(db, chatId);
                if (!chat) {
                    return socket.emit('error', { message: 'Chat not found' });
                }
                if (!userInChat(chat, socket.userId)) {
                    return socket.emit('error', { message: 'Not authorized for this chat' });
                }
                if (!chat.isApproved) {
                    return socket.emit('error', { message: 'Chat not approved yet' });
                }

                socket.join(`${CHAT_ROOM_PREFIX}${chatId}`);
                socket.emit('chat_joined', { chatId });
            } catch (err) {
                socket.emit('error', { message: err.message || 'Unable to join chat' });
            }
        });

        // טיפול בשליחת הודעה חדשה בתוך צ'אט
        socket.on('send_message', async ({ chatId, content }) => {
            if (!chatId || typeof content !== 'string' || !content.trim()) {
                return socket.emit('error', { message: 'chatId and non-empty content are required' });
            }

            try {
                const db = await connectToDatabase();
                const chatsCollection = db.collection('chats');
                const messagesCollection = db.collection('chatMessages');

                const { chat, objectId } = await getChatById(db, chatId);
                if (!chat) {
                    return socket.emit('error', { message: 'Chat not found' });
                }
                if (!userInChat(chat, socket.userId)) {
                    return socket.emit('error', { message: 'Not authorized for this chat' });
                }
                if (!chat.isApproved) {
                    return socket.emit('error', { message: 'Chat not approved yet' });
                }

                const now = new Date();
                const insertResult = await messagesCollection.insertOne({
                    chatId: objectId,
                    senderId: socket.userId,
                    content: content.trim(),
                    createdAt: now,
                });

                await chatsCollection.updateOne(
                    { _id: objectId },
                    { $set: { updatedAt: now } }
                );

                const message = {
                    id: insertResult.insertedId.toString(),
                    chatId,
                    senderId: socket.userId,
                    content: content.trim(),
                    createdAt: now,
                };

                io.to(`${CHAT_ROOM_PREFIX}${chatId}`).emit('new_message', message);
            } catch (err) {
                socket.emit('error', { message: err.message || 'Failed to send message' });
            }
        });
    });
}

module.exports = {
    initSocket,
};

