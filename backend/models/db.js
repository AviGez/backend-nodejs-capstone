/*
 * חיבור ל‑MongoDB: db.js
 * ---------------------
 * תכלית: לספק פונקציית `connectToDatabase()` שמשתמשת ב‑MongoClient
 * ומחזיקה מופע מחובר (cache) כך שהחיבור ישותמש לאורך חיי האפליקציה.
 */
require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

// כתובת החיבור ל‑MongoDB שמוגדרת ב‑ENV
let url = `${process.env.MONGO_URL}`;

let dbInstance = null;
const dbName = "secondChance";

async function connectToDatabase() {
    if (dbInstance){
        return dbInstance
    };

    const client = new MongoClient(url);

    await client.connect();
    dbInstance = client.db(dbName);
    return dbInstance;
}

module.exports = connectToDatabase;