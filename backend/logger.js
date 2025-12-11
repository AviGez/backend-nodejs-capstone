/*
 * עוטף ל־logger: logger.js
 * -----------------------
 * תכלית: לספק מופע `pino` מוכוון לשימוש באפליקציה.
 * - בסביבת פיתוח מפעיל תצוגה קריאה (pretty) וברמת לוג DEBUG.
 * - בסביבת production מפעיל את מופע ברירת המחדל של pino.
 */
const pino = require('pino');

let logger;

if (process.env.NODE_ENV !== 'production') {
    // פיתוח: פלט מסוג "pino-pretty" לקריאה נוחה
    logger = pino({
        level: 'debug',
        transport: {
            target: "pino-pretty",
        },
    });
} else {
    // ייצור: מופע pino יעיל לייצור
    logger = pino();
}

module.exports = logger;
