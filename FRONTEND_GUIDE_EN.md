# 📚 Complete Frontend Guide - Exam Preparation

## Table of Contents
1. [Project Structure](#project-structure)
2. [React Basics](#react-basics)
3. [Components - All Components](#components)
4. [Routing - Navigation](#routing)
5. [State Management](#state-management)
6. [API Calls - Server Requests](#api-calls)
7. [Hooks - useState, useEffect](#hooks)
8. [Lifecycle - Component Lifecycle](#lifecycle)
9. [Common Exam Questions](#common-exam-questions)

---

## 📁 Project Structure

```
frontend/
├── public/              # Static files
│   ├── index.html      # Main HTML
│   └── home.html
│
├── src/
│   ├── index.js         # Entry point - starts React
│   ├── App.js           # Main component - defines routes
│   ├── App.css          # Global styles
│   ├── config.js        # Configuration (backend URL)
│   │
│   ├── context/
│   │   └── AppContext.js    # Global state management (Context API)
│   │
│   └── components/      # All components
│       ├── MainPage/         # Home page - items list
│       ├── LoginPage/        # Login page
│       ├── RegisterPage/     # Registration page
│       ├── DetailsPage/      # Item details page
│       ├── ItemPage/         # Add new item page
│       ├── Profile/          # User profile page
│       ├── Navbar/           # Top navigation menu
│       ├── Footer/           # Website footer
│       ├── ChatModal/        # Chat window
│       ├── PaymentModal/     # Payment window
│       ├── AdminPanel/       # Admin panel
│       ├── SearchPage/        # Search page
│       ├── PurchaseHistory/  # Purchase history
│       └── NewArrivalsCarousel/  # New items carousel
│
└── package.json         # Project dependencies
```

---

## ⚛️ React Basics

### What is React?
React is a JavaScript library for building user interfaces (UI).

### Basic Component

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
JSX allows writing HTML inside JavaScript:

```javascript
// ✅ JSX - Correct
const element = <h1>Hello</h1>;

// ❌ Not JSX - Wrong
const element = "<h1>Hello</h1>";
```

### Props - Passing Data

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

### State - Local State

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

### 1. **index.js** - Entry Point

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

**What does it do?**
- Creates root element
- Wraps app in `Router` (for navigation)
- Renders `App` component

---

### 2. **App.js** - Main Component

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

**What does it do?**
- Defines all routes (paths)
- Wraps everything in `AppProvider` (for global state management)
- Includes `Navbar` and `Footer` on all pages

**Routes:**
- `/` → MainPage (home page)
- `/app/login` → LoginPage
- `/app/register` → RegisterPage
- `/app/item/:itemId` → DetailsPage (item details)
- `/app/addItem` → ItemPage (add item)
- `/app/profile` → Profile (profile)
- `/app/admin` → AdminPanel (admin)

---

### 3. **AppContext.js** - Global State Management

```javascript
import { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // Read data from sessionStorage
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

**What does it do?**
- Creates global Context for entire app
- Stores state: login status, username, role, ID
- Allows any component to access this data

**Usage:**
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

### 4. **MainPage.js** - Home Page

**Purpose:** Displays items list, search, carousel

**State:**
```javascript
const [items, setItems] = useState([]);              // Items list
const [searchQuery, setSearchQuery] = useState('');  // Search query
const [selectedCategory, setSelectedCategory] = useState(''); // Category
const [errorMessage, setErrorMessage] = useState(''); // Errors
```

**Key Functions:**

1. **fetchItems()** - Load items:
```javascript
const fetchItems = async () => {
    const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items`);
    const data = await response.json();
    setItems(data);
};
```

2. **handleSearch()** - Advanced search:
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

3. **handleReserve()** - Reserve item:
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
    // Update list
    setItems(prevItems => 
        prevItems.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
};
```

**useEffect:**
```javascript
useEffect(() => {
    fetchItems(); // Loads items when component mounts
}, []);
```

---

### 5. **LoginPage.js** - Login Page

**Purpose:** User login

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
        // Save to sessionStorage
        sessionStorage.setItem('auth-token', json.authtoken);
        sessionStorage.setItem('name', json.userName);
        sessionStorage.setItem('role', json.userRole);
        sessionStorage.setItem('user-id', json.userId);
        
        // Update Context
        setIsLoggedIn(true);
        setUserName(json.userName);
        setUserRole(json.userRole);
        
        // Navigate to home
        navigate('/app');
    } else {
        setIncorrect('Wrong password');
    }
};
```

**useEffect - Check if already logged in:**
```javascript
useEffect(() => {
    if (sessionStorage.getItem('auth-token')) {
        navigate('/app'); // Auto redirect if already logged in
    }
}, [navigate]);
```

---

### 6. **DetailsPage.js** - Item Details Page

**Purpose:** Shows full item details, option to buy/chat

**State:**
```javascript
const [gift, setGift] = useState(null);           // Item data
const [loading, setLoading] = useState(true);     // Loading state
const [error, setError] = useState(null);         // Errors
const [chatModal, setChatModal] = useState({ open: false, chatId: null });
const [showPaymentModal, setShowPaymentModal] = useState(false);
```

**useParams - Get itemId from URL:**
```javascript
import { useParams } from 'react-router-dom';

function DetailsPage() {
    const { itemId } = useParams(); // Gets itemId from URL
    // Example: /app/item/123 → itemId = "123"
}
```

**Load item:**
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

**Open chat:**
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

### 7. **Navbar.js** - Navigation Menu

**Purpose:** Top menu with links and logic

**State:**
```javascript
const [unreadCount, setUnreadCount] = useState(0); // Unread notifications count
```

**Load notifications:**
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
        // Refresh every 30 seconds
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }
}, [isLoggedIn]);
```

**Logout:**
```javascript
const handleLogout = () => {
    sessionStorage.clear();
    setIsLoggedIn(false);
    setUserName('');
    navigate('/app/login');
};
```

---

### 8. **ChatModal.js** - Chat Window

**Purpose:** Real-time chat with Socket.IO

**State:**
```javascript
const [messages, setMessages] = useState([]);
const [newMessage, setNewMessage] = useState('');
const [socket, setSocket] = useState(null);
```

**Connect to Socket.IO:**
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

**Send message:**
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

### 9. **PaymentModal.js** - Payment Window

**Purpose:** Payment via PayPal

**Create order:**
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
    // Use PayPal SDK
};
```

---

## 🧭 Routing

### React Router DOM

**What is it?**
Library for managing navigation between pages in React (Single Page Application).

**Usage:**

```javascript
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';

// Define routes
<Routes>
    <Route path="/" element={<MainPage />} />
    <Route path="/app/login" element={<LoginPage />} />
    <Route path="/app/item/:itemId" element={<DetailsPage />} />
</Routes>

// Navigate inside component
const navigate = useNavigate();
navigate('/app/login');

// Get parameters from URL
const { itemId } = useParams(); // /app/item/123 → itemId = "123"
```

**Routes in project:**
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

**What is it?**
Way to manage global state in React without props drilling.

**Creation:**
```javascript
const AppContext = createContext();
```

**Provider:**
```javascript
<AppContext.Provider value={{ isLoggedIn, userName }}>
    {children}
</AppContext.Provider>
```

**Usage:**
```javascript
const { isLoggedIn, userName } = useAppContext();
```

### sessionStorage

**What is it?**
Local browser storage (deleted when tab is closed).

**Usage:**
```javascript
// Save
sessionStorage.setItem('auth-token', token);
sessionStorage.setItem('name', userName);

// Read
const token = sessionStorage.getItem('auth-token');
const name = sessionStorage.getItem('name');

// Delete
sessionStorage.removeItem('auth-token');
sessionStorage.clear(); // Delete everything
```

---

## 🌐 API Calls

### Fetch API

**Basic example:**
```javascript
const response = await fetch(`${urlConfig.backendUrl}/api/items`);
const data = await response.json();
```

**With headers:**
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

**Error handling:**
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

**What is it?**
Hook for managing local state in component.

**Usage:**
```javascript
const [count, setCount] = useState(0);
const [name, setName] = useState('');
const [items, setItems] = useState([]);
```

**Update:**
```javascript
setCount(count + 1);
setName('John');
setItems([...items, newItem]);
```

### useEffect

**What is it?**
Hook for performing side effects (loading data, subscriptions, etc.).

**Examples:**

1. **Load once:**
```javascript
useEffect(() => {
    fetchItems();
}, []); // Empty array = once only
```

2. **Load when changes:**
```javascript
useEffect(() => {
    fetchItem(itemId);
}, [itemId]); // Runs every time itemId changes
```

3. **Cleanup:**
```javascript
useEffect(() => {
    const interval = setInterval(() => {
        fetchData();
    }, 1000);
    
    return () => clearInterval(interval); // Cleanup on unmount
}, []);
```

### useCallback

**What is it?**
Memoization of functions (prevents recreation).

```javascript
const fetchItems = useCallback(async () => {
    const data = await fetch(url).then(r => r.json());
    setItems(data);
}, []); // Dependencies
```

### useMemo

**What is it?**
Memoization of computed values.

```javascript
const filteredItems = useMemo(() => {
    return items.filter(item => item.price < 100);
}, [items]);
```

### useNavigate

**What is it?**
Hook for navigation between pages.

```javascript
const navigate = useNavigate();
navigate('/app/login');
navigate(-1); // Go back
```

### useParams

**What is it?**
Get parameters from URL.

```javascript
const { itemId } = useParams(); // /app/item/123 → itemId = "123"
```

---

## 🔄 Lifecycle - Component Lifecycle

### Lifecycle Stages:

1. **Mounting** - Component is created
   - `useState` initializes
   - `useEffect` with `[]` runs once

2. **Updating** - Component updates
   - State changes → re-render
   - Props change → re-render
   - `useEffect` with dependencies runs

3. **Unmounting** - Component is removed
   - `useEffect` cleanup function runs

**Example:**
```javascript
function MyComponent() {
    const [data, setData] = useState(null);
    
    useEffect(() => {
        // Mounting - runs once
        console.log('Component mounted');
        fetchData();
        
        return () => {
            // Unmounting - runs on removal
            console.log('Component unmounted');
        };
    }, []);
    
    useEffect(() => {
        // Updating - runs every time data changes
        console.log('Data updated:', data);
    }, [data]);
    
    return <div>{data}</div>;
}
```

---

## ❓ Common Exam Questions

### 1. What's the difference between useState and useEffect?
- **useState**: Managing local state
- **useEffect**: Performing side effects (loading data, subscriptions)

### 2. What is JSX?
- JavaScript XML - HTML-like syntax inside JavaScript
- React converts JSX to JavaScript

### 3. What's the difference between props and state?
- **Props**: Data passed from parent to child (read-only)
- **State**: Local data of component (mutable)

### 4. What is Context API?
- Way to manage global state in React
- Prevents props drilling

### 5. What is React Router?
- Library for managing navigation between pages
- Single Page Application (SPA)

### 6. What's the difference between sessionStorage and localStorage?
- **sessionStorage**: Deleted when tab closes
- **localStorage**: Remains until manually cleared

### 7. What is useEffect cleanup?
- Function that runs on unmount
- Cleans up subscriptions, intervals, etc.

### 8. What is useCallback?
- Memoization of functions
- Prevents function recreation

### 9. How do you make API calls in React?
- `fetch()` API
- `axios` (external library)

### 10. What are controlled components?
- Components whose value is controlled by React state
- `value={state}` + `onChange={(e) => setState(e.target.value)}`

---

## 📝 Exam Tips

1. **Remember main Hooks:**
   - useState
   - useEffect
   - useContext
   - useNavigate
   - useParams

2. **Understand lifecycle:**
   - Mounting → Updating → Unmounting

3. **Understand project structure:**
   - index.js → App.js → Components
   - Context → State Management
   - Routing → Navigation

4. **Understand API calls:**
   - fetch() with headers
   - Error handling
   - async/await

5. **Understand Components:**
   - What each component does
   - What state it has
   - What API calls it makes

---

## 🎯 Summary - What to Remember

### React Basics
- Components = Functions that return JSX
- Props = Data from parent
- State = Local data
- Hooks = Special React functions

### Project Structure
- `index.js` → Entry point
- `App.js` → Routes
- `AppContext.js` → Global state
- `components/` → All components

### Key Concepts
- **Routing**: React Router DOM
- **State**: useState, Context API
- **Effects**: useEffect
- **API**: fetch() with async/await
- **Storage**: sessionStorage

### Important Components
- **MainPage**: Items list + search
- **LoginPage**: Login
- **DetailsPage**: Item details
- **Navbar**: Navigation menu
- **ChatModal**: Real-time chat

---

**Good luck on your exam! 🎉**

