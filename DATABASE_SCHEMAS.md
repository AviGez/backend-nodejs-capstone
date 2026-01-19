# 📊 Database Schemas - כל הסכמות במסד הנתונים

## 🗂️ מיקום הסכמות

**חשוב:** הפרויקט הזה משתמש ב-**MongoDB Native Driver** (לא Mongoose), ולכן אין קבצי schema מפורשים. הסכמות מוגדרות **מרומז** דרך הקוד שמשתמש ב-collections.

### 📁 איפה הסכמות מוגדרות:

1. **`backend/models/db.js`** - חיבור למסד הנתונים
2. **`backend/routes/*.js`** - כל ה-routes מגדירים את הסכמות דרך השימוש ב-collections
3. **`README.md`** - תיעוד בסיסי של הסכמות (שורות 259-360)

---

## 📋 רשימת כל ה-Collections

### 1. `users` - משתמשים
**מיקום בקוד:**
- `backend/routes/authRoutes.js` (שורות 41, 96, 154)
- `backend/routes/adminUsersRoutes.js` (שורות 13, 47)
- `backend/middleware/auth.js` (שורה 35)
- `backend/routes/notificationsRoutes.js` (שורות 211, 228)
- `backend/services/reservations.js` (שורה 24)

**סכמה:**
```javascript
{
  _id: ObjectId,                    // MongoDB ID
  email: String,                    // אימייל (unique)
  password: String,                // סיסמה מוצפנת (bcrypt)
  firstName: String,               // שם פרטי
  lastName: String,                // שם משפחה
  role: String,                    // 'user' | 'admin'
  pickupTimeoutCount: Number,     // מספר פעמים שהחמיץ איסוף (default: 0)
  pickupTimeoutFlagged: Boolean,  // האם מסומן כבעייתי (default: false)
  createdAt: Date                 // תאריך יצירה
}
```

**דוגמה מהקוד:**
```javascript
// authRoutes.js - שורה 41
const collection = db.collection("users");
const existingEmail = await collection.findOne({ email: req.body.email });
```

---

### 2. `secondChanceItems` - פריטים
**מיקום בקוד:**
- `backend/routes/secondChanceItemsRoutes.js` (כל ה-routes)
- `backend/routes/paymentRoutes.js` (שורות 25, 86)
- `backend/services/reservations.js` (שורה 23)

**סכמה:**
```javascript
{
  _id: ObjectId,                    // MongoDB ID
  id: String,                       // מזהה ייחודי (unique)
  name: String,                     // שם הפריט
  description: String,              // תיאור
  price: Number,                    // מחיר (0 = חינם)
  category: String,                 // קטגוריה
  condition: String,                // מצב: 'New' | 'Like New' | 'Older'
  
  // תמונות
  image: String,                    // תמונה ראשית (path)
  galleryImages: [String],          // גלריית תמונות (עד 5)
  
  // בעלים
  ownerId: String,                 // ID של הבעלים
  ownerEmail: String,              // אימייל של הבעלים
  
  // סטטוס
  status: String,                  // 'available' | 'reserved' | 'sold'
  reservedByUserId: String?,      // ID של מי ששמר (אם שמור)
  reservedUntil: Date?,            // תאריך סיום הזמנה
  reservedReason: String?,         // סיבת הזמנה
  
  // מיקום
  city: String,                    // עיר
  area: String,                    // אזור
  zipcode: String,                // מיקוד
  lat: Number?,                   // קו רוחב
  lng: Number?,                   // קו אורך
  mapUrl: String?,                // קישור למפה
  
  // איסוף
  pickupLocations: [Object],      // מיקומי איסוף
  pickupApprovedAt: Date?,        // תאריך אישור איסוף
  
  // תאריכים
  date_added: Number,             // תאריך הוספה (timestamp)
  age_days: Number,               // גיל בימים
  age_years: Number,              // גיל בשנים
  
  // תגובות
  comments: [Object],             // תגובות על הפריט
  
  // קרוסלה
  carouselExitNotified: Boolean,  // האם נשלחה התראה על יציאה מקרוסלה
  
  // מכירה
  soldAt: Date?,                   // תאריך מכירה
  soldTo: String?,                // ID של הקונה
  isPaid: Boolean?                // האם שולם
}
```

