# Second‑Hand Store — תיעוד מפורט

תמצית
------
זהו מאגר עבור פרויקט חנות יד שנייה (SecondChance) הכולל:
- Backend: Node.js + Express, חיבור ל‑MongoDB, אימות JWT, תמיכה ב‑Socket.IO לשיחות בזמן אמת.
- Frontend: React (create-react-app) עם רכיבים לקטלוג, דף פריט, עמוד משתמש, תשלומים ו‑chat.

מה ב־README זה
-----------------
- מבוא ותכונות מרכזיות
- מבנה הפרויקט וקבצים חשובים
- דרישות והתקנה מקומית (Backend + Frontend)
- הרצה באמצעות Docker / docker-compose
- משתני סביבה נדרשים ומקורותיהם
- סקריפטים ושירותים מיוחדים
- שיקולים לפריסה, בדיקות ותרומות

תכונות מרכזיות
----------------
- ניהול פריטים והשמדה/חיפוש
- העלאת תמונות לשירות ה‑backend (תמונות מאוחסנות בתיקיית `backend/public/images`)
- מערכת שיחות בזמן אמת עם Socket.IO
- נקודות קצה עבור הרשמה/התחברות עם JWT
- אינטגרציית תשלומים (PayPal) — קבצי השרת ב־`backend/routes/paymentRoutes.js`

מבנה הפרויקט (עיקרי)
---------------------
- `backend/` — קוד השרת (Express)
   - `app.js` — כניסה לשרת
   - `routes/` — נקודות קצה (auth, chat, notifications, search, payment ועוד)
   - `models/` — לוגיקת DB וחיבור (`db.js`, `baseModel.js`)
   - `services/` — שירותי דומיין (למשל `reservations.js`)
   - `public/images/` — תמונות סטטיות
- `frontend/` — אפליקציית React (src/components מכיל את רכיבי ה־UI)
   - `src/config.js` — קונפיגורציה בצד לקוח (קוראת `REACT_APP_API_URL` ועוד)
- `docker-compose.yml` — הרכבת שירותי `mongo`, `backend`, `frontend` להטמעה מקומית
- `sentiment/` — קבצי עזר (logger וכו')

דרישות מראש
-------------
- Node.js 18+
- npm או yarn
- Docker + Docker Compose (להרצה באמצעות containers)
- חשבון PayPal ו‑Client ID / Secret במידה ואתם מפעילים מודול התשלומים

משתני סביבה עיקריים שמצאנו בקוד
----------------------------------
- `MONGO_URL` — מחרוזת החיבור ל‑MongoDB (מחדל בדוקר: `mongodb://root:example@mongo:27017/secondChance?authSource=admin`).
- `JWT_SECRET` — סוד ה‑JWT לשימוש במידלוור האימות.
- `MONGO_COLLECTION` — (נמצא בשימוש ב־`searchRoutes.js`) שם האוסף אם מוגדר דינמית.
- `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET` — פרטי PayPal המשמשים ב־`paymentRoutes.js`.
- `NODE_ENV` — סביבת ריצה.
- בצד לקוח: `REACT_APP_API_URL` (או `REACT_APP_BACKEND_URL`) — URL ל־API.
- `FRONTEND_BASE_URL`, `SOCKET_ORIGIN` — מוגדרים ב־`docker-compose.yml` כמשתני סביבה עבור ה־backend.

הרצה ופיתוח מקומי
--------------------
1) Backend (פיתוח)
```bash
cd backend
npm ci
# הפעלת שרת בפיתוח עם nodemon
npm run dev
```
השרת מאזין בברירת המחדל על פורט `3060` (ניתן לשנות עם `PORT`).

2) Frontend (פיתוח)
```bash
cd frontend
npm ci
npm start
```
ברירת מחדל: הלקוח מפעיל `react-scripts start` על פורט 3000 (ב‑docker-compose נעשה ניתוב ל‑80).

3) DB
- אפשר להריץ MongoDB מקומית או להשתמש ב‑Docker Compose (להלן).

הרצה באמצעות Docker Compose
-----------------------------
הקובץ `docker-compose.yml` מגדיר שלושה שירותים: `mongo`, `backend`, `frontend`.
להרצה:
```bash
docker compose up --build
```
הערות:
- `mongo` פתוח על פורט `27017`.
- `backend` מפורסם ל‑3060, ו‑frontend ל‑3000 (ב‑compose ה־frontend מוגדר להאזין על 80 בתוך הקונטיינר).

Dockerfiles
-----------
- `backend/Dockerfile` — מבוסס על `node:18-alpine`, מתקין תלויות ומריץ `node app.js`.
- `frontend/Dockerfile` — בונה את ה־React build ומשתמש ב־`nginx` לשרת את ה‑static.

סקריפטים ושירותים חשובים
---------------------------
- `backend/package.json` — סקריפטים זמינים: `start`, `dev`, `test`, `fetch:demo-images`.
- `frontend/package.json` — סקריפטים של CRA: `start`, `build`, `test`, `eject`.
- יש סקריפטים בתיקיית `backend/scripts/` כגון `add_balance_to_users.js` ו־`remove_shipping_fields.js` המשמשים לעיבוד נתונים או מיגרציה.

אבטחה ופרטי תשלום
-------------------
- מודול התשלומים משתמש ב‑PayPal; יש לשמור את `PAYPAL_CLIENT_ID` ו־`PAYPAL_SECRET` בסביבה ובמיקום מאובטח.
- אין לכלול קבצי `.env` עם סודות ב־Git.

חלקים טכניים נוספים
-------------------
- Socket.IO: קבצי `backend/socket.js` ו־`frontend` משתמשים ב‑Socket.IO לתקשורת בזמן אמת; יש להגדיר `SOCKET_ORIGIN`/CORS כנדרש.
- לוגים: משתמשים ב־`pino`/`pino-pretty` ל־backend.

בדיקות
------
- ב־backend מותקנים כלים כמו `mocha`, `chai`, `sinon`, `supertest` — ניתן להפעיל `npm test` בתיקיית `backend`.

הנחיות פריסה
-------------
- ניתן לפרוס באמצעות Docker Compose או לבנות ולהטמיע כל שירות בנפרד.
- ודאו שמשתני הסביבה רלוונטיים (DB, JWT, PayPal) מוגדרים בסביבת הייצור.

תרומה וניהול קוד
-----------------
- fork → branch → pull request.
- רצוי לפתוח issue המתאר שינוי גדול לפני כתיבת קוד.

בעיות נפוצות ופתרון
--------------------
- שגיאות חיבור ל‑Mongo: בדקו `MONGO_URL` והאם ה‑mongo רץ/נגיש.
- שגיאות Auth/JWT: ודאו ש‑`JWT_SECRET` זהה בין השירותים המשתמשים ב‑JWT.

קישורים מהירים (קבצים חשובים)
-------------------------------
- `backend/app.js` — כניסת השרת
- `backend/models/db.js` — חיבור ל‑Mongo
- `frontend/src/config.js` — קונפיגורציית לקוח
- `docker-compose.yml` — הרכבה מקומית

רישיון
-------
ראה קובץ `LICENSE` במאגר.

---

