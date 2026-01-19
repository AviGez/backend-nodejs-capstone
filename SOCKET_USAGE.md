# 🔌 Socket.IO Usage - שימוש ב-Socket בקוד

## 📋 Overview

Socket.IO משמש ל-**צ'אט בזמן אמת** בין קונים למוכרים.

---

## 🗂️ מיקום השימוש

### Backend (Server Side)

#### 1. **`backend/socket.js`** - הגדרת Socket.IO
**מיקום:** `backend/socket.js`

**מה זה עושה:**
- מאתחל Socket.IO server
- מטפל באימות JWT
- מטפל באירועי צ'אט

**קוד מרכזי:**
```javascript
// שורה 29-34: אתחול Socket.IO
function initSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: '*',
        },
    });
    
    // שורה 37-53: Middleware לאימות JWT
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = payload?.user?.id;
        next();
    });
    
    // שורה 55: טיפול בחיבורים
    io.on('connection', (socket) => {
        // ...
    });
}
```

**אירועים שמטופלים:**
1. `join_chat` - הצטרפות לחדר צ'אט (שורה 57)
2. `send_message` - שליחת הודעה (שורה 83)

---

#### 2. **`backend/app.js`** - אתחול Socket
**מיקום:** `backend/app.js`

**שורה 15:** ייבוא
```javascript
const { initSocket } = require('./socket');
```

**שורה 20:** אתחול
```javascript
const server = http.createServer(app);
initSocket(server);  // ← כאן מתחיל Socket.IO
```

---

### Frontend (Client Side)

#### 3. **`frontend/src/components/ChatModal/ChatModal.js`** - שימוש ב-Socket
**מיקום:** `frontend/src/components/ChatModal/ChatModal.js`

**מה זה עושה:**
- מתחבר ל-Socket.IO server
- מצטרף לחדר צ'אט
- שולח ומקבל הודעות בזמן אמת

**קוד מרכזי:**
```javascript
// שורה 2: ייבוא
import { io } from 'socket.io-client';

// שורה 11: useRef לאחסון socket
const socketRef = useRef(null);

// שורה 48-79: התחברות ל-Socket
useEffect(() => {
    const token = sessionStorage.getItem('auth-token');
    const socket = io(urlConfig.backendUrl, {
        auth: { token },
    });
    socketRef.current = socket;
    
    // טיפול בשגיאות
    socket.on('connect_error', (err) => {
        setError(err.message || 'Unable to connect to chat');
    });
    
    // הצטרפות לחדר צ'אט
    socket.emit('join_chat', { chatId });
    
    // קבלת הודעות חדשות
    socket.on('new_message', (message) => {
        if (message.chatId === chatId) {
            setMessages((prev) => [...prev, message]);
        }
    });
    
    // ניקוי בעת unmount
    return () => {
        socket.disconnect();
    };
}, [chatId]);

// שורה 87-103: שליחת הודעה
const handleSend = () => {
    const socket = socketRef.current;
    socket.emit('send_message', { chatId, content: inputValue.trim() });
    setInputValue('');
};
```

---

## 🔄 Flow - זרימת העבודה

### 1. התחברות (Connection)

```
Frontend (ChatModal.js)
    ↓
io(urlConfig.backendUrl, { auth: { token } })
    ↓
Backend (socket.js)
    ↓
io.use() - אימות JWT
    ↓
io.on('connection') - חיבור מוצלח
```

---

### 2. הצטרפות לחדר (Join Chat)

```
Frontend:
socket.emit('join_chat', { chatId })
    ↓
Backend:
socket.on('join_chat', async ({ chatId }) => {
    // בדיקות הרשאה
    // הצטרפות לחדר
    socket.join(`chat:${chatId}`)
    socket.emit('chat_joined', { chatId })
})
    ↓
Frontend:
socket.on('chat_joined', ({ chatId }) => {
    // מוכן לקבל הודעות
})
```

---

### 3. שליחת הודעה (Send Message)

```
Frontend:
socket.emit('send_message', { chatId, content })
    ↓
Backend:
socket.on('send_message', async ({ chatId, content }) => {
    // שמירה במסד הנתונים
    await messagesCollection.insertOne({...})
    // שליחה לכל המחוברים לחדר
    io.to(`chat:${chatId}`).emit('new_message', message)
})
    ↓
Frontend:
socket.on('new_message', (message) => {
    // הוספת הודעה לרשימה
    setMessages((prev) => [...prev, message])
})
```

---

## 📍 מיקומים מדויקים בקוד

### Backend

