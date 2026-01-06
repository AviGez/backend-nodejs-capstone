# חנות יד שנייה - פרויקט SecondChance

## תמצית
-------
זהו פרויקט מקיף של חנות יד שנייה (SecondChance) הכולל אפליקציה מלאה עם שירות backend (Node.js/Express + MongoDB) ו‑frontend (React). הפלטפורמה מאפשרת למשתמשים לקנות ולמכור פריטי יד שנייה עם תכונות כולל ניהול פריטים, העלאת תמונות, מערכת שיחות בזמן אמת עם Socket.IO, אינטגרציית תשלומים (PayPal), התראות, ופאנל מנהל.

---

## תוכן עניינים
- [תכונות מרכזיות](#תכונות-מרכזיות)
- [ארכיטקטורת הפרויקט](#ארכיטקטורת-הפרויקט)
- [מחסנית טכנולוגיות](#מחסנית-טכנולוגיות)
- [מבנה הפרויקט](#מבנה-הפרויקט)
- [תיעוד API](#תיעוד-api)
- [סכמת מסד הנתונים](#סכמת-מסד-הנתונים)
- [התקנה והגדרה](#התקנה-והגדרה)
- [משתני סביבה](#משתני-סביבה)
- [הרצת האפליקציה](#הרצת-האפליקציה)
- [פריסה עם Docker](#פריסה-עם-docker)
- [בדיקות](#בדיקות)
- [אבטחה](#אבטחה)
- [פתרון בעיות](#פתרון-בעיות)

---

## תכונות מרכזיות

### פונקציונליות בסיסית
- **ניהול פריטים**: יצירה, קריאה, עדכון ומחיקה של פריטי יד שנייה עם פרטים מפורטים
- **העלאת תמונות**: העלאת עד 5 תמונות לכל פריט (מאוחסנות ב‑`backend/public/images`)
- **חיפוש מתקדם**: סינון פריטים לפי שם, קטגוריה, מצב, מחיר, גיל, מיקום (עיר/אזור)
- **הזמנות פריטים**: הזמנת פריטים עם תאריכי תפוגה ושחרור אוטומטי
- **שיחות בזמן אמת**: מערכת צ'אט מבוססת Socket.IO לתקשורת קונה-מוכר
- **אינטגרציית תשלומים**: אינטגרציה עם PayPal Sandbox לתשלומים מאובטחים
- **אימות משתמשים**: אימות מבוסס JWT עם בקרת גישה מבוססת תפקידים (user/admin)
- **מערכת התראות**: התראות בזמן אמת לאירועים שונים
- **פאנל מנהל**: ניהול משתמשים, אכיפת פריטים וסטטיסטיקות מערכת
- **היסטוריית רכישות**: מעקב אחר רכישות ומכירות עבור קונים ומוכרים

### תכונות מתקדמות
- **שירותים מבוססי מיקום**: ניהול מיקומי איסוף עם תמיכה בגיאולוקציה
- **מערכת הזמנות**: טיפול אוטומטי בתפוגה ומעקב אחר timeouts של קונים
- **תהליך אישור**: אישור מוכר לבקשות איסוף פריטים
- **תצוגת קרוסלה**: קרוסלת פריטים מומלצים בעמוד הבית
- **עיצוב רספונסיבי**: ממשק משתמש מותאם למובייל עם React Bootstrap

---

## ארכיטקטורת הפרויקט

### ארכיטקטורת Backend
- **Framework**: Express.js (Node.js)
- **מסד נתונים**: MongoDB עם native driver
- **אימות**: טוקני JWT עם הצפנת סיסמאות bcrypt
- **זמן אמת**: Socket.IO לפונקציונליות צ'אט
- **העלאת קבצים**: Multer לטיפול בתמונות
- **לוגים**: Pino logger עם HTTP middleware
- **ולידציה**: express-validator לוולידציית קלט

### ארכיטקטורת Frontend
- **Framework**: React 18 עם Create React App
- **ניהול מצב**: React Context API (`AppContext`)
- **ניתוב**: React Router DOM v6
- **ספריית UI**: React Bootstrap 5
- **זמן אמת**: Socket.IO client
- **תשלומים**: PayPal React SDK
- **עיצוב**: מודולי CSS ו‑Bootstrap

---

## מחסנית טכנולוגיות

### תלויות Backend
- `express` ^4.18.2 - Web framework
- `mongodb` 6.8.0 - Database driver
- `jsonwebtoken` ^9.0.2 - JWT authentication
- `bcryptjs` ^2.4.3 - Password hashing
- `socket.io` ^4.8.1 - Real-time communication
- `multer` ^1.4.5-lts.1 - File upload handling
- `cors` ^2.8.5 - Cross-origin resource sharing
- `pino` ^8.17.2 - Logging
- `express-validator` ^7.0.1 - Input validation
- `axios` ^1.4.0 - HTTP client for PayPal API
- `dotenv` ^16.3.1 - Environment variables

### תלויות Frontend
- `react` ^18.2.0 - UI library
- `react-router-dom` ^6.20.1 - Routing
- `react-bootstrap` ^2.9.2 - UI components
- `socket.io-client` ^4.7.2 - Real-time client
- `@paypal/react-paypal-js` ^8.9.2 - PayPal integration
- `react-datepicker` ^4.24.0 - Date selection
- `bootstrap` ^5.3.2 - CSS framework

---

## מבנה הפרויקט

### מבנה Backend (`backend/`)
```
backend/
├── app.js                    # נקודת כניסה ראשית לשרת
├── logger.js                 # הגדרת Pino logger
├── socket.js                 # אתחול Socket.IO ומטפלי אירועים
├── Dockerfile               # הגדרת Docker image
├── package.json             # תלויות וסקריפטים
│
├── middleware/
│   └── auth.js              # Middleware אימות JWT ואישור מנהל
│
├── models/
│   ├── db.js                # Singleton חיבור MongoDB
│   └── baseModel.js         # פונקציות עזר (נרמול ObjectId)
│
├── routes/
│   ├── authRoutes.js         # נקודות קצה אימות (register, login, update)
│   ├── secondChanceItemsRoutes.js  # פעולות CRUD על פריטים
│   ├── searchRoutes.js      # פונקציונליות חיפוש מתקדם
│   ├── chatRoutes.js        # נקודות קצה ניהול צ'אט
│   ├── notificationsRoutes.js  # נקודות קצה מערכת התראות
│   ├── paymentRoutes.js     # עיבוד תשלומי PayPal
│   └── adminUsersRoutes.js  # ניהול משתמשים מנהל
│
├── services/
│   └── reservations.js      # שירות ניקוי הזמנות שפגו
│
├── scripts/
│   ├── add_balance_to_users.js    # סקריפט מיגרציית נתונים
│   └── remove_shipping_fields.js  # סקריפט מיגרציית נתונים
│
└── public/
    └── images/              # תמונות פריטים שהועלו (מוגשות סטטית)
```

### מבנה Frontend (`frontend/`)
```
frontend/
├── public/
│   ├── index.html          # תבנית HTML ראשית
│   ├── home.html           # תבנית עמוד בית
│   └── manifest.json       # PWA manifest
│
├── src/
│   ├── index.js            # נקודת כניסה React
│   ├── App.js              # רכיב אפליקציה ראשי עם ניתוב
│   ├── config.js           # קונפיגורציית כתובת backend
│   │
│   ├── context/
│   │   └── AppContext.js   # ניהול מצב גלובלי (auth, user)
│   │
│   └── components/
│       ├── AdminPanel/     # לוח בקרה מנהל
│       ├── ChatModal/      # ממשק צ'אט בזמן אמת
│       ├── DetailsPage/    # תצוגת פרטי פריט
│       ├── Footer/         # כותרת תחתית אתר
│       ├── ItemPage/       # עמוד רשימת פריטים
│       ├── LoginPage/      # התחברות משתמש
│       ├── MainPage/       # עמוד בית עם קרוסלה
│       ├── Navbar/         # סרגל ניווט
│       ├── NewArrivalsCarousel/  # קרוסלת פריטים מומלצים
│       ├── PaymentModal/   # ממשק תשלום PayPal
│       ├── Profile/        # עמוד פרופיל משתמש
│       ├── PurchaseHistory/  # היסטוריית רכישות/מכירות
│       ├── RegisterPage/   # רישום משתמש
│       └── SearchPage/     # ממשק חיפוש מתקדם
│
├── Dockerfile              # Build ייצור עם nginx
└── package.json            # תלויות וסקריפטים
```

---

## תיעוד API

### כתובת בסיס
- פיתוח: `http://localhost:3060`
- ייצור: מוגדר דרך משתנה סביבה `REACT_APP_API_URL`

### אימות
רוב נקודות הקצה דורשות אימות JWT דרך header:
```
Authorization: Bearer <JWT_TOKEN>
```

### נקודות קצה API עיקריות

#### 1. אימות (`/api/auth`)
- `POST /api/auth/register` - רישום משתמש חדש
  - Body: `{ email, password, firstName, lastName, role? }`
  - מחזיר: `{ authtoken, email, role, userId }`
- `POST /api/auth/login` - התחברות משתמש
  - Body: `{ email, password }`
  - מחזיר: `{ authtoken, userName, userEmail, userRole, userId }`
- `PUT /api/auth/update` - עדכון פרופיל משתמש (דורש auth)
  - Body: `{ name }`

#### 2. פריטים (`/api/secondchance/items`)
- `GET /api/secondchance/items` - רשימת פריטים (תומך בפילטרים)
- `GET /api/secondchance/items/carousel` - פריטים מומלצים לקרוסלה
- `GET /api/secondchance/items/:id` - קבלת פריט לפי ID
- `POST /api/secondchance/items` - יצירת פריט חדש (auth, multipart/form-data)
  - שדות: `name`, `description`, `price`, `city`, `area`, `images` (עד 5)
- `PUT /api/secondchance/items/:id` - עדכון פריט (auth, owner/admin)
- `DELETE /api/secondchance/items/:id` - מחיקת פריט (auth, owner/admin)
- `POST /api/secondchance/items/:id/reserve` - הזמנת פריט (auth)
- `POST /api/secondchance/items/:id/cancel-reservation` - ביטול הזמנה (auth)
- `GET /api/secondchance/items/mine` - קבלת פריטי המשתמש (auth)
- `GET /api/secondchance/items/reservations/me` - קבלת הזמנות המשתמש (auth)

#### 3. חיפוש (`/api/secondchance/search`)
- `GET /api/secondchance/search` - חיפוש מתקדם
  - פרמטרי שאילתה: `name`, `category`, `condition`, `price`, `price_max`, `age_years`, `city`, `area`, `sort`

#### 4. צ'אט (`/api/chats`)
- `POST /api/chats/:itemId` - יצירת צ'אט עבור פריט (auth)
- `GET /api/chats/` - קבלת צ'אטים של המשתמש (auth)
- `GET /api/chats/:chatId/messages` - קבלת הודעות צ'אט (auth)
- `POST /api/chats/:chatId/messages` - שליחת הודעה (auth)
  - Body: `{ content: string }`
- `PATCH /api/chats/:chatId/approve` - אישור צ'אט (seller/admin)
- `DELETE /api/chats/:chatId` - מחיקת צ'אט (owner/admin)

#### 5. תשלומים (`/api/payments`)
- `POST /api/payments/create-order` - יצירת הזמנת תשלום (auth)
  - Body: `{ itemId, amount, deliveryMethod?, shippingAddress? }`
- `POST /api/payments/capture-order` - לכידת תשלום (auth)
  - Body: `{ orderId }`
- `POST /api/payments/cancel-order` - ביטול הזמנה (auth)
- `GET /api/payments/my-purchases` - קבלת היסטוריית רכישות (auth)
- `GET /api/payments/my-sales` - קבלת היסטוריית מכירות (auth)
- `GET /api/payments/paypal-config` - קבלת PayPal client ID (public)

#### 6. התראות (`/api/notifications`)
- `GET /api/notifications/` - קבלת התראות משתמש (auth)
- `POST /api/notifications/mark-read` - סימון התראות כנקראו (auth)
  - Body: `{ ids?: string[] }` (ריק = סמן את כל הלא נקראות)
- `DELETE /api/notifications/:id` - מחיקת התראה (auth)
- `POST /api/notifications/preferences` - שמירת העדפות התראות (auth)
- `GET /api/notifications/preferences` - קבלת העדפות התראות (auth)
- `GET /api/notifications/admin/unread` - ספירת התראות מנהל לא נקראו (admin בלבד)

#### 7. מנהל (`/api/admin/users`)
- `GET /api/admin/users/` - רשימת כל המשתמשים (admin)
- `DELETE /api/admin/users/:id` - מחיקת משתמש (admin)
- `POST /api/admin/users/:id/message` - שליחת הודעה למשתמש (admin)
  - Body: `{ title?, message }`

### אירועי Socket.IO

#### לקוח → שרת
- `join_chat` - הצטרפות לחדר צ'אט: `{ chatId }`
- `send_message` - שליחת הודעה: `{ chatId, content }`

#### שרת → לקוח
- `chat_joined` - אישור הצטרפות לצ'אט: `{ chatId }`
- `new_message` - הודעה חדשה התקבלה: `{ id, chatId, senderId, content, createdAt }`
- `error` - שגיאה אירעה: `{ message }`

---

## סכמת מסד הנתונים

### Collections MongoDB

#### `users`
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String ('user' | 'admin'),
  pickupTimeoutCount: Number (default: 0),
  pickupTimeoutFlagged: Boolean (default: false),
  createdAt: Date
}
```

#### `secondChanceItems`
```javascript
{
  _id: ObjectId,
  id: String (unique identifier),
  name: String,
  description: String,
  price: Number,
  category: String,
  condition: String,
  images: [String] (image filenames),
  ownerId: String (user ID),
  status: String ('available' | 'reserved' | 'sold'),
  city: String,
  area: String,
  lat: Number,
  lng: Number,
  pickupLocations: [Object],
  reservedByUserId: String?,
  reservedUntil: Date?,
  reservedReason: String?,
  pickupApprovedAt: Date?,
  createdAt: Date,
  updatedAt: Date
}
```

#### `chats`
```javascript
{
  _id: ObjectId,
  itemId: String,
  buyerId: String,
  sellerId: String,
  isApproved: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### `chatMessages`
```javascript
{
  _id: ObjectId,
  chatId: ObjectId,
  senderId: String,
  content: String,
  createdAt: Date
}
```

#### `payments`
```javascript
{
  _id: ObjectId,
  orderId: String (unique),
  itemId: String,
  buyerId: String,
  sellerId: String,
  amount: Number,
  deliveryMethod: String ('pickup' | 'shipping'),
  shippingAddress: String?,
  status: String ('pending' | 'completed' | 'cancelled'),
  createdAt: Date,
  completedAt: Date?,
  updatedAt: Date
}
```

#### `notifications`
```javascript
{
  _id: ObjectId,
  userId: String,
  title: String,
  message: String,
  category: String,
  isRead: Boolean,
  createdAt: Date
}
```

---

## התקנה והגדרה

### דרישות מראש
- **Node.js** 18+ ו‑npm
- **MongoDB** 6+ (או שימוש ב‑Docker Compose)
- **Docker** + Docker Compose (אופציונלי, לפריסה מבוססת containers)
- **חשבון PayPal Developer** (אופציונלי, לאינטגרציית תשלומים)

### שלב 1: שכפול המאגר
```bash
git clone <repository-url>
cd Second-hand-store
```

### שלב 2: הגדרת Backend
```bash
cd backend
npm ci
```

צור קובץ `.env` ב‑`backend/`:
```env
MONGO_URL=mongodb://localhost:27017/secondChance
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=3060
PAYPAL_CLIENT_ID=your-paypal-client-id (optional)
PAYPAL_SECRET=your-paypal-secret (optional)
FRONTEND_BASE_URL=http://localhost:3000
SOCKET_ORIGIN=*
```

### שלב 3: הגדרת Frontend
```bash
cd frontend
npm ci
```

צור קובץ `.env` ב‑`frontend/`:
```env
REACT_APP_API_URL=http://localhost:3060
REACT_APP_BACKEND_URL=http://localhost:3060
```

---

## משתני סביבה

### משתני סביבה Backend
| משתנה | תיאור | ברירת מחדל | נדרש |
|--------|-------|-------------|------|
| `MONGO_URL` | מחרוזת חיבור MongoDB | - | כן |
| `JWT_SECRET` | מפתח סודי לטוקני JWT | - | כן |
| `NODE_ENV` | סביבה (development/production) | development | לא |
| `PORT` | פורט שרת | 3060 | לא |
| `PAYPAL_CLIENT_ID` | PayPal client ID | - | אופציונלי |
| `PAYPAL_SECRET` | מפתח סודי PayPal | - | אופציונלי |
| `FRONTEND_BASE_URL` | כתובת Frontend ל‑CORS | http://localhost:3000 | לא |
| `SOCKET_ORIGIN` | מקור Socket.IO CORS | * | לא |

### משתני סביבה Frontend
| משתנה | תיאור | ברירת מחדל | נדרש |
|--------|-------|-------------|------|
| `REACT_APP_API_URL` | כתובת Backend API | http://localhost:3060 | כן |
| `REACT_APP_BACKEND_URL` | כתובת Backend חלופית | - | לא |

---

## הרצת האפליקציה

### מצב פיתוח

#### אפשרות 1: פיתוח מקומי (טרמינלים נפרדים)

**טרמינל 1 - MongoDB:**
```bash
# אם MongoDB מותקן מקומית
mongod

# או שימוש ב‑Docker
docker run -d -p 27017:27017 --name mongo mongo:6
```

**טרמינל 2 - Backend:**
```bash
cd backend
npm run dev  # משתמש ב‑nodemon ל‑auto-reload
```

**טרמינל 3 - Frontend:**
```bash
cd frontend
npm start  # פותח http://localhost:3000
```

#### אפשרות 2: Docker Compose (מומלץ)
```bash
# מתיקיית שורש הפרויקט
docker compose up --build

# או במצב detached
docker compose up -d --build
```

גישה:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3060
- MongoDB: localhost:27017

### מצב ייצור

#### Backend
```bash
cd backend
npm start
```

#### Frontend
```bash
cd frontend
npm run build
# הגשה של תיקיית build/ עם שרת אינטרנט (nginx, Apache, וכו')
```

---

## פריסה עם Docker

### הגדרת Docker Compose
קובץ `docker-compose.yml` מגדיר שלושה שירותים:

1. **mongo**: מסד נתונים MongoDB 6
   - פורט: 27017
   - Volume: `mongo_data` לשמירה
   - פרטי התחברות: root/example

2. **backend**: שרת Node.js Express
   - פורט: 3060
   - תלוי ב: mongo
   - משתני סביבה מ‑`.env` או docker-compose

3. **frontend**: אפליקציית React מוגשת דרך nginx
   - פורט: 3000 (host) → 80 (container)
   - תלוי ב: backend
   - בונה אפליקציית React ומגיש קבצים סטטיים

### בנייה והרצה
```bash
# בנייה והפעלת כל השירותים
docker compose up --build

# עצירת שירותים
docker compose down

# עצירה והסרת volumes
docker compose down -v

# צפייה בלוגים
docker compose logs -f [service-name]
```

### Dockerfiles

**Backend Dockerfile:**
- בסיס: `node:18-alpine`
- מתקין תלויות
- מריץ `node app.js`

**Frontend Dockerfile:**
- בונה אפליקציית React (`npm run build`)
- משתמש ב‑`nginx:alpine` להגשת קבצים סטטיים
- מגדיר nginx לניתוב SPA

---

## בדיקות

### בדיקות Backend
```bash
cd backend
npm test
```

מחסנית בדיקות:
- **Mocha** - מסגרת בדיקות
- **Chai** - ספריית assertions
- **Sinon** - Mocking ו‑spying
- **Supertest** - HTTP assertions

### בדיקות Frontend
```bash
cd frontend
npm test
```

משתמש ב‑React Testing Library ו‑Jest (דרך Create React App).

---

## אבטחה

### אימות והרשאה
- **טוקני JWT**: אימות מבוסס טוקנים מאובטח
- **הצפנת סיסמאות**: bcryptjs עם salt rounds
- **גישה מבוססת תפקידים**: תפקידי admin ו‑user
- **ולידציית טוקנים**: Middleware מאמת טוקנים בנתיבים מוגנים

### שיטות עבודה מומלצות לאבטחה
- לעולם אל תעלה קבצי `.env` עם סודות ל‑Git
- השתמש ב‑`JWT_SECRET` חזק בייצור
- הפעל HTTPS בייצור
- אמת את כל קלטי המשתמש (express-validator)
- סנן העלאות קבצים (Multer)
- הגדרת CORS למקורות מורשים
- הגבלת קצב (שקול להוסיף לייצור)

### אבטחת תשלומים
- PayPal Sandbox לבדיקות (ללא כסף אמיתי)
- ולידציית תשלום בצד שרת
- אימות Order ID
- בדיקות זמינות פריט לפני תשלום

---

## פתרון בעיות

### בעיות נפוצות

#### שגיאות חיבור MongoDB
**בעיה**: `Failed to connect to DB`
- **פתרון**: 
  - ודא ש‑MongoDB רץ: `mongod` או `docker ps`
  - בדוק ש‑`MONGO_URL` ב‑`.env` תואם להגדרת MongoDB שלך
  - ודא ש‑MongoDB נגיש (firewall, network)

#### שגיאות אימות JWT
**בעיה**: `Invalid or expired token`
- **פתרון**:
  - ודא ש‑`JWT_SECRET` מוגדר נכון
  - בדוק תפוגת טוקן (ברירת מחדל: ללא תפוגה)
  - ודא שטוקן נשלח ב‑header: `Authorization: Bearer <token>`

#### שגיאות CORS
**בעיה**: CORS policy חוסם בקשות
- **פתרון**:
  - בדוק ש‑`FRONTEND_BASE_URL` תואם לכתובת Frontend שלך
  - ודא ש‑`SOCKET_ORIGIN` מאפשר את המקור שלך
  - Backend משתמש ב‑`app.use("*", cors())` - התאם אם נדרש

#### העלאת תמונות נכשלת
**בעיה**: תמונות לא מועלות
- **פתרון**:
  - בדוק שתיקיית `backend/public/images/` קיימת וניתנת לכתיבה
  - ודא הגדרת Multer
  - בדוק מגבלות גודל קובץ (ברירת מחדל: ללא הגבלה)
  - ודא סוג תוכן `multipart/form-data`

#### בעיות חיבור Socket.IO
**בעיה**: צ'אט לא עובד
- **פתרון**:
  - ודא ש‑Socket.IO server מאותחל ב‑`app.js`
  - בדוק שטוקן מועבר ב‑socket handshake: `auth: { token }`
  - ודא ש‑`SOCKET_ORIGIN` מאפשר את המקור שלך
  - בדוק console בדפדפן לשגיאות חיבור

#### בעיות אינטגרציית PayPal
**בעיה**: תשלום לא מתעבד
- **פתרון**:
  - ודא ש‑`PAYPAL_CLIENT_ID` ו‑`PAYPAL_SECRET` מוגדרים (אופציונלי למצב sandbox)
  - בדוק סטטוס חשבון PayPal Sandbox
  - ודא ש‑PayPal SDK נטען ב‑Frontend
  - בדוק בקשות רשת ב‑DevTools בדפדפן

---

## קישורים מהירים (קבצים חשובים)

- `backend/app.js` - נקודת כניסה לשרת ורישום נתיבים
- `backend/models/db.js` - Singleton חיבור MongoDB
- `backend/middleware/auth.js` - Middleware אימות JWT
- `backend/socket.js` - אתחול Socket.IO ומטפלי אירועים
- `backend/services/reservations.js` - שירות ניקוי הזמנות שפגו
- `frontend/src/config.js` - קונפיגורציית כתובת backend
- `frontend/src/context/AppContext.js` - ניהול מצב גלובלי
- `frontend/src/App.js` - אפליקציית React ראשית עם ניתוב
- `docker-compose.yml` - הגדרת שירותי Docker
- `API.md` - תיעוד מפורט של נקודות קצה API
- `PAYMENT_INTEGRATION.md` - מדריך אינטגרציית PayPal

---

## תיעוד נוסף

- **API.md** - תיעוד מלא של נקודות קצה API עם דוגמאות
- **PAYMENT_INTEGRATION.md** - מדריך הגדרה ושימוש באינטגרציית PayPal

---

## הפניה לסקריפטים

### סקריפטים Backend (`backend/package.json`)
- `npm start` - הפעלת שרת ייצור
- `npm run dev` - הפעלת שרת פיתוח עם nodemon
- `npm test` - הרצת סדרת בדיקות
- `npm run fetch:demo-images` - שליפת תמונות דמו (אם הסקריפט קיים)

### סקריפטים Frontend (`frontend/package.json`)
- `npm start` - הפעלת שרת פיתוח
- `npm run build` - בנייה לייצור
- `npm test` - הרצת בדיקות
- `npm run eject` - יציאה מ‑Create React App (בלתי הפיך)

### סקריפטי עזר (`backend/scripts/`)
- `add_balance_to_users.js` - הוספת שדה balance לאוסף users
- `remove_shipping_fields.js` - מיגרציית הסרת שדות shipping

---

## רישיון
ראה קובץ `LICENSE` במאגר.

---

## תרומה

### תהליך פיתוח
1. Fork את המאגר
2. צור branch תכונה: `git checkout -b feature/your-feature`
3. בצע את השינויים שלך
4. בדוק היטב
5. Commit: `git commit -m "Add feature"`
6. Push: `git push origin feature/your-feature`
7. פתח Pull Request

### סגנון קוד
- עקוב אחר דפוסי קוד קיימים
- השתמש בשמות משתנים משמעותיים
- הוסף הערות ללוגיקה מורכבת
- עדכן תיעוד לשינויים ב‑API

---

## תמיכה

לבעיות, שאלות או תרומות:
- פתח issue ב‑GitHub
- בדוק תיעוד קיים
- עיין ב‑`API.md` לפרטי נקודות קצה
- בדוק `PAYMENT_INTEGRATION.md` להגדרת תשלומים

---

**תודה על השימוש ב‑SecondChance!**
