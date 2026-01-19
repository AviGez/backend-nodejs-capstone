# 📚 מדריך מקיף ל-Frontend - הכנה למבחן

## תוכן עניינים
1. [מבנה הפרויקט](#מבנה-הפרויקט)
2. [React Basics](#react-basics)
3. [Components - כל הקומפוננטות](#components)
4. [Routing - ניווט](#routing)
5. [State Management - ניהול מצב](#state-management)
6. [API Calls - קריאות לשרת](#api-calls)
7. [Hooks - useState, useEffect](#hooks)
8. [Lifecycle - מחזור החיים](#lifecycle)
9. [שאלות נפוצות למבחן](#שאלות-נפוצות)

---

## 📁 מבנה הפרויקט

```
frontend/
├── public/              # קבצים סטטיים
│   ├── index.html      # HTML ראשי
│   └── home.html
│
├── src/
│   ├── index.js         # נקודת כניסה - מפעיל את React
│   ├── App.js           # קומפוננטה ראשית - מגדיר routes
│   ├── App.css          # עיצוב גלובלי
│   ├── config.js        # הגדרות (URL של backend)
│   │
│   ├── context/
│   │   └── AppContext.js    # ניהול מצב גלובלי (Context API)
│   │
│   └── components/      # כל הקומפוננטות
│       ├── MainPage/         # דף ראשי - רשימת פריטים
│       ├── LoginPage/        # דף התחברות
│       ├── RegisterPage/     # דף הרשמה
│       ├── DetailsPage/      # דף פרטי פריט
│       ├── ItemPage/         # דף הוספת פריט חדש
│       ├── Profile/          # דף פרופיל משתמש
│       ├── Navbar/           # תפריט ניווט עליון
│       ├── Footer/           # תחתית האתר
│       ├── ChatModal/        # חלון צ'אט
│       ├── PaymentModal/     # חלון תשלום
│       ├── AdminPanel/       # פאנל מנהל
│       ├── SearchPage/        # דף חיפוש
│       ├── PurchaseHistory/  # היסטוריית רכישות
│       └── NewArrivalsCarousel/  # קרוסלה של פריטים חדשים
│
└── package.json         # תלויות הפרויקט
```

---

## ⚛️ React Basics

### מה זה React?
React היא ספריית JavaScript לבניית ממשקי משתמש (UI).

### קומפוננטה בסיסית

```javascript
import React from 'react';

function MyComponent() {
    return (
        <div>
            <h1>Hello World</h1>
        </div>
    );
}

export default MyComponent;
```

### JSX - JavaScript XML
JSX מאפשר לכתוב HTML בתוך JavaScript:

```javascript
// ✅ JSX - נכון
const element = <h1>Hello</h1>;

// ❌ לא JSX - שגוי
const element = "<h1>Hello</h1>";
```

### Props - העברת נתונים

```javascript
// Parent Component
function App() {
    return <ChildComponent name="John" age={25} />;
}

// Child Component
function ChildComponent(props) {
    return (
        <div>
            <p>Name: {props.name}</p>
            <p>Age: {props.age}</p>
        </div>
    );
}
```

### State - מצב מקומי

```javascript
import { useState } from 'react';

function Counter() {
    const [count, setCount] = useState(0);
    
    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>
                Increment
            </button>
        </div>
    );
}
```

---

## 🧩 Components

### 1. **index.js** - נקודת הכניסה

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <Router>
            <App />
        </Router>
    </React.StrictMode>
);
```

**מה זה עושה?**
- יוצר root element
- עוטף את האפליקציה ב-`Router` (לניווט)
- מפעיל את `App` component

---

### 2. **App.js** - הקומפוננטה הראשית

```javascript
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import MainPage from './components/MainPage/MainPage';
import LoginPage from './components/LoginPage/LoginPage';

function App() {
    return (
        <AppProvider>
            <Navbar />
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/app/login" element={<LoginPage />} />
                <Route path="/app/item/:itemId" element={<DetailsPage />} />
            </Routes>
            <Footer />
        </AppProvider>
    );
}
```

**מה זה עושה?**
- מגדיר את כל ה-routes (נתיבים)
- עוטף הכל ב-`AppProvider` (לניהול מצב גלובלי)
- כולל `Navbar` ו-`Footer` בכל הדפים

**Routes:**
- `/` → MainPage (דף ראשי)
- `/app/login` → LoginPage
- `/app/register` → RegisterPage
- `/app/item/:itemId` → DetailsPage (פרטי פריט)
- `/app/addItem` → ItemPage (הוספת פריט)
- `/app/profile` → Profile (פרופיל)
- `/app/admin` → AdminPanel (מנהל)

---

### 3. **AppContext.js** - ניהול מצב גלובלי

```javascript
import { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // קריאת נתונים מ-sessionStorage
    const getInitialSession = () => {
        const token = sessionStorage.getItem('auth-token');
        const name = sessionStorage.getItem('name') || '';
        const role = sessionStorage.getItem('role') || 'user';
        const userId = sessionStorage.getItem('user-id') || '';
        return { token, name, role, userId };
    };

    const { token, name, role, userId } = getInitialSession();
    
    const [isLoggedIn, setIsLoggedIn] = useState(!!token);
    const [userName, setUserName] = useState(name);
    const [userRole, setUserRole] = useState(role);
    const [currentUserId, setCurrentUserId] = useState(userId);

    return (
        <AppContext.Provider value={{
            isLoggedIn,
            setIsLoggedIn,
            userName,
            setUserName,
            userRole,
            setUserRole,
            currentUserId,
            setCurrentUserId,
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
```

**מה זה עושה?**
- יוצר Context גלובלי לכל האפליקציה
- שומר מצב של: התחברות, שם משתמש, תפקיד, ID
- מאפשר לכל קומפוננטה לגשת לנתונים אלה

**שימוש:**
```javascript
import { useAppContext } from '../../context/AppContext';

function MyComponent() {
    const { isLoggedIn, userName } = useAppContext();
    
    return (
        <div>
            {isLoggedIn ? <p>Hello {userName}</p> : <p>Please login</p>}
        </div>
    );
}
```

---

### 4. **MainPage.js** - דף ראשי

**תפקיד:** מציג רשימת פריטים, חיפוש, קרוסלה

**State:**
```javascript
const [items, setItems] = useState([]);              // רשימת פריטים
const [searchQuery, setSearchQuery] = useState('');  // חיפוש
const [selectedCategory, setSelectedCategory] = useState(''); // קטגוריה
const [errorMessage, setErrorMessage] = useState(''); // שגיאות
```

**פונקציות מרכזיות:**

1. **fetchItems()** - טעינת פריטים:
```javascript
const fetchItems = async () => {
    const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items`);
    const data = await response.json();
    setItems(data);
};
```

2. **handleSearch()** - חיפוש מתקדם:
```javascript
const handleSearch = async () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('name', searchQuery);
    if (selectedCategory) params.append('category', selectedCategory);
    
    const response = await fetch(
        `${urlConfig.backendUrl}/api/secondchance/search?${params}`
    );
    const data = await response.json();
    setItems(data);
};
```

3. **handleReserve()** - הזמנת פריט:
```javascript
const handleReserve = async (itemId) => {
    const token = sessionStorage.getItem('auth-token');
    const response = await fetch(
        `${urlConfig.backendUrl}/api/secondchance/items/${itemId}/reserve`,
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    const updatedItem = await response.json();
    // עדכון הרשימה
    setItems(prevItems => 
        prevItems.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
};
```

**useEffect:**
```javascript
useEffect(() => {
    fetchItems(); // טוען פריטים בעת טעינת הקומפוננטה
}, []);
```

---

### 5. **LoginPage.js** - דף התחברות

**תפקיד:** התחברות משתמש

**State:**
```javascript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [incorrect, setIncorrect] = useState('');
```

**handleLogin:**
```javascript
const handleLogin = async (e) => {
    e.preventDefault();
    
    const res = await fetch(`${urlConfig.backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    
    const json = await res.json();
    
    if (json.authtoken) {
        // שמירה ב-sessionStorage
        sessionStorage.setItem('auth-token', json.authtoken);
        sessionStorage.setItem('name', json.userName);
        sessionStorage.setItem('role', json.userRole);
        sessionStorage.setItem('user-id', json.userId);
        
        // עדכון Context
        setIsLoggedIn(true);
        setUserName(json.userName);
        setUserRole(json.userRole);
        
        // מעבר לדף ראשי
        navigate('/app');
    } else {
        setIncorrect('Wrong password');
    }
};
```

**useEffect - בדיקה אם כבר מחובר:**
```javascript
useEffect(() => {
    if (sessionStorage.getItem('auth-token')) {
        navigate('/app'); // מעבר אוטומטי אם כבר מחובר
    }
}, [navigate]);
```

---

### 6. **DetailsPage.js** - דף פרטי פריט

**תפקיד:** מציג פרטים מלאים של פריט, אפשרות לקנות/לצ'אט

**State:**
```javascript
const [gift, setGift] = useState(null);           // נתוני הפריט
const [loading, setLoading] = useState(true);     // מצב טעינה
const [error, setError] = useState(null);         // שגיאות
const [chatModal, setChatModal] = useState({ open: false, chatId: null });
const [showPaymentModal, setShowPaymentModal] = useState(false);
```

**useParams - קבלת itemId מה-URL:**
```javascript
import { useParams } from 'react-router-dom';

function DetailsPage() {
    const { itemId } = useParams(); // מקבל את itemId מה-URL
    // לדוגמה: /app/item/123 → itemId = "123"
}
```

**טעינת פריט:**
```javascript
useEffect(() => {
    const fetchItem = async () => {
        const response = await fetch(
            `${urlConfig.backendUrl}/api/secondchance/items/${itemId}`
        );
        const data = await response.json();
        setGift(data);
        setLoading(false);
    };
    
    fetchItem();
}, [itemId]);
```

**פתיחת צ'אט:**
```javascript
const handleOpenChat = async () => {
    const token = sessionStorage.getItem('auth-token');
    const response = await fetch(
        `${urlConfig.backendUrl}/api/chats/${itemId}`,
        {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    const chat = await response.json();
    setChatModal({ open: true, chatId: chat.id });
};
```

---

### 7. **Navbar.js** - תפריט ניווט

**תפקיד:** תפריט עליון עם קישורים ולוגיקה

**State:**
```javascript
const [unreadCount, setUnreadCount] = useState(0); // מספר התראות לא נקראו
```

**טעינת התראות:**
```javascript
useEffect(() => {
    const fetchUnread = async () => {
        const token = sessionStorage.getItem('auth-token');
        const response = await fetch(
            `${urlConfig.backendUrl}/api/notifications`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const notifications = await response.json();
        const unread = notifications.filter(n => !n.readAt).length;
        setUnreadCount(unread);
    };
    
    if (isLoggedIn) {
        fetchUnread();
        // רענון כל 30 שניות
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }
}, [isLoggedIn]);
```

**התנתקות:**
```javascript
const handleLogout = () => {
    sessionStorage.clear();
    setIsLoggedIn(false);
    setUserName('');
    navigate('/app/login');
};
```

---

### 8. **ChatModal.js** - חלון צ'אט

**תפקיד:** צ'אט בזמן אמת עם Socket.IO

**State:**
```javascript
const [messages, setMessages] = useState([]);
const [newMessage, setNewMessage] = useState('');
const [socket, setSocket] = useState(null);
```

**חיבור ל-Socket.IO:**
```javascript
useEffect(() => {
    const token = sessionStorage.getItem('auth-token');
    const newSocket = io(urlConfig.backendUrl, {
        auth: { token }
    });
    
    newSocket.on('connect', () => {
        newSocket.emit('join_chat', { chatId });
    });
    
    newSocket.on('new_message', (message) => {
        setMessages(prev => [...prev, message]);
    });
    
    setSocket(newSocket);
    
    return () => newSocket.close();
}, [chatId]);
```

**שליחת הודעה:**
```javascript
const sendMessage = () => {
    if (socket && newMessage.trim()) {
        socket.emit('send_message', {
            chatId,
            content: newMessage
        });
        setNewMessage('');
    }
};
```

---

### 9. **PaymentModal.js** - חלון תשלום

**תפקיד:** תשלום באמצעות PayPal

**יצירת הזמנה:**
```javascript
const createOrder = async () => {
    const token = sessionStorage.getItem('auth-token');
    const response = await fetch(
        `${urlConfig.backendUrl}/api/payments/create-order`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                itemId: item.id,
                amount: item.price
            })
        }
    );
    const { orderId } = await response.json();
    // שימוש ב-PayPal SDK
};
```

---

## 🧭 Routing

### React Router DOM

**מה זה?**
ספרייה לניהול ניווט בין דפים ב-React (Single Page Application).

**שימוש:**

```javascript
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';

// הגדרת routes
<Routes>
    <Route path="/" element={<MainPage />} />
    <Route path="/app/login" element={<LoginPage />} />
    <Route path="/app/item/:itemId" element={<DetailsPage />} />
</Routes>

// ניווט בתוך קומפוננטה
const navigate = useNavigate();
navigate('/app/login');

// קבלת פרמטרים מה-URL
const { itemId } = useParams(); // /app/item/123 → itemId = "123"
```

**Routes בפרויקט:**
- `/` → MainPage
- `/app` → MainPage
- `/app/login` → LoginPage
- `/app/register` → RegisterPage
- `/app/item/:itemId` → DetailsPage
- `/app/addItem` → ItemPage
- `/app/profile` → Profile
- `/app/admin` → AdminPanel
- `/app/purchase-history` → PurchaseHistory

---

## 📊 State Management

### Context API

**מה זה?**
דרך לניהול מצב גלובלי ב-React ללא props drilling.

**יצירה:**
```javascript
const AppContext = createContext();
```

**Provider:**
```javascript
<AppContext.Provider value={{ isLoggedIn, userName }}>
    {children}
</AppContext.Provider>
```

**שימוש:**
```javascript
const { isLoggedIn, userName } = useAppContext();
```

### sessionStorage

**מה זה?**
אחסון מקומי בדפדפן (נמחק כשסוגרים את הטאב).

**שימוש:**
```javascript
// שמירה
sessionStorage.setItem('auth-token', token);
sessionStorage.setItem('name', userName);

// קריאה
const token = sessionStorage.getItem('auth-token');
const name = sessionStorage.getItem('name');

// מחיקה
sessionStorage.removeItem('auth-token');
sessionStorage.clear(); // מוחק הכל
```

---

## 🌐 API Calls

### Fetch API

**דוגמה בסיסית:**
```javascript
const response = await fetch(`${urlConfig.backendUrl}/api/items`);
const data = await response.json();
```

**עם headers:**
```javascript
const token = sessionStorage.getItem('auth-token');
const response = await fetch(`${urlConfig.backendUrl}/api/items`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name: 'Item', price: 50 })
});
```

**טיפול בשגיאות:**
```javascript
try {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Network error');
    }
    const data = await response.json();
} catch (error) {
    setError(error.message);
}
```

---

## 🎣 Hooks

### useState

**מה זה?**
Hook לניהול state מקומי בקומפוננטה.

**שימוש:**
```javascript
const [count, setCount] = useState(0);
const [name, setName] = useState('');
const [items, setItems] = useState([]);
```

**עדכון:**
```javascript
setCount(count + 1);
setName('John');
setItems([...items, newItem]);
```

### useEffect

**מה זה?**
Hook לביצוע side effects (טעינת נתונים, subscriptions, וכו').

**דוגמאות:**

1. **טעינה פעם אחת:**
```javascript
useEffect(() => {
    fetchItems();
}, []); // רשימה ריקה = פעם אחת בלבד
```

2. **טעינה כשמשתנה:**
```javascript
useEffect(() => {
    fetchItem(itemId);
}, [itemId]); // רץ כל פעם ש-itemId משתנה
```

3. **ניקוי:**
```javascript
useEffect(() => {
    const interval = setInterval(() => {
        fetchData();
    }, 1000);
    
    return () => clearInterval(interval); // ניקוי בעת unmount
}, []);
```

### useCallback

**מה זה?**
Memoization של פונקציות (מונע יצירה מחדש).

```javascript
const fetchItems = useCallback(async () => {
    const data = await fetch(url).then(r => r.json());
    setItems(data);
}, []); // תלויות
```

### useMemo

**מה זה?**
Memoization של ערכים מחושבים.

```javascript
const filteredItems = useMemo(() => {
    return items.filter(item => item.price < 100);
}, [items]);
```

### useNavigate

**מה זה?**
Hook לניווט בין דפים.

```javascript
const navigate = useNavigate();
navigate('/app/login');
navigate(-1); // חזרה אחורה
```

### useParams

**מה זה?**
קבלת פרמטרים מה-URL.

```javascript
const { itemId } = useParams(); // /app/item/123 → itemId = "123"
```

---

## 🔄 Lifecycle - מחזור החיים

### שלבי מחזור החיים:

1. **Mounting** - הקומפוננטה נוצרת
   - `useState` מתאתחל
   - `useEffect` עם `[]` רץ פעם אחת

2. **Updating** - הקומפוננטה מתעדכנת
   - State משתנה → re-render
   - Props משתנים → re-render
   - `useEffect` עם dependencies רץ

3. **Unmounting** - הקומפוננטה נמחקת
   - `useEffect` cleanup function רץ

**דוגמה:**
```javascript
function MyComponent() {
    const [data, setData] = useState(null);
    
    useEffect(() => {
        // Mounting - רץ פעם אחת
        console.log('Component mounted');
        fetchData();
        
        return () => {
            // Unmounting - רץ בעת מחיקה
            console.log('Component unmounted');
        };
    }, []);
    
    useEffect(() => {
        // Updating - רץ כל פעם ש-data משתנה
        console.log('Data updated:', data);
    }, [data]);
    
    return <div>{data}</div>;
}
```

---

## ❓ שאלות נפוצות למבחן

### 1. מה ההבדל בין useState ל-useEffect?
- **useState**: ניהול state מקומי
- **useEffect**: ביצוע side effects (טעינת נתונים, subscriptions)

### 2. מה זה JSX?
- JavaScript XML - תחביר דמוי HTML בתוך JavaScript
- React ממיר JSX ל-JavaScript

### 3. מה ההבדל בין props ל-state?
- **Props**: נתונים שעוברים מ-parent ל-child (read-only)
- **State**: נתונים מקומיים של הקומפוננטה (mutable)

### 4. מה זה Context API?
- דרך לניהול מצב גלובלי ב-React
- מונע props drilling

### 5. מה זה React Router?
- ספרייה לניהול ניווט בין דפים
- Single Page Application (SPA)

### 6. מה ההבדל בין sessionStorage ל-localStorage?
- **sessionStorage**: נמחק כשסוגרים טאב
- **localStorage**: נשאר עד שמנקים ידנית

### 7. מה זה useEffect cleanup?
- פונקציה שרצה בעת unmount
- מנקה subscriptions, intervals, וכו'

### 8. מה זה useCallback?
- Memoization של פונקציות
- מונע יצירה מחדש של פונקציות

### 9. איך עושים API call ב-React?
- `fetch()` API
- `axios` (ספרייה חיצונית)

### 10. מה זה controlled components?
- קומפוננטות שהערך שלהן נשלט על ידי React state
- `value={state}` + `onChange={(e) => setState(e.target.value)}`

---

## 📝 טיפים למבחן

1. **זכור את ה-Hooks העיקריים:**
   - useState
   - useEffect
   - useContext
   - useNavigate
   - useParams

2. **הבן את מחזור החיים:**
   - Mounting → Updating → Unmounting

3. **הבן את מבנה הפרויקט:**
   - index.js → App.js → Components
   - Context → State Management
   - Routing → Navigation

4. **הבן את ה-API calls:**
   - fetch() עם headers
   - טיפול בשגיאות
   - async/await

5. **הבן את ה-Components:**
   - מה כל component עושה
   - איזה state יש לו
   - איזה API calls הוא עושה

---

## 🎯 סיכום - מה חשוב לזכור

### React Basics
- Components = פונקציות שמחזירות JSX
- Props = נתונים מ-parent
- State = נתונים מקומיים
- Hooks = פונקציות מיוחדות של React

### Project Structure
- `index.js` → נקודת כניסה
- `App.js` → routes
- `AppContext.js` → state גלובלי
- `components/` → כל הקומפוננטות

### Key Concepts
- **Routing**: React Router DOM
- **State**: useState, Context API
- **Effects**: useEffect
- **API**: fetch() עם async/await
- **Storage**: sessionStorage

### Important Components
- **MainPage**: רשימת פריטים + חיפוש
- **LoginPage**: התחברות
- **DetailsPage**: פרטי פריט
- **Navbar**: תפריט ניווט
- **ChatModal**: צ'אט בזמן אמת

---

**בהצלחה במבחן! 🎉**

