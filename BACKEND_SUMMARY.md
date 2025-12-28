# סיכום Backend - SecondChance Application

## 📋 תוכן עניינים
1. [מבנה כללי](#מבנה-כללי)
2. [טכנולוגיות עיקריות](#טכנולוגיות-עיקריות)
3. [מבנה הקבצים](#מבנה-הקבצים)
4. [Routes (API Endpoints)](#routes-api-endpoints)
5. [Authentication & Authorization](#authentication--authorization)
6. [Database](#database)
7. [WebSocket (Real-time)](#websocket-real-time)
8. [תהליכים עיקריים](#תהליכים-עיקריים)

---

## 🏗️ מבנה כללי

ה-backend בנוי על **Node.js + Express** ומשתמש ב-**MongoDB** כמסד נתונים.

### נקודת הכניסה: `app.js`
- יוצר Express server
- מתחבר ל-MongoDB
- מגדיר routes
- מפעיל WebSocket server
- מטפל ב-errors גלובליים

---

## 🛠️ טכנולוגיות עיקריות

### Dependencies:
- **express** - Web framework
- **mongodb** - Database driver
- **jsonwebtoken (JWT)** - Authentication
- **bcryptjs** - Password hashing
- **multer** - File uploads
- **socket.io** - Real-time communication
- **cors** - Cross-origin requests
- **pino** - Logging
- **dotenv** - Environment variables

---

## 📁 מבנה הקבצים

```
secondChance-backend/
├── app.js                    # נקודת כניסה ראשית
├── socket.js                 # WebSocket configuration
├── logger.js                 # Logging configuration
├── package.json              # Dependencies
├── Dockerfile                # Docker configuration
│
├── models/
│   ├── db.js                 # חיבור ל-MongoDB
│   └── baseModel.js          # Utilities (ObjectId normalization)
│
├── middleware/
│   └── auth.js               # Authentication & Authorization middleware
│
├── routes/
│   ├── authRoutes.js         # Registration, Login, Update
│   ├── secondChanceItemsRoutes.js  # CRUD operations על פריטים
│   ├── searchRoutes.js       # חיפוש פריטים
│   ├── chatRoutes.js         # ניהול צ'אטים
│   └── notificationsRoutes.js # ניהול התראות
│
├── services/
│   └── reservations.js       # לוגיקת הזמנות
│
└── public/
    └── images/               # תמונות שהועלו
```

---

## 🛣️ Routes (API Endpoints)

### 1. Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
- **תפקיד**: הרשמת משתמש חדש
- **Body**: `{ email, password, firstName, lastName, role? }`
- **תהליך**:
  1. בודק אם האימייל כבר קיים
  2. מצפין את הסיסמה עם bcryptjs
  3. יוצר משתמש חדש ב-MongoDB
  4. אם זה המשתמש הראשון → role = 'admin', אחרת 'user'
  5. מחזיר JWT token
- **Response**: `{ authtoken, email, role, userId }`

#### POST `/api/auth/login`
- **תפקיד**: התחברות משתמש
- **Body**: `{ email, password }`
- **תהליך**:
  1. מוצא משתמש לפי email
  2. משווה סיסמה עם bcryptjs.compare()
  3. יוצר JWT token
- **Response**: `{ authtoken, userName, userEmail, userRole, userId }`

#### PUT `/api/auth/update`
- **תפקיד**: עדכון פרטי משתמש
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ name }`
- **תהליך**:
  1. מאמת token (middleware: authenticate)
  2. מעדכן שם משתמש
  3. יוצר token חדש
- **Response**: `{ authtoken, role }`

---

### 2. Items Routes (`/api/secondchance/items`)

#### GET `/api/secondchance/items`
- **תפקיד**: קבלת כל הפריטים הזמינים
- **תהליך**: מחזיר רק פריטים עם status = 'available'
- **Response**: Array of items

#### GET `/api/secondchance/items/carousel`
- **תפקיד**: פריטים ל-carousel (פריטים חדשים מ-7 ימים אחרונים)
- **Response**: Array of recent items

#### GET `/api/secondchance/items/:id`
- **תפקיד**: קבלת פריט ספציפי לפי ID
- **Response**: Single item object

#### POST `/api/secondchance/items`
- **תפקיד**: יצירת פריט חדש
- **Headers**: `Authorization: Bearer <token>`
- **Body**: FormData (כולל תמונות)
- **תהליך**:
  1. מאמת משתמש
  2. מעלה תמונות עם multer
  3. שומר פריט ב-MongoDB
  4. יוצר התראות למשתמשים
- **Response**: Created item

#### PUT `/api/secondchance/items/:id`
- **תפקיד**: עדכון פריט
- **Headers**: `Authorization: Bearer <token>`
- **תהליך**: רק הבעלים או admin יכולים לעדכן
- **Response**: Updated item

#### DELETE `/api/secondchance/items/:id`
- **תפקיד**: מחיקת פריט
- **Headers**: `Authorization: Bearer <token>`
- **תהליך**: רק הבעלים או admin יכולים למחוק

#### POST `/api/secondchance/items/:id/reserve`
- **תפקיד**: הזמנת פריט (10 שעות)
- **Headers**: `Authorization: Bearer <token>`
- **תהליך**:
  1. בודק שהפריט זמין
  2. יוצר הזמנה ל-10 שעות
  3. מעדכן status ל-'reserved'
  4. מפעיל timer לשחרור אוטומטי

#### GET `/api/secondchance/items/mine`
- **תפקיד**: קבלת הפריטים של המשתמש המחובר
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of user's items

#### GET `/api/secondchance/items/reservations/me`
- **תפקיד**: קבלת ההזמנות של המשתמש
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of reserved items

#### POST `/api/secondchance/items/:id/request-approval`
- **תפקיד**: בקשה לאישור איסוף (עבור פריטים בתשלום)
- **Headers**: `Authorization: Bearer <token>`
- **תהליך**: יוצר בקשה ב-itemApprovals collection

#### POST `/api/secondchance/items/:id/approve-buyer`
- **תפקיד**: אישור קונה (עבור מוכר)
- **Headers**: `Authorization: Bearer <token>`
- **תהליך**: מעדכן status ל-'approved' ויוצר chat

#### GET `/api/secondchance/items/:id/secure`
- **תפקיד**: קבלת מידע מאובטח (כתובת איסוף, אישורים)
- **Headers**: `Authorization: Bearer <token>`
- **תהליך**: מחזיר מידע רק אם המשתמש הוא המוכר או קונה מאושר

#### GET `/api/secondchance/items/:id/pickup-options`
- **תפקיד**: קבלת אפשרויות איסוף
- **Headers**: `Authorization: Bearer <token>`

#### Admin Routes:
- `GET /api/secondchance/items/admin/stats` - סטטיסטיקות
- `GET /api/secondchance/items/admin/all` - כל הפריטים
- `DELETE /api/secondchance/items/admin/:id` - מחיקה (admin only)

---

### 3. Search Routes (`/api/secondchance/search`)

#### GET `/api/secondchance/search`
- **תפקיד**: חיפוש פריטים
- **Query Parameters**: `name`, `category`, `condition`, `city`, `area`
- **תהליך**: מחפש במסד הנתונים לפי הפרמטרים
- **Response**: Array of matching items

---

### 4. Chat Routes (`/api/chats`)

#### POST `/api/chats/:itemId`
- **תפקיד**: יצירת צ'אט חדש
- **Headers**: `Authorization: Bearer <token>`
- **תהליך**: יוצר צ'אט בין קונה למוכר

#### GET `/api/chats`
- **תפקיד**: קבלת כל הצ'אטים של המשתמש
- **Headers**: `Authorization: Bearer <token>`

#### GET `/api/chats/:chatId/messages`
- **תפקיד**: קבלת הודעות בצ'אט
- **Headers**: `Authorization: Bearer <token>`

#### POST `/api/chats/:chatId/messages`
- **תפקיד**: שליחת הודעה (REST API)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ content }`

#### PATCH `/api/chats/:chatId/approve`
- **תפקיד**: אישור צ'אט
- **Headers**: `Authorization: Bearer <token>`

#### DELETE `/api/chats/:chatId`
- **תפקיד**: מחיקת צ'אט
- **Headers**: `Authorization: Bearer <token>`

---

### 5. Notifications Routes (`/api/notifications`)

#### GET `/api/notifications`
- **תפקיד**: קבלת כל ההתראות של המשתמש
- **Headers**: `Authorization: Bearer <token>`

#### POST `/api/notifications/mark-read`
- **תפקיד**: סימון התראות כנקראו
- **Headers**: `Authorization: Bearer <token>`

#### DELETE `/api/notifications/:id`
- **תפקיד**: מחיקת התראה
- **Headers**: `Authorization: Bearer <token>`

#### POST `/api/notifications/preferences`
- **תפקיד**: עדכון העדפות התראות
- **Headers**: `Authorization: Bearer <token>`

---

## 🔐 Authentication & Authorization

### Middleware: `middleware/auth.js`

#### `authenticate` middleware
- **תפקיד**: אימות משתמש
- **תהליך**:
  1. קורא token מה-header: `Authorization: Bearer <token>`
  2. מאמת token עם JWT_SECRET
  3. מוצא משתמש ב-MongoDB
  4. מוסיף `req.user` עם פרטי המשתמש
- **שימוש**: מוסיפים לפני routes שדורשים אימות

#### `authorizeAdmin` middleware
- **תפקיד**: בדיקה שהמשתמש הוא admin
- **תהליך**: בודק `req.user.role === 'admin'`
- **שימוש**: מוסיפים אחרי `authenticate` ל-routes של admin

### JWT Token Structure:
```javascript
{
  user: {
    id: "userId",
    role: "user" | "admin"
  }
}
```

---

## 🗄️ Database

### MongoDB Collections:

#### 1. `users`
- **שדות**: `_id`, `email`, `password` (hashed), `firstName`, `lastName`, `role`, `createdAt`
- **תפקיד**: אחסון משתמשים

#### 2. `secondChanceItems`
- **שדות**: `id`, `name`, `category`, `condition`, `price`, `status`, `image`, `galleryImages`, `city`, `area`, `description`, `date_added`, `userId`, `reservedUntil`, `pickupLocations`, `enableShipping`, `shippingBasePrice`, `shippingPricePerKm`
- **תפקיד**: אחסון פריטים

#### 3. `chats`
- **שדות**: `_id`, `itemId`, `buyerId`, `sellerId`, `isApproved`, `createdAt`, `updatedAt`
- **תפקיד**: אחסון צ'אטים בין קונים למוכרים

#### 4. `chatMessages`
- **שדות**: `_id`, `chatId`, `senderId`, `content`, `createdAt`
- **תפקיד**: אחסון הודעות בצ'אטים

#### 5. `itemApprovals`
- **שדות**: `itemId`, `buyerId`, `sellerId`, `status` (pending/approved/rejected), `chatId`, `createdAt`, `updatedAt`
- **תפקיד**: ניהול בקשות אישור איסוף

#### 6. `notifications`
- **שדות**: `_id`, `userId`, `type`, `message`, `read`, `createdAt`
- **תפקיד**: אחסון התראות למשתמשים

### Database Connection: `models/db.js`
- **פונקציה**: `connectToDatabase()`
- **תפקיד**: חיבור ל-MongoDB
- **Singleton pattern**: מחזיר אותו instance כל פעם
- **URL**: מקבל מ-`process.env.MONGO_URL`

---

## 🔌 WebSocket (Real-time)

### File: `socket.js`

### תהליך Authentication:
1. משתמש שולח token ב-handshake
2. מאמת token עם JWT
3. שומר `socket.userId`

### Events:

#### `join_chat`
- **תפקיד**: הצטרפות לחדר צ'אט
- **Data**: `{ chatId }`
- **תהליך**:
  1. בודק שהצ'אט קיים
  2. בודק שהמשתמש מורשה
  3. בודק שהצ'אט מאושר
  4. מצטרף ל-room: `chat:${chatId}`

#### `send_message`
- **תפקיד**: שליחת הודעה בזמן אמת
- **Data**: `{ chatId, content }`
- **תהליך**:
  1. בודק הרשאות
  2. שומר הודעה ב-MongoDB
  3. מעדכן `updatedAt` של הצ'אט
  4. שולח `new_message` לכל המחוברים לחדר

### Rooms:
- כל צ'אט = room נפרד
- Format: `chat:${chatId}`
- רק משתמשים מורשים יכולים להצטרף

---

## ⚙️ תהליכים עיקריים

### 1. יצירת פריט חדש
1. משתמש מעלה תמונות (multer)
2. שומר פריט ב-MongoDB
3. יוצר התראות למשתמשים רלוונטיים
4. מחזיר פריט חדש

### 2. הזמנת פריט
1. בודק שהפריט זמין
2. יוצר הזמנה ל-10 שעות
3. מעדכן status ל-'reserved'
4. מפעיל timer לשחרור אוטומטי (service: reservations.js)

### 3. תהליך אישור איסוף (עבור פריטים בתשלום)
1. קונה מבקש אישור (`request-approval`)
2. מוכר רואה את הבקשה
3. מוכר מאשר (`approve-buyer`)
4. נוצר צ'אט אוטומטית
5. קונה מקבל גישה לכתובת איסוף

### 4. מערכת צ'אט
- **REST API**: יצירה, קריאה, מחיקה
- **WebSocket**: הודעות בזמן אמת
- **אישור**: צ'אט נפתח רק אחרי אישור מוכר

### 5. מערכת התראות
- התראות על פריטים חדשים
- התראות על הזמנות
- התראות על בקשות אישור
- העדפות משתמש

---

## 🔒 אבטחה

### 1. Password Hashing
- משתמש ב-`bcryptjs`
- סיסמאות לא נשמרות במצב גולמי

### 2. JWT Authentication
- כל request מאומת עם token
- Token מכיל: userId, role
- Secret key ב-`.env`

### 3. Authorization
- בדיקת בעלות על משאבים
- Admin routes מוגנים עם `authorizeAdmin`
- בדיקת הרשאות לפני פעולות

### 4. Input Validation
- שימוש ב-`express-validator`
- בדיקת קלט לפני עיבוד

---

## 📤 File Upload

### Multer Configuration
- **Destination**: `public/images/`
- **Filename**: `{safeName}-{timestamp}-{random}.{ext}`
- **Max files**: מוגדר ב-`MAX_IMAGES_PER_ITEM`
- **Storage**: `diskStorage` (שמירה על הדיסק)

---

## 🎯 נקודות חשובות למבחן

1. **Authentication Flow**: Register → Login → JWT Token → Authenticate Middleware
2. **Authorization**: Role-based (user/admin)
3. **Database Structure**: Collections ו-relationships
4. **WebSocket**: Real-time messaging
5. **File Upload**: Multer configuration
6. **Reservations**: Timer system לשחרור אוטומטי
7. **Approval System**: תהליך אישור איסוף
8. **Error Handling**: Global error handler
9. **Environment Variables**: `.env` file
10. **Docker**: Containerization עם docker-compose

---

## 📝 דוגמאות קוד חשובות

### חיבור ל-Database:
```javascript
const db = await connectToDatabase();
const collection = db.collection('secondChanceItems');
```

### Authentication Middleware:
```javascript
router.get('/protected', authenticate, (req, res) => {
  // req.user מכיל פרטי המשתמש
});
```

### Admin Route:
```javascript
router.delete('/admin/:id', authenticate, authorizeAdmin, ...);
```

### WebSocket Event:
```javascript
socket.on('send_message', async ({ chatId, content }) => {
  // שליחת הודעה בזמן אמת
});
```

---

## 🚀 הרצה

```bash
# Development
npm run dev

# Production
npm start

# Docker
docker-compose up
```

---

**Port**: 3060  
**Database**: MongoDB (port 27017)  
**Environment**: `.env` file עם:
- `MONGO_URL`
- `JWT_SECRET`
- `FRONTEND_BASE_URL`
- `SOCKET_ORIGIN`

