# Second‑Hand Store - פרויקט SecondChance

תמצית
-------
זהו פרויקט של חנות יד שנייה (SecondChance) הכולל שירות backend (Node/Express + MongoDB) ו‑frontend (React). הקוד כולל ניהול פריטים, העלאת תמונות, מערכת שיחות (chat) עם Socket.IO, וניהול הודעות/התרעות.

תוכן README זה
-----------------
- הסבר קצר על מבנה הפרויקט
- דרישות והרצת פרויקט מקומית
- הפעלת Docker / docker compose
- משתני סביבה חשובים
- הערות לגבי CI ו‑deployment

מבנה תיקיות עיקרי
------------------
- `backend/` — קוד השרת (Express), נקודות קצה ב‑`routes/`, חיבור ל‑MongoDB ב‑`models/db.js`, שירותים ב‑`services/` ו‑`public/images` עבור תמונות.
- `frontend/` — אפליקציית React (build ותצורה להטמעה ב‑Docker).
- `docker-compose.yml` — הרכבת Mongo + backend + frontend בציוד מקומי.

דרישות מקומיות
----------------
- Node.js 18+ (להרצת ה‑backend בפיתוח)
- npm (או yarn) לניהול חבילות
- Docker + Docker Compose (להרצה באמצעות containers)
- MongoDB אם תרצה להריץ מחוץ ל‑Docker

הגדרות סביבת פיתוח (backend)
--------------------------------
1. העתק קובץ `.env` בתיקיית `backend` (אם צריך) וקבע משתנים:
   - `MONGO_URL` - כתובת החיבור ל‑MongoDB (לדוגמה: `mongodb://root:example@localhost:27017/secondChance?authSource=admin`).
   - `JWT_SECRET` - סוד JWT לשימוש באימות.
   - `PORT` - פורט שבו השרת מאזין (ברירת מחדל 3060).

הרצה מקומית של ה‑backend
---------------------------
```bash
cd backend
npm ci
# הרצה ישירה (סביבת פיתוח)
node app.js
