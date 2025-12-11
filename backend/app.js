/*
 * נקודת כניסה לבקאנד: app.js
 * --------------------------------
 * תכלית: להגדיר ולהפעיל את שרת Express, להתחבר ל‑MongoDB,
 * להריץ middleware ולהרשום נתיבים (routes), ולאתחול תמיכה ב‑sockets.
 */
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const pinoLogger = require('./logger');
const path = require('path');

const connectToDatabase = require('./models/db');
const { initSocket } = require('./socket');


const app = express();
const server = http.createServer(app);
initSocket(server);
app.use("*",cors());
const port = 3060;

// התחברות ל‑MongoDB (רצה פעם אחת בעת האתחול)
connectToDatabase().then(() => {
    pinoLogger.info('Connected to DB');
})
    .catch((e) => console.error('Failed to connect to DB', e));


// Middleware לניתוח JSON בגוף הבקשות
app.use(express.json());

// טעינת מודולי הנתיבים (routes)
const secondChanceRoutes = require('./routes/secondChanceItemsRoutes');
const authRoutes = require('./routes/authRoutes');
const searchRoutes = require('./routes/searchRoutes');
const { notificationsRouter } = require('./routes/notificationsRoutes');
const chatRoutes = require('./routes/chatRoutes');
const pinoHttp = require('pino-http');
const logger = require('./logger');

app.use(pinoHttp({ logger }));
// חשיפה של קבצי סטטיק מתוך תיקיית `public`
app.use(express.static(path.join(__dirname, 'public')));

// Use Routes
// רישום הנתיבים תחת הנתיבים המתאימים
app.use('/api/secondchance/items', secondChanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/secondchance/search', searchRoutes);
app.use('/api/notifications', notificationsRouter);
app.use('/api/chats', chatRoutes);

// Global Error Handler
// טיפול גלובלי בשגיאות: מחזיר 500 במקרה של שגיאה לא מטופלת
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});

app.get("/",(req,res)=>{
    res.send("Inside the server")
})

// הפעלת השרת על הפורט שנבחר
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});