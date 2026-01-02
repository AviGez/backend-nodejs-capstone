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
//מיצאים אוביקט שמכיל מפתח normalizeObjectId שמצביע על הפונקציה normalizeObjectId
//אם לא מייצאים עוד פונקציה - הסוגריים מיותרות, אפשר פשוט לכתוב module.exports = normalizeObjectId;
//(כמובן שנצטרך לשנות את היבוא בקבצים אחרים אם מיצאים פונקציה ולא אובייקט)
module.exports = {
  normalizeObjectId,
};