**דוגמה מהקוד:**
```javascript
// secondChanceItemsRoutes.js - שורה 517
const collection = db.collection("secondChanceItems");
const insertResult = await collection.insertOne(secondChanceItem);
```

---

### 3. `chats` - צ'אטים
**מיקום בקוד:**
- `backend/routes/chatRoutes.js` (שורות 21, 54, 126, 150, 185, 234, 287)
- `backend/socket.js` (שורה 23, 90)

**סכמה:**
```javascript
{
  _id: ObjectId,                   // MongoDB ID
  itemId: String,                  // ID של הפריט
  buyerId: String,                 // ID של הקונה
  sellerId: String,               // ID של המוכר
  isApproved: Boolean,            // האם אושר (לאישור איסוף)
  createdAt: Date,                // תאריך יצירה
  updatedAt: Date                 // תאריך עדכון אחרון
}
```

**דוגמה מהקוד:**
```javascript
// chatRoutes.js - שורה 21
const chatsCollection = db.collection('chats');
const chat = await chatsCollection.findOne({ itemId, buyerId });
```

---

### 4. `chatMessages` - הודעות צ'אט
**מיקום בקוד:**
- `backend/routes/chatRoutes.js` (שורות 22, 186, 235, 288)
- `backend/socket.js` (שורה 91)

**סכמה:**
```javascript
{
  _id: ObjectId,                   // MongoDB ID
  chatId: ObjectId,               // ID של הצ'אט (reference ל-chats)
  senderId: String,              // ID של השולח
  content: String,                // תוכן ההודעה
  createdAt: Date                // תאריך שליחה
}
```

**דוגמה מהקוד:**
```javascript
// chatRoutes.js - שורה 186
const messagesCollection = db.collection('chatMessages');
const messages = await messagesCollection.find({ chatId: objectId }).toArray();
```

---

### 5. `payments` - תשלומים
**מיקום בקוד:**
- `backend/routes/paymentRoutes.js` (שורות 26, 85, 151, 194, 212)

**סכמה:**
```javascript
{
  _id: ObjectId,                   // MongoDB ID
  orderId: String,                 // מזהה הזמנה (PayPal) - unique
  itemId: String,                 // ID של הפריט
  buyerId: String,                // ID של הקונה
  sellerId: String,               // ID של המוכר
  amount: Number,                 // סכום התשלום
  status: String,                 // 'pending' | 'completed' | 'cancelled'
  createdAt: Date,               // תאריך יצירה
  completedAt: Date?,            // תאריך השלמה
  updatedAt: Date                 // תאריך עדכון אחרון
}
```

**דוגמה מהקוד:**
```javascript
// paymentRoutes.js - שורה 26
const paymentsCollection = db.collection('payments');
const payment = await paymentsCollection.findOne({ orderId });
```

---

### 6. `notifications` - התראות
**מיקום בקוד:**
- `backend/routes/notificationsRoutes.js` (שורות 32, 49, 85, 145, 265)

**סכמה:**
```javascript
{
  _id: ObjectId,                   // MongoDB ID
  userId: String,                 // ID של המשתמש
  type: String,                   // סוג התראה (ראה NOTIFICATION_TYPES)
  title: String,                  // כותרת
  message: String,                // הודעה
  context: Object,                // הקשר נוסף (itemId, buyerId וכו')
  createdAt: Date,                // תאריך יצירה
  readAt: Date?                   // תאריך קריאה (null = לא נקרא)
}
```

**סוגי התראות (NOTIFICATION_TYPES):**
```javascript
{
  NEW_ITEM_ADMIN: 'newItemAdmin',           // פריט חדש למנהלים
  ITEM_SOLD: 'itemSold',                    // פריט נמכר
  ITEM_RELEASED: 'itemReleased',            // פריט שוחרר מהזמנה
  PICKUP_APPROVAL_REQUEST: 'pickupApprovalRequest', // בקשת אישור איסוף
  FEEDBACK: 'feedback',                     // משוב חדש
  BUYER_FLAGGED: 'buyerFlagged'            // קונה מסומן כבעייתי
}
```

**דוגמה מהקוד:**
```javascript
// notificationsRoutes.js - שורה 32
const notificationsCollection = db.collection('notifications');
const notifications = await notificationsCollection.find({ userId }).toArray();
```

---

### 7. `notificationPreferences` - העדפות התראות
**מיקום בקוד:**
- `backend/routes/notificationsRoutes.js` (שורות 110, 127)

