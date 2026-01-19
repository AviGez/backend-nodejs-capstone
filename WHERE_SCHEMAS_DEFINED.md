# 📍 איפה הסכמות מוגדרות בפועל?

## ⚠️ תשובה קצרה: **הסכמות מוגדרות בקוד, לא בקבצים נפרדים!**

---

## 🔍 איך זה עובד?

### MongoDB היא Schemaless
MongoDB **לא דורשת** schema מפורש. הסכמות מוגדרות **דרך הקוד** בכל פעם שאתה:
- שומר document (`insertOne`, `insertMany`)
- מעדכן document (`updateOne`, `updateMany`)

---

## 📂 איפה הסכמות מוגדרות בפועל?

### 1. **`users` Collection**

**מיקום:** `backend/routes/authRoutes.js`

**שורה 62-69** - כאן מוגדרת הסכמה בפועל:
```javascript
const newUser = await collection.insertOne({
    email: req.body.email,           // ← כאן מוגדר השדה email
    firstName: req.body.firstName,   // ← כאן מוגדר השדה firstName
    lastName: req.body.lastName,    // ← כאן מוגדר השדה lastName
    password: hash,                 // ← כאן מוגדר השדה password
    role,                           // ← כאן מוגדר השדה role
    createdAt: new Date(),          // ← כאן מוגדר השדה createdAt
});
```

**זהו!** הסכמה של `users` מוגדרת כאן. כל פעם שמשתמש נרשם, זה יוצר document עם השדות האלה.

---

### 2. **`secondChanceItems` Collection**

**מיקום:** `backend/routes/secondChanceItemsRoutes.js`

**שורה 514-572** - כאן מוגדרת הסכמה בפועל:
```javascript
router.post('/', authenticate, upload.array('images', MAX_IMAGES_PER_ITEM), async (req, res, next) => {
    // ... קוד ...
    
    // שורה 532-570 - כאן מוגדרת הסכמה!
    secondChanceItem.date_added = date_added;           // ← מוגדר כאן
    secondChanceItem.ownerId = req.user.id;             // ← מוגדר כאן
    secondChanceItem.ownerEmail = req.user.email;       // ← מוגדר כאן
    secondChanceItem.status = 'available';              // ← מוגדר כאן
    secondChanceItem.reservedByUserId = null;           // ← מוגדר כאן
    secondChanceItem.reservedUntil = null;              // ← מוגדר כאן
    secondChanceItem.carouselExitNotified = false;     // ← מוגדר כאן
    secondChanceItem.image = galleryImages[0];        // ← מוגדר כאן
    secondChanceItem.galleryImages = galleryImages;    // ← מוגדר כאן
    secondChanceItem.city = req.body.city || '';       // ← מוגדר כאן
    secondChanceItem.area = req.body.area || '';       // ← מוגדר כאן
    secondChanceItem.price = Number(req.body.price) || 0; // ← מוגדר כאן
    // ... ועוד שדות ...
    
    // שורה 572 - כאן נשמר למסד הנתונים
    const insertResult = await collection.insertOne(secondChanceItem);
});
```

**זהו!** הסכמה של `secondChanceItems` מוגדרת כאן. כל פעם שמוסיפים פריט, זה יוצר document עם השדות האלה.

---

### 3. **`chats` Collection**

**מיקום:** `backend/routes/chatRoutes.js`

**שורה 75-82** - כאן מוגדרת הסכמה בפועל:
```javascript
const insertResult = await chatsCollection.insertOne({
    itemId,                    // ← מוגדר כאן
    buyerId,                   // ← מוגדר כאן
    sellerId,                  // ← מוגדר כאן
    isApproved: false,         // ← מוגדר כאן
    createdAt: new Date(),      // ← מוגדר כאן
    updatedAt: new Date()       // ← מוגדר כאן
});
```

---

### 4. **`chatMessages` Collection**

**מיקום:** `backend/routes/chatRoutes.js`

**שורה 256-262** - כאן מוגדרת הסכמה בפועל:
```javascript
const insertResult = await messagesCollection.insertOne({
    chatId: objectId,           // ← מוגדר כאן
    senderId: req.user.id,      // ← מוגדר כאן
    content: req.body.content,  // ← מוגדר כאן
    createdAt: new Date()      // ← מוגדר כאן
});
```

---

### 5. **`payments` Collection**

**מיקום:** `backend/routes/paymentRoutes.js`

**שורה 45-62** - כאן מוגדרת הסכמה בפועל:
```javascript
const payment = {
    orderId: orderId,           // ← מוגדר כאן
    itemId: itemId,             // ← מוגדר כאן
    buyerId: req.user.id,      // ← מוגדר כאן
    sellerId: item.ownerId,    // ← מוגדר כאן
    amount: item.price,         // ← מוגדר כאן
    status: 'pending',         // ← מוגדר כאן
    createdAt: new Date(),     // ← מוגדר כאן
    updatedAt: new Date()       // ← מוגדר כאן
};

await paymentsCollection.insertOne(payment);
```