| קובץ | שורה | מה קורה |
|------|------|----------|
| `backend/app.js` | 15 | ייבוא `initSocket` |
| `backend/app.js` | 20 | אתחול Socket.IO |
| `backend/socket.js` | 7 | ייבוא `Server` מ-socket.io |
| `backend/socket.js` | 29-34 | אתחול Socket.IO server |
| `backend/socket.js` | 37-53 | Middleware לאימות JWT |
| `backend/socket.js` | 55 | טיפול בחיבורים |
| `backend/socket.js` | 57 | אירוע: `join_chat` |
| `backend/socket.js` | 83 | אירוע: `send_message` |
| `backend/socket.js` | 125 | שליחת `new_message` |

---

### Frontend

| קובץ | שורה | מה קורה |
|------|------|----------|
| `frontend/src/components/ChatModal/ChatModal.js` | 2 | ייבוא `io` מ-socket.io-client |
| `frontend/src/components/ChatModal/ChatModal.js` | 11 | `useRef` לאחסון socket |
| `frontend/src/components/ChatModal/ChatModal.js` | 48-79 | התחברות ל-Socket |
| `frontend/src/components/ChatModal/ChatModal.js` | 55 | יצירת חיבור: `io(urlConfig.backendUrl)`
| `frontend/src/components/ChatModal/ChatModal.js` | 68 | שליחה: `socket.emit('join_chat')` |
| `frontend/src/components/ChatModal/ChatModal.js` | 70 | קבלה: `socket.on('new_message')` |
| `frontend/src/components/ChatModal/ChatModal.js` | 103 | שליחה: `socket.emit('send_message')` |

---

## 🎯 אירועי Socket.IO

### Client → Server (Frontend → Backend)

| אירוע | מיקום Frontend | מיקום Backend | תיאור |
|-------|----------------|---------------|-------|
| `join_chat` | ChatModal.js:68 | socket.js:57 | הצטרפות לחדר צ'אט |
| `send_message` | ChatModal.js:103 | socket.js:83 | שליחת הודעה |

---

### Server → Client (Backend → Frontend)

| אירוע | מיקום Backend | מיקום Frontend | תיאור |
|-------|---------------|----------------|-------|
| `chat_joined` | socket.js:76 | - | אישור הצטרפות |
| `new_message` | socket.js:125 | ChatModal.js:70 | הודעה חדשה |
| `error` | socket.js:59,66,69,72,78,85,95,98,101,127 | ChatModal.js:60,64 | שגיאה |

---

## 🔐 אימות (Authentication)

### איך זה עובד:

**Backend (socket.js:37-53):**
```javascript
io.use((socket, next) => {
    // קבלת token מה-handshake
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    // אימות JWT
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const userId = payload?.user?.id;
    
    // שמירת userId ב-socket
    socket.userId = userId;
    next();
});
```

**Frontend (ChatModal.js:55):**
```javascript
const socket = io(urlConfig.backendUrl, {
    auth: { token: sessionStorage.getItem('auth-token') }
});
```

---

## 🏠 Rooms - חדרים

### איך זה עובד:

**Backend (socket.js:75):**
```javascript
socket.join(`${CHAT_ROOM_PREFIX}${chatId}`);
// CHAT_ROOM_PREFIX = 'chat:'
// תוצאה: 'chat:1234567890abcdef'
```

**שליחה לכל המחוברים לחדר (socket.js:125):**
```javascript
io.to(`chat:${chatId}`).emit('new_message', message);
```

**למה זה חשוב:**
- רק משתמשים ששותפים לצ'אט מקבלים הודעות
- הודעות לא נשלחות למשתמשים אחרים

---

## 📦 Dependencies

### Backend
**`backend/package.json` שורה 28:**
```json
"socket.io": "^4.8.1"
```

### Frontend
**`frontend/package.json` שורה 17:**
```json
"socket.io-client": "^4.7.2"
```

---

## 🔍 איך למצוא שימוש ב-Socket

### חיפוש ב-Backend:
```bash
grep -r "socket\|Socket\|io\(" backend/
```

### חיפוש ב-Frontend:
```bash
grep -r "socket\|Socket\|io\(" frontend/src/
```

---

## ✅ סיכום

**Socket.IO משמש רק לצ'אט בזמן אמת!**

### Backend:
- `backend/socket.js` - הגדרה וטיפול באירועים
- `backend/app.js` - אתחול Socket.IO

### Frontend:
- `frontend/src/components/ChatModal/ChatModal.js` - שימוש ב-Socket

### אירועים:
- `join_chat` - הצטרפות לחדר
- `send_message` - שליחת הודעה
- `new_message` - קבלת הודעה חדשה
- `chat_joined` - אישור הצטרפות
- `error` - שגיאות

**זהו! אין שימוש ב-Socket במקומות אחרים בפרויקט.**