**סכמה:**
```javascript
{
  _id: ObjectId,                   // MongoDB ID
  userId: String,                 // ID של המשתמש (unique)
  preferences: Object,            // העדפות התראות
  updatedAt: Date                // תאריך עדכון אחרון
}
```

**דוגמה מהקוד:**
```javascript
// notificationsRoutes.js - שורה 110
const preferencesCollection = db.collection('notificationPreferences');
const prefs = await preferencesCollection.findOne({ userId });
```

---

### 8. `itemApprovals` - אישורי פריטים
**מיקום בקוד:**
- `backend/routes/secondChanceItemsRoutes.js` (שורות 49, 58, 660, 713, 809)

**סכמה:**
```javascript
{
  _id: ObjectId,                   // MongoDB ID
  itemId: String,                 // ID של הפריט
  buyerId: String,                // ID של הקונה
  sellerId: String,               // ID של המוכר
  status: String?,                // סטטוס האישור
  createdAt: Date,                // תאריך יצירה
  updatedAt: Date                 // תאריך עדכון אחרון
}
```

**Index:**
```javascript
// Unique index על: itemId + buyerId + sellerId
{ itemId: 1, buyerId: 1, sellerId: 1 }
```

**דוגמה מהקוד:**
```javascript
// secondChanceItemsRoutes.js - שורה 49
const approvalsCollection = db.collection('itemApprovals');
await approvalsCollection.createIndex(
    { itemId: 1, buyerId: 1, sellerId: 1 },
    { unique: true }
);
```

---

## 🔍 איך למצוא סכמה ספציפית

### שיטה 1: חיפוש ב-grep
```bash
# חיפוש כל השימושים ב-collection מסוים
grep -r "collection('users')" backend/
grep -r "collection(\"users\")" backend/
```

### שיטה 2: חיפוש בקוד
```bash
# חיפוש כל ה-collections
grep -r "db\.collection\|collection\(" backend/routes/
```

### שיטה 3: קריאת הקוד
1. פתח את הקובץ הרלוונטי (למשל `authRoutes.js` למשתמשים)
2. חפש `db.collection("...")`
3. בדוק איך הנתונים נשמרים/נקראים

---

## 📝 הערות חשובות

### 1. אין Schema Validation
כי הפרויקט משתמש ב-MongoDB Native Driver (לא Mongoose), אין validation אוטומטי. ה-validation נעשה ב-application layer.

### 2. Indexes
חלק מה-collections יש להם indexes:
- `itemApprovals`: unique index על `{ itemId, buyerId, sellerId }`
- `users`: unique index על `email` (מוגדר ב-MongoDB)

### 3. Relationships
ה-relationships בין collections הם **manual** (לא foreign keys):
- `secondChanceItems.ownerId` → `users._id`
- `chats.buyerId` → `users._id`
- `chats.sellerId` → `users._id`
- `chatMessages.chatId` → `chats._id`

---

## 🗺️ מפת Collections

```
users
  ├── secondChanceItems (ownerId)
  ├── chats (buyerId, sellerId)
  ├── payments (buyerId, sellerId)
  └── notifications (userId)

secondChanceItems
  ├── chats (itemId)
  ├── payments (itemId)
  └── itemApprovals (itemId)

chats
  └── chatMessages (chatId)
```

---

## 📚 קבצים רלוונטיים

### Models
- `backend/models/db.js` - חיבור למסד הנתונים
- `backend/models/baseModel.js` - כלי עזר (ObjectId normalization)

### Routes (מגדירים את הסכמות דרך השימוש)
- `backend/routes/authRoutes.js` - users
- `backend/routes/secondChanceItemsRoutes.js` - secondChanceItems, itemApprovals
- `backend/routes/chatRoutes.js` - chats, chatMessages
- `backend/routes/paymentRoutes.js` - payments
- `backend/routes/notificationsRoutes.js` - notifications, notificationPreferences
- `backend/routes/adminUsersRoutes.js` - users

### Services
- `backend/services/reservations.js` - secondChanceItems, users

---

**סיכום:** כל הסכמות מוגדרות **מרומז** דרך הקוד ב-`backend/routes/*.js`. אין קבצי schema מפורשים כי הפרויקט משתמש ב-MongoDB Native Driver ולא ב-Mongoose.