---

### 6. **`notifications` Collection**

**מיקום:** `backend/routes/notificationsRoutes.js`

**שורה 148-156** - כאן מוגדרת הסכמה בפועל:
```javascript
const docs = userIds.map((userId) => ({
    userId,                    // ← מוגדר כאן
    type: normalizeType(type),  // ← מוגדר כאן
    title,                     // ← מוגדר כאן
    message,                   // ← מוגדר כאן
    context,                   // ← מוגדר כאן
    createdAt: now,            // ← מוגדר כאן
    readAt: null               // ← מוגדר כאן
}));

await notificationsCollection.insertMany(docs);
```

---

## 🎯 סיכום: איפה הסכמות מוגדרות?

### ✅ **הסכמות מוגדרות בקוד, לא בקבצים נפרדים!**

| Collection | איפה מוגדרת הסכמה | שורה בקוד |
|------------|-------------------|-----------|
| `users` | `authRoutes.js` | שורה 62-69 |
| `secondChanceItems` | `secondChanceItemsRoutes.js` | שורה 514-572 |
| `chats` | `chatRoutes.js` | שורה 75-82 |
| `chatMessages` | `chatRoutes.js` | שורה 256-262 |
| `payments` | `paymentRoutes.js` | שורה 45-62 |
| `notifications` | `notificationsRoutes.js` | שורה 148-156 |
| `notificationPreferences` | `notificationsRoutes.js` | שורה 112-127 |
| `itemApprovals` | `secondChanceItemsRoutes.js` | שורה 660-713 |

---

## 🔍 איך למצוא סכמה ספציפית?

### שיטה 1: חיפוש `insertOne` או `insertMany`
```bash
# חיפוש כל המקומות שמגדירים סכמה חדשה
grep -n "insertOne\|insertMany" backend/routes/*.js
```

### שיטה 2: חיפוש לפי collection
```bash
# חיפוש כל השימושים ב-collection מסוים
grep -n "collection('users')" backend/routes/*.js
```

### שיטה 3: קריאת הקוד
1. פתח את הקובץ הרלוונטי
2. חפש `insertOne` או `insertMany`
3. שם תראה את הסכמה המלאה!

---

## 💡 למה זה עובד כך?

### MongoDB היא Schemaless
- **לא צריך** להגדיר schema מראש
- הסכמה נוצרת **אוטומטית** כשאתה שומר document
- כל document יכול להיות שונה (אבל בדרך כלל זה לא מומלץ)

### יתרונות:
- ✅ גמישות - אפשר להוסיף שדות חדשים בקלות
- ✅ פשוט - לא צריך לטפל ב-migrations

### חסרונות:
- ❌ אין validation אוטומטי
- ❌ קשה לדעת מה הסכמה בלי לקרוא את הקוד
- ❌ יכול להיות בלגן אם לא זהירים

---

## 🛡️ Validation - איפה זה קורה?

כי אין schema validation אוטומטי, ה-validation נעשה ב-**application layer**:

### דוגמה מ-`authRoutes.js`:
```javascript
// שורה 42 - בדיקה אם email כבר קיים
const existingEmail = await collection.findOne({ email: req.body.email });
if (existingEmail) {
    return res.status(400).json({ error: 'Email id already exists' });
}

// שורה 49-52 - בדיקת role תקין
if (req.body.role && !normalizeRole(req.body.role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
}
```

**זהו ה-validation!** הוא לא ב-schema, אלא בקוד.

---

## 📚 קבצים רלוונטיים

### Routes (מגדירים את הסכמות):
- `backend/routes/authRoutes.js` - users
- `backend/routes/secondChanceItemsRoutes.js` - secondChanceItems, itemApprovals
- `backend/routes/chatRoutes.js` - chats, chatMessages
- `backend/routes/paymentRoutes.js` - payments
- `backend/routes/notificationsRoutes.js` - notifications, notificationPreferences

### Models (רק חיבור):
- `backend/models/db.js` - חיבור למסד הנתונים
- `backend/models/baseModel.js` - כלי עזר (ObjectId normalization)

---

## ✅ תשובה סופית

**הסכמות מוגדרות בקוד, לא בקבצים נפרדים!**

- כל `insertOne()` או `insertMany()` מגדיר את הסכמה
- אין קבצי schema נפרדים
- הסכמות נמצאות ב-`backend/routes/*.js`
- ה-validation נעשה ב-application layer

**לכן:** כדי לראות את הסכמה המלאה, צריך לקרוא את הקוד שמשתמש ב-`insertOne()` או `insertMany()`!

