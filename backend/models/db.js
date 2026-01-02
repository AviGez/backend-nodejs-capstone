/*
 * חיבור ל‑MongoDB: db.js
 * ---------------------
 * תכלית: לספק פונקציית `connectToDatabase()` שמשתמשת ב‑MongoClient
 * ומחזיקה מופע מחובר (cache) כך שהחיבור ישותמש לאורך חיי האפליקציה.
 */
// טעינת משתני סביבה
require('dotenv').config();
// ייבוא MongoClient מ‑mongodb
const MongoClient = require('mongodb').MongoClient;

// כתובת החיבור ל‑MongoDB שמוגדרת ב‑ENV
//הבקטיק וסימן הדולר מיותרים כאן מאחר ומדובר במחרוזת פשוטה
let url = `${process.env.MONGO_URL}`;
//יצירת משתנה לאחסון מופע הבסיס נתונים
let dbInstance = null;
const dbName = "secondChance";

async function connectToDatabase() {
    // אם כבר קיים מופע מחובר, מחזירים אותו
    if (dbInstance){
        return dbInstance
    };
    // יצירת מופע חדש של MongoClient וחיבורו
    const client = new MongoClient(url);
    // חיבור לשרת MongoDB
    await client.connect();
    // קבלת מופע של בסיס הנתונים הרצוי
    dbInstance = client.db(dbName);
    return dbInstance;
}

module.exports = connectToDatabase;