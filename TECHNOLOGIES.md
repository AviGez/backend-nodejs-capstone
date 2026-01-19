# 🔧 מדריך טכנולוגיות - איך הכל עובד

## תוכן עניינים
1. [Node.js & Express](#1-nodejs--express)
2. [MongoDB](#2-mongodb)
3. [React](#3-react)
4. [JWT Authentication](#4-jwt-authentication)
5. [Socket.IO (Real-time)](#5-socketio-real-time)
6. [Multer (File Upload)](#6-multer-file-upload)
7. [bcryptjs (Password Hashing)](#7-bcryptjs-password-hashing)
8. [Docker](#8-docker)
9. [Pino (Logging)](#9-pino-logging)
10. [React Router](#10-react-router)

---

## 1. Node.js & Express

### מה זה?
- **Node.js**: סביבת ריצה ל-JavaScript מחוץ לדפדפן (שרת)
- **Express**: Framework מינימליסטי ליצירת שרתי web ב-Node.js

### איך זה עובד בפרויקט?

```javascript
// app.js - נקודת הכניסה
const express = require('express');
const app = express();
const server = http.createServer(app);

// Middleware - פונקציות שרצות לפני כל בקשה
app.use(express.json()); // ממיר JSON אוטומטית
app.use(cors()); // מאפשר בקשות מדומיין אחר

// Routes - נקודות קצה (endpoints)
app.use('/api/auth', authRoutes);
app.use('/api/secondchance/items', secondChanceRoutes);

// הפעלת השרת
server.listen(3060, () => {
    console.log('Server running on port 3060');
});
```

### איך זה עובד?
1. **בקשה מגיעה** → `GET /api/auth/login`
2. **Express מקבל** את הבקשה
3. **Middleware רצים** (JSON parsing, CORS, authentication)
4. **Route handler** מטפל בבקשה
5. **תגובה נשלחת** → `{ authtoken: "...", userId: "..." }`

### למה משתמשים?
- מהיר וקל לשימוש
- תמיכה טובה ב-middleware
- אידיאלי ל-API

---

## 2. MongoDB

### מה זה?
מסד נתונים NoSQL (לא יחסי) שמאחסן נתונים ב-JSON-like documents.

### איך זה עובד בפרויקט?

```javascript
// models/db.js - חיבור למסד הנתונים
const MongoClient = require('mongodb').MongoClient;

let dbInstance = null;

async function connectToDatabase() {
    if (dbInstance) {
        return dbInstance; // מחזיר חיבור קיים (singleton pattern)
    }
    
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    dbInstance = client.db('secondChance');
    return dbInstance;
}
```

### מבנה הנתונים:

```javascript
// Collection: users
{
    _id: ObjectId("..."),
    email: "user@example.com",
    password: "hashed_password",
    firstName: "John",
    lastName: "Doe",
    role: "user",
    createdAt: Date
}

// Collection: secondChanceItems
{
    _id: ObjectId("..."),
    id: "item123",
    name: "Vintage Chair",
    price: 50,
    ownerId: "user_id",
    images: ["image1.jpg", "image2.jpg"],
    status: "available"
}
```

### איך זה עובד?
1. **חיבור** → מתחבר ל-MongoDB server
2. **בחירת Database** → `secondChance`
3. **בחירת Collection** → `users`, `secondChanceItems`, `chats`
4. **Query** → `collection.findOne({ email: "..." })`
5. **תוצאה** → מחזיר document או null

### למה MongoDB?
- גמיש (schema-less)
- מהיר לשאילתות פשוטות
- טוב ל-JSON/JavaScript

---

## 3. React

### מה זה?
ספריית JavaScript לבניית ממשקי משתמש (UI).

### איך זה עובד בפרויקט?

```javascript
// App.js - הקומפוננטה הראשית
import React from 'react';
import { Routes, Route } from 'react-router-dom';

function App() {
    return (
        <AppProvider>
            <Navbar />
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/app/login" element={<LoginPage />} />
            </Routes>
        </AppProvider>
    );
}
```

### איך זה עובד?
1. **Component** → פונקציה שמחזירה JSX (HTML-like)
2. **State** → משתנים שמשפיעים על ה-render
3. **Props** → נתונים שעוברים בין components
4. **Re-render** → React מעדכן את ה-DOM כשהנתונים משתנים

### דוגמה:

```javascript
// LoginPage.js
function LoginPage() {
    const [email, setEmail] = useState(''); // State
    
    const handleSubmit = async () => {
        // שליחת בקשה ל-backend
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
            />
        </form>
    );
}
```

### למה React?
- קל לתחזוקה
- קהילה גדולה
- ביצועים טובים

---

## 4. JWT Authentication

### מה זה?
**JWT (JSON Web Token)** - טוקן דיגיטלי שמכיל מידע על המשתמש.

### איך זה עובד בפרויקט?

```javascript
// authRoutes.js - יצירת טוקן
const jwt = require('jsonwebtoken');

// בעת הרשמה/התחברות
const payload = {
    user: {
        id: userId,
        role: 'user'
    }
};
const token = jwt.sign(payload, JWT_SECRET);
// מחזיר: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// middleware/auth.js - אימות טוקן
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1]; // "Bearer <token>"
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // מצמיד את פרטי המשתמש ל-request
    req.user = {
        id: decoded.user.id,
        role: decoded.user.role
    };
    
    next(); // ממשיך לבקשה הבאה
};
```

### איך זה עובד?
1. **התחברות** → משתמש מזין email/password
2. **אימות** → שרת בודק את הפרטים
3. **יצירת טוקן** → שרת יוצר JWT עם פרטי המשתמש
4. **שליחה ללקוח** → הלקוח שומר את הטוקן
5. **בקשות עתידיות** → הלקוח שולח את הטוקן ב-header
6. **אימות** → שרת בודק את הטוקן ומזהה את המשתמש

### מבנה הטוקן:
```
header.payload.signature

header: { alg: "HS256", typ: "JWT" }
payload: { user: { id: "...", role: "user" }, iat: 1234567890 }
signature: HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

### למה JWT?
- Stateless (לא צריך session בשרת)
- ניתן לשתף בין שירותים
- מאובטח עם signature

---

## 5. Socket.IO (Real-time)

### מה זה?
ספרייה לתקשורת real-time דו-כיוונית בין שרת ללקוח.

### איך זה עובד בפרויקט?

```javascript
// socket.js - שרת
const { Server } = require('socket.io');

function initSocket(server) {
    const io = new Server(server, {
        cors: { origin: '*' }
    });
    
    // אימות חיבור
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.user.id;
        next();
    });
    
    // חיבור חדש
    io.on('connection', (socket) => {
        // הצטרפות לחדר צ'אט
        socket.on('join_chat', ({ chatId }) => {
            socket.join(`chat:${chatId}`);
        });
        
        // שליחת הודעה
        socket.on('send_message', ({ chatId, content }) => {
            // שמירה ב-MongoDB
            await messagesCollection.insertOne({ chatId, content });
            
            // שליחה לכל מי שבחדר
            io.to(`chat:${chatId}`).emit('new_message', message);
        });
    });
}
```

### איך זה עובד?
1. **חיבור** → לקוח מתחבר לשרת Socket.IO
2. **אימות** → שרת בודק את ה-JWT token
3. **הצטרפות לחדר** → `socket.join('chat:123')`
4. **שליחת הודעה** → `socket.emit('send_message', {...})`
5. **קבלת הודעה** → כל מי שבחדר מקבל `new_message`
6. **עדכון בזמן אמת** → ללא רענון דף!

### למה Socket.IO?
- Real-time communication
- Fallback ל-WebSocket
- קל לשימוש

---

## 6. Multer (File Upload)

### מה זה?
Middleware ל-Express לטיפול בהעלאת קבצים.

### איך זה עובד בפרויקט?

```javascript
// secondChanceItemsRoutes.js
const multer = require('multer');

// הגדרת אחסון
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // תיקיית יעד
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.random()}.jpg`;
        cb(null, uniqueName); // שם ייחודי
    }
});

const upload = multer({ storage });

// Route עם upload
router.post('/', authenticate, upload.array('images', 5), async (req, res) => {
    // req.files מכיל את הקבצים שהועלו
    const imagePaths = req.files.map(file => file.filename);
    
    // שמירה ב-MongoDB
    await collection.insertOne({
        name: req.body.name,
        images: imagePaths
    });
});
```

### איך זה עובד?
1. **בקשה** → `POST /api/secondchance/items` עם `multipart/form-data`
2. **Multer מקבל** את הקבצים
3. **שמירה** → קבצים נשמרים ב-`public/images/`
4. **שם ייחודי** → `item-1234567890-987654321.jpg`
5. **שמירת נתיב** → רק שם הקובץ נשמר ב-MongoDB

### למה Multer?
- פשוט לשימוש
- תמיכה ב-multiple files
- גמיש (memory/disk storage)

---

## 7. bcryptjs (Password Hashing)

### מה זה?
ספרייה להצפנת סיסמאות (hashing) - לא ניתן לפענח חזרה.

### איך זה עובד בפרויקט?

```javascript
// authRoutes.js
const bcryptjs = require('bcryptjs');

// בעת הרשמה - הצפנת סיסמה
const salt = await bcryptjs.genSalt(10); // יצירת salt
const hash = await bcryptjs.hash(password, salt);
// hash: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

// שמירה ב-MongoDB
await collection.insertOne({
    email: email,
    password: hash // לא הסיסמה המקורית!
});

// בעת התחברות - בדיקת סיסמה
const user = await collection.findOne({ email });
const isValid = await bcryptjs.compare(password, user.password);
// compare מחזיר true/false
```

### איך זה עובד?
1. **הרשמה** → סיסמה → `bcryptjs.hash()` → hash
2. **שמירה** → רק ה-hash נשמר (לא הסיסמה!)
3. **התחברות** → סיסמה + hash → `bcryptjs.compare()` → true/false
4. **אבטחה** → גם אם מישהו רואה את ה-hash, לא יכול לפענח

### למה bcrypt?
- מאובטח (one-way hashing)
- איטי בכוונה (קשה לפריצה)
- salt מובנה (מניעת rainbow tables)

---

## 8. Docker

### מה זה?
פלטפורמה ל-containerization - אריזה של אפליקציות עם כל התלויות שלהן.

### איך זה עובד בפרויקט?

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev  # התקנת dependencies

COPY . .
EXPOSE 3060
CMD ["node", "app.js"]  # הפעלת השרת
```

```yaml
# docker-compose.yml
services:
  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
  
  backend:
    build: ./backend
    depends_on:
      - mongo
    ports:
      - "3060:3060"
  
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
```

### איך זה עובד?
1. **Dockerfile** → הוראות לבניית image
2. **docker build** → בונה image עם כל התלויות
3. **docker run** → יוצר container מה�image
4. **docker-compose** → מפעיל מספר containers יחד

### למה Docker?
- עובד בכל מקום (Windows, Linux, Mac)
- בידוד (isolated environment)
- קל לפריסה

---

## 9. Pino (Logging)

### מה זה?
ספריית logging מהירה ל-Node.js.

### איך זה עובד בפרויקט?

```javascript
// logger.js
const pino = require('pino');

const logger = pino({
    level: 'debug',
    transport: {
        target: 'pino-pretty' // פלט קריא בפיתוח
    }
});

// שימוש
logger.info('User registered successfully');
logger.error('Email already exists');
logger.warn('Invalid role provided');
```

### איך זה עובד?
1. **יצירת logger** → מופע אחד לכל האפליקציה
2. **שימוש** → `logger.info()`, `logger.error()`
3. **פלט** → Development: קריא, Production: JSON
4. **pino-http** → לוגים אוטומטיים לכל בקשה HTTP

### למה Pino?
- מהיר מאוד
- JSON structured logs
- קל לשימוש

---

## 10. React Router

### מה זה?
ספרייה לניווט (routing) ב-React - ניהול דפים שונים.

### איך זה עובד בפרויקט?

```javascript
// App.js
import { Routes, Route } from 'react-router-dom';

function App() {
    return (
        <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/app/login" element={<LoginPage />} />
            <Route path="/app/item/:itemId" element={<DetailsPage />} />
        </Routes>
    );
}

// DetailsPage.js - שימוש ב-params
import { useParams } from 'react-router-dom';

function DetailsPage() {
    const { itemId } = useParams(); // "item123"
    // טוען פריט לפי itemId
}
```

### איך זה עובד?
1. **URL משתנה** → `/app/login`
2. **React Router מזהה** → מתאים ל-route
3. **Render** → מציג את הקומפוננטה המתאימה
4. **לא רענון דף** → Single Page Application (SPA)

### למה React Router?
- ניווט חלק
- URL משמעותי
- קל לשימוש

---

## איך הכל עובד יחד? 🔄

### דוגמה: יצירת פריט חדש

1. **Frontend (React)**
   ```javascript
   // משתמש ממלא טופס ולוחץ "Submit"
   const formData = new FormData();
   formData.append('name', 'Vintage Chair');
   formData.append('images', file);
   
   fetch('/api/secondchance/items', {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${token}` },
       body: formData
   });
   ```

2. **Backend (Express)**
   ```javascript
   // Express מקבל את הבקשה
   app.use('/api/secondchance/items', secondChanceRoutes);
   
   // Middleware: authenticate
   router.post('/', authenticate, upload.array('images', 5), ...);
   ```

3. **Authentication (JWT)**
   ```javascript
   // authenticate middleware בודק את הטוקן
   const decoded = jwt.verify(token, JWT_SECRET);
   req.user = { id: decoded.user.id };
   ```

4. **File Upload (Multer)**
   ```javascript
   // Multer שומר את הקבצים
   req.files = [{ filename: 'item-123.jpg', path: '...' }];
   ```

5. **Database (MongoDB)**
   ```javascript
   // שמירה ב-MongoDB
   await collection.insertOne({
       name: req.body.name,
       images: req.files.map(f => f.filename),
       ownerId: req.user.id
   });
   ```

6. **Response**
   ```javascript
   // תגובה ללקוח
   res.json({ success: true, itemId: '...' });
   ```

7. **Frontend מקבל**
   ```javascript
   // React מעדכן את ה-state
   setItems([...items, newItem]);
   ```

---

## סיכום

| טכנולוגיה | תפקיד | למה משתמשים |
|-----------|-------|--------------|
| **Node.js** | סביבת ריצה | הרצת JavaScript בשרת |
| **Express** | Web Framework | יצירת API endpoints |
| **MongoDB** | Database | אחסון נתונים |
| **React** | UI Library | בניית ממשק משתמש |
| **JWT** | Authentication | אימות משתמשים |
| **Socket.IO** | Real-time | צ'אט בזמן אמת |
| **Multer** | File Upload | העלאת תמונות |
| **bcryptjs** | Password Hashing | אבטחת סיסמאות |
| **Docker** | Containerization | אריזה ופריסה |
| **Pino** | Logging | רישום אירועים |
| **React Router** | Routing | ניווט בין דפים |

---

## שאלות נפוצות

**Q: למה לא SQL במקום MongoDB?**
A: MongoDB גמיש יותר לנתונים לא מובנים (JSON), וקל יותר לשימוש עם JavaScript.

**Q: למה JWT ולא Sessions?**
A: JWT הוא stateless - לא צריך לאחסן session בשרת, מה שמקל על scaling.

**Q: למה Socket.IO ולא WebSocket רגיל?**
A: Socket.IO מספק fallback אוטומטי ו-middleware מובנה (כמו authentication).

**Q: למה Docker?**
A: מבטיח שהאפליקציה תעבוד זהה בכל סביבה (development, staging, production).

