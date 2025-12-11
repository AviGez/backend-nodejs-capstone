/*
 * עזרי מודל בסיסיים: baseModel.js
 * -------------------------------
 * תכלית: כלים קטנים המשמשים לגישה לנתונים, לדוגמה המרה ובדיקת ObjectId.
 */
const { ObjectId } = require('mongodb');

const normalizeObjectId = (maybeId) => {
  try {
    return new ObjectId(maybeId);
  } catch (e) {
    return null;
  }
};

module.exports = {
  normalizeObjectId,
};

