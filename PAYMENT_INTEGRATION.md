# PayPal Integration Guide - Second-Hand Store

## תיאור
מערכת תשלום מדומה (Sandbox) באמצעות PayPal המאפשרת לקנות פריטים ללא כסף אמיתי.

## שינויים שבוצעו

### Backend
1. **קובץ חדש**: `backend/routes/paymentRoutes.js`
   - API endpoints לניהול תשלומים
   - יצירת הזמנות תשלום
   - אישור וביטול תשלומים
   - היסטוריית רכישות ומכירות

2. **עדכון**: `backend/app.js`
   - הוספת route חדש: `/api/payments`

### Frontend
1. **קובץ חדש**: `frontend/src/components/PaymentModal/PaymentModal.js`
   - רכיב מודאל לביצוע תשלום
   - אינטגרציה עם PayPal SDK
   - תצוגת פרטי הפריט והמחיר

2. **קובץ חדש**: `frontend/src/components/PaymentModal/PaymentModal.css`
   - עיצוב למודאל התשלום

3. **עדכון**: `frontend/package.json`
   - הוספת החבילה: `@paypal/react-paypal-js`

4. **עדכון**: `frontend/src/components/DetailsPage/DetailsPage.js`
   - הוספת כפתור "Buy Now with PayPal"
   - אינטגרציה עם מודאל התשלום
   - טיפול בהצלחה/ביטול של תשלום

## התקנה

### 1. התקנת תלויות
```bash
# Backend (אין תלויות חדשות)
cd backend
# התלויות כבר קיימות

# Frontend
cd frontend
npm install
```

### 2. הגדרות PayPal Sandbox (אופציונלי)

כרגע המערכת עובדת במצב סימולציה מלא ללא צורך ב-PayPal אמיתי. אם תרצה לחבר PayPal Sandbox אמיתי:

1. הירשם ל-[PayPal Developer](https://developer.paypal.com/)
2. צור אפליקציה חדשה והשג `Client ID`
3. עדכן את הקובץ `PaymentModal.js`:
```javascript
options={{
    'client-id': 'YOUR_SANDBOX_CLIENT_ID', // במקום 'test'
    currency: 'USD',
    intent: 'capture',
}}
```

## שימוש

### 1. הפעלת השרתים
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

### 2. תהליך קנייה
1. גלוש לפריט עם מחיר (price > 0)
2. בחר שיטת משלוח (Pickup או Shipping)
3. אם בחרת Shipping, מלא כתובת ועיר
4. לחץ על "Buy Now with PayPal"
5. במודאל התשלום - זה ייפתח ממשק PayPal מדומה
6. לחץ על כפתור PayPal לאישור
7. התשלום יושלם והפריט יסומן כנמכר

### 3. מעקב אחר תשלומים

**רכישות שלי (Buyer)**:
```
GET /api/payments/my-purchases
Authorization: Bearer <token>
```

**מכירות שלי (Seller)**:
```
GET /api/payments/my-sales
Authorization: Bearer <token>
```

## מבנה נתונים

### Payment Document (MongoDB)
```javascript
{
    orderId: "ORDER-1234567890-abc123",
    itemId: "item-id",
    buyerId: "buyer-user-id",
    sellerId: "seller-user-id",
    amount: 25.99,
    deliveryMethod: "shipping", // או "pickup"
    shippingAddress: "123 Main St, Tel Aviv, Center",
    status: "completed", // pending, completed, cancelled
    createdAt: ISODate("2025-12-28T10:00:00Z"),
    completedAt: ISODate("2025-12-28T10:05:00Z"),
    updatedAt: ISODate("2025-12-28T10:05:00Z")
}
```

## API Endpoints

### POST /api/payments/create-order
יוצר הזמנת תשלום חדשה
```json
{
    "itemId": "item-123",
    "amount": 25.99,
    "deliveryMethod": "shipping",
    "shippingAddress": "123 Main St, Tel Aviv"
}
```

### POST /api/payments/capture-order
מאשר ומשלים תשלום
```json
{
    "orderId": "ORDER-1234567890-abc123"
}
```

### POST /api/payments/cancel-order
מבטל הזמנת תשלום
```json
{
    "orderId": "ORDER-1234567890-abc123"
}
```

### GET /api/payments/my-purchases
מחזיר את כל הרכישות של המשתמש המחובר

### GET /api/payments/my-sales
מחזיר את כל המכירות של המשתמש המחובר

## תכונות אבטחה

1. **אימות משתמש**: כל ה-endpoints דורשים JWT token
2. **בדיקות תקינות**: 
   - בדיקה שהפריט קיים ולא נמכר
   - בדיקה שהמחיר תואם
   - בדיקה שהקונה לא הבעלים של הפריט
3. **עדכון אוטומטי**: הפריט מסומן כנמכר אוטומטית לאחר תשלום מוצלח

## מצב Test/Sandbox

המערכת כרגע פועלת במצב סימולציה מלא:
- **אין כסף אמיתי**: כל התשלומים מדומים
- **אין צורך בחשבון PayPal**: המערכת עובדת ללא חיבור אמיתי ל-PayPal
- **מתאים לפיתוח ובדיקות**: מושלם להדגמות ולפיתוח

## העברה ל-Production

כאשר תהיה מוכן לעבור לסביבת ייצור:

1. הירשם לחשבון PayPal Business
2. השג `Client ID` ו-`Secret` של Production
3. עדכן את ה-SDK options ב-`PaymentModal.js`:
```javascript
options={{
    'client-id': 'YOUR_PRODUCTION_CLIENT_ID',
    currency: 'USD',
    intent: 'capture',
}}
```
4. שקול להוסיף webhook handlers לקבלת התראות על תשלומים

## תיעוד נוסף

- [PayPal JavaScript SDK](https://developer.paypal.com/sdk/js/)
- [React PayPal JS](https://paypal.github.io/react-paypal-js/)
- [PayPal Sandbox Testing](https://developer.paypal.com/tools/sandbox/)

## בעיות נפוצות

**PayPal SDK לא נטען**:
- וודא שיש חיבור לאינטרנט
- בדוק את ה-browser console לשגיאות

**תשלום נכשל**:
- בדוק שהפריט עדיין available
- וודא שאתה לא מנסה לקנות את הפריט שלך

**המודאל לא נפתח**:
- ודא שהכנסת עיר במקרה של shipping
- בדוק שיש מחיר לפריט (price > 0)
