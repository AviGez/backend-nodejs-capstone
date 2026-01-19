# 📝 Exam Tips - Detailed Explanation

## 1. Remember Main Hooks

### useState
**What it does:** Manages local state in a component.

**How it works:**
```javascript
// Declaration
const [variableName, setVariableName] = useState(initialValue);

// Examples from project:
const [items, setItems] = useState([]);              // Array
const [email, setEmail] = useState('');              // String
const [loading, setLoading] = useState(true);       // Boolean
const [gift, setGift] = useState(null);             // Object/null
```

**When to use:**
- When you need to store data that changes
- When user input affects the component
- When API responses need to be stored

**Real example from MainPage.js:**
```javascript
const [items, setItems] = useState([]);
// Later: setItems(data) updates the items list
```

---

### useEffect
**What it does:** Performs side effects (API calls, subscriptions, DOM manipulation).

**How it works:**
```javascript
useEffect(() => {
    // Code to run
}, [dependencies]); // Dependencies array
```

**Three main patterns:**

1. **Run once on mount:**
```javascript
useEffect(() => {
    fetchItems(); // Load data when component first appears
}, []); // Empty array = run once
```

2. **Run when dependency changes:**
```javascript
useEffect(() => {
    fetchItem(itemId); // Reload when itemId changes
}, [itemId]); // Runs every time itemId changes
```

3. **Cleanup on unmount:**
```javascript
useEffect(() => {
    const interval = setInterval(() => {
        fetchUnread(); // Poll every 30 seconds
    }, 30000);
    
    return () => clearInterval(interval); // Cleanup when component unmounts
}, []);
```

**Real example from Navbar.js:**
```javascript
useEffect(() => {
    const fetchUnread = async () => {
        // Fetch notifications
    };
    
    if (isLoggedIn) {
        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval); // Cleanup
    }
}, [isLoggedIn]);
```

---

### useContext
**What it does:** Accesses Context values (global state).

**How it works:**
```javascript
// In AppContext.js - Create context
const AppContext = createContext();

// In component - Use context
const { isLoggedIn, userName } = useAppContext();
```

**Real example:**
```javascript
// LoginPage.js
import { useAppContext } from '../../context/AppContext';

function LoginPage() {
    const { setIsLoggedIn, setUserName, setUserRole } = useAppContext();
    
    // Use these functions to update global state
    setIsLoggedIn(true);
    setUserName('John');
}
```

**Why use it:**
- Avoids passing props through many components (props drilling)
- Makes state accessible to any component
- Centralized state management

---

### useNavigate
**What it does:** Programmatically navigates between pages.

**How it works:**
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Navigate to a route
navigate('/app/login');

// Go back
navigate(-1);

// Go forward
navigate(1);
```

**Real examples:**

1. **After login:**
```javascript
// LoginPage.js
const navigate = useNavigate();

const handleLogin = async () => {
    // ... login logic
    navigate('/app'); // Go to home page
};
```

2. **Redirect if not logged in:**
```javascript
// DetailsPage.js
useEffect(() => {
    if (!isLoggedIn) {
        navigate('/app/login'); // Redirect to login
    }
}, [isLoggedIn]);
```

3. **After logout:**
```javascript
// Navbar.js
const handleLogout = () => {
    sessionStorage.clear();
    navigate('/app/login'); // Go to login page
};
```

---

### useParams
**What it does:** Gets URL parameters from the route.

**How it works:**
```javascript
import { useParams } from 'react-router-dom';

function DetailsPage() {
    const { itemId } = useParams();
    // URL: /app/item/123 → itemId = "123"
}
```

**Real example from DetailsPage.js:**
```javascript
// Route definition in App.js:
<Route path="/app/item/:itemId" element={<DetailsPage />} />

// In DetailsPage.js:
function DetailsPage() {
    const { itemId } = useParams(); // Gets "123" from URL
    
    useEffect(() => {
        // Use itemId to fetch item data
        fetch(`${urlConfig.backendUrl}/api/secondchance/items/${itemId}`);
    }, [itemId]);
}
```

**Why use it:**
- Gets dynamic values from URL
- Reacts to URL changes
- Enables deep linking (direct access to specific pages)

---

## 2. Understand Lifecycle

### Component Lifecycle Stages

#### 1. Mounting (Component Created)
**What happens:**
- Component is first created and added to DOM
- `useState` initializes with initial values
- `useEffect` with empty dependencies `[]` runs once

**Example:**
```javascript
function MainPage() {
    const [items, setItems] = useState([]); // Initialize empty array
    
    useEffect(() => {
        fetchItems(); // Runs ONCE when component mounts
    }, []); // Empty array = mount only
    
    return <div>...</div>;
}
```

**Order of execution:**
1. Component function runs
2. `useState` initializes
3. Component renders (first time)
4. `useEffect` runs (if dependencies are empty)

---

#### 2. Updating (Component Updates)
**What happens:**
- State changes → Component re-renders
- Props change → Component re-renders
- `useEffect` with dependencies runs when dependencies change

**Example:**
```javascript
function DetailsPage() {
    const { itemId } = useParams();
    const [gift, setGift] = useState(null);
    
    useEffect(() => {
        // Runs every time itemId changes
        fetchItem(itemId);
    }, [itemId]); // Dependency: itemId
    
    // When itemId changes:
    // 1. useEffect runs
    // 2. fetchItem() called
    // 3. setGift() updates state
    // 4. Component re-renders with new data
}
```

**What triggers update:**
- `setState()` called
- Props change from parent
- Context value changes
- URL parameter changes (useParams)

---

#### 3. Unmounting (Component Removed)
**What happens:**
- Component is removed from DOM
- `useEffect` cleanup function runs
- All subscriptions/intervals are cleaned up

**Example:**
```javascript
function Navbar() {
    useEffect(() => {
        const interval = setInterval(() => {
            fetchUnread(); // Poll every 30 seconds
        }, 30000);
        
        // Cleanup function - runs when component unmounts
        return () => {
            clearInterval(interval); // Stop polling
        };
    }, []);
    
    // When user navigates away:
    // 1. Component unmounts
    // 2. Cleanup function runs
    // 3. Interval is cleared
}
```

**Why cleanup is important:**
- Prevents memory leaks
- Stops unnecessary API calls
- Cleans up subscriptions (Socket.IO, intervals, etc.)

---

### Complete Lifecycle Example

```javascript
function MyComponent() {
    const [count, setCount] = useState(0);
    const [data, setData] = useState(null);
    
    // Mounting: Runs once
    useEffect(() => {
        console.log('1. Component mounted');
        fetchData();
        
        // Unmounting: Cleanup function
        return () => {
            console.log('3. Component unmounted');
        };
    }, []);
    
    // Updating: Runs when count changes
    useEffect(() => {
        console.log('2. Count updated:', count);
    }, [count]);
    
    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>Increment</button>
        </div>
    );
}

// Execution order:
// 1. Component mounted
// 2. Count updated: 0 (initial)
// User clicks button
// 2. Count updated: 1
// User navigates away
// 3. Component unmounted
```

---

## 3. Understand Project Structure

### File Flow: index.js → App.js → Components

#### Step 1: index.js (Entry Point)
```javascript
// index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
```

**What it does:**
- Finds `<div id="root">` in HTML
- Creates React root
- Wraps App in BrowserRouter (enables routing)
- Renders App component

---

#### Step 2: App.js (Main Component)
```javascript
// App.js
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
            </Routes>
            <Footer />
        </AppProvider>
    );
}
```

**What it does:**
- Wraps everything in `AppProvider` (global state)
- Includes `Navbar` and `Footer` on all pages
- Defines routes (which component shows for which URL)

---

#### Step 3: Components (Individual Pages)
```javascript
// MainPage.js
function MainPage() {
    const [items, setItems] = useState([]);
    
    useEffect(() => {
        fetchItems();
    }, []);
    
    return <div>Items list...</div>;
}
```

**What it does:**
- Each component handles its own logic
- Uses hooks for state and effects
- Makes API calls as needed

---

### Context → State Management

#### How Context Works:

1. **Create Context:**
```javascript
// AppContext.js
const AppContext = createContext();
```

2. **Provide Values:**
```javascript
// AppContext.js
export const AppProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    return (
        <AppContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
            {children}
        </AppContext.Provider>
    );
};
```

3. **Use in Components:**
```javascript
// Any component
import { useAppContext } from '../../context/AppContext';

function MyComponent() {
    const { isLoggedIn, setIsLoggedIn } = useAppContext();
    // Can access and update global state
}
```

**Flow:**
```
AppProvider (provides state)
    ↓
App (wrapped in provider)
    ↓
All Components (can access via useAppContext)
```

---

### Routing → Navigation

#### How Routing Works:

1. **Define Routes:**
```javascript
// App.js
<Routes>
    <Route path="/" element={<MainPage />} />
    <Route path="/app/login" element={<LoginPage />} />
    <Route path="/app/item/:itemId" element={<DetailsPage />} />
</Routes>
```

2. **Navigate Programmatically:**
```javascript
// In component
const navigate = useNavigate();
navigate('/app/login');
```

3. **Get URL Parameters:**
```javascript
// In component
const { itemId } = useParams();
// URL: /app/item/123 → itemId = "123"
```

**Flow:**
```
User clicks link / types URL
    ↓
React Router matches route
    ↓
Renders corresponding component
    ↓
Component can use useParams to get URL data
```

---

## 4. Understand API Calls

### fetch() with Headers

#### Basic Structure:
```javascript
const response = await fetch(url, {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data) // For POST/PUT
});
```

#### Real Examples:

1. **GET Request (No Auth):**
```javascript
// MainPage.js - Get all items
const fetchItems = async () => {
    const response = await fetch(
        `${urlConfig.backendUrl}/api/secondchance/items`
    );
    const data = await response.json();
    setItems(data);
};
```

2. **GET Request (With Auth):**
```javascript
// Navbar.js - Get notifications
const fetchUnread = async () => {
    const token = sessionStorage.getItem('auth-token');
    const response = await fetch(
        `${urlConfig.backendUrl}/api/notifications`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );
    const notifications = await response.json();
    setUnreadCount(notifications.filter(n => !n.readAt).length);
};
```

3. **POST Request (With Auth + Body):**
```javascript
// LoginPage.js - Login
const handleLogin = async (e) => {
    e.preventDefault();
    
    const response = await fetch(
        `${urlConfig.backendUrl}/api/auth/login`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        }
    );
    
    const json = await response.json();
    if (json.authtoken) {
        sessionStorage.setItem('auth-token', json.authtoken);
    }
};
```

4. **POST Request (With Auth Header):**
```javascript
// MainPage.js - Reserve item
const handleReserve = async (itemId) => {
    const token = sessionStorage.getItem('auth-token');
    const response = await fetch(
        `${urlConfig.backendUrl}/api/secondchance/items/${itemId}/reserve`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );
    const updatedItem = await response.json();
    setItems(prevItems => 
        prevItems.map(item => 
            item.id === updatedItem.id ? updatedItem : item
        )
    );
};
```

---

### Error Handling

#### Basic Error Handling:
```javascript
try {
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    setItems(data);
} catch (error) {
    setError(error.message);
    console.error('Error:', error);
}
```

#### Real Example from MainPage.js:
```javascript
const fetchItems = async () => {
    try {
        const response = await fetch(
            `${urlConfig.backendUrl}/api/secondchance/items`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! ${response.status}`);
        }
        
        const data = await response.json();
        setItems(filterAvailableItems(data));
    } catch (error) {
        setErrorMessage(error.message);
    }
};
```

#### Advanced Error Handling:
```javascript
const handleReserve = async (itemId) => {
    try {
        const token = sessionStorage.getItem('auth-token');
        const response = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const errorJson = await response.json().catch(() => ({}));
            throw new Error(errorJson.error || 'Unable to reserve item');
        }
        
        const updatedItem = await response.json();
        // Success handling
    } catch (error) {
        setErrorMessage(error.message);
        setTimeout(() => setErrorMessage(''), 4000);
    }
};
```

---

### async/await

#### Why use async/await:
- Makes asynchronous code look synchronous
- Easier to read than promises with `.then()`
- Better error handling with try/catch

#### Comparison:

**Without async/await (Promises):**
```javascript
fetch(url)
    .then(response => response.json())
    .then(data => {
        setItems(data);
    })
    .catch(error => {
        setError(error.message);
    });
```

**With async/await:**
```javascript
try {
    const response = await fetch(url);
    const data = await response.json();
    setItems(data);
} catch (error) {
    setError(error.message);
}
```

#### Real Example:
```javascript
// Function must be async
const fetchItems = async () => {
    try {
        // await waits for promise to resolve
        const response = await fetch(url);
        const data = await response.json();
        setItems(data);
    } catch (error) {
        setError(error.message);
    }
};

// Call it
useEffect(() => {
    fetchItems(); // Can call async function normally
}, []);
```

---

## 5. Understand Components

### What Each Component Does

#### MainPage.js
**Purpose:** Home page - displays items list, search, carousel

**State:**
- `items` - List of items to display
- `searchQuery` - Search input value
- `selectedCategory` - Selected category filter
- `errorMessage` - Error messages
- `searchLoading` - Loading state for search

**API Calls:**
- `GET /api/secondchance/items` - Get all items
- `GET /api/secondchance/search` - Search items
- `POST /api/secondchance/items/:id/reserve` - Reserve item

**Key Functions:**
- `fetchItems()` - Load all items
- `handleSearch()` - Perform search
- `handleReserve()` - Reserve an item

---

#### LoginPage.js
**Purpose:** User authentication

**State:**
- `email` - Email input
- `password` - Password input
- `incorrect` - Error message

**API Calls:**
- `POST /api/auth/login` - Login user

**Key Functions:**
- `handleLogin()` - Submit login form

**What happens:**
1. User enters email/password
2. `handleLogin()` sends POST request
3. If successful, saves token to sessionStorage
4. Updates Context (isLoggedIn, userName, etc.)
5. Navigates to `/app`

---

#### DetailsPage.js
**Purpose:** Show full item details, enable purchase/chat

**State:**
- `gift` - Item data
- `loading` - Loading state
- `error` - Error state
- `chatModal` - Chat modal state
- `showPaymentModal` - Payment modal state

**API Calls:**
- `GET /api/secondchance/items/:id` - Get item details
- `GET /api/secondchance/items/:id/secure` - Get secure item info
- `POST /api/chats/:itemId` - Create/open chat
- `POST /api/payments/create-order` - Create payment order

**Key Functions:**
- `fetchItem()` - Load item data
- `handleOpenChat()` - Open chat with seller
- `handleBuy()` - Initiate purchase

---

#### Navbar.js
**Purpose:** Top navigation menu

**State:**
- `unreadCount` - Number of unread notifications

**API Calls:**
- `GET /api/notifications` - Get notifications (every 30 seconds)

**Key Functions:**
- `fetchUnread()` - Load unread notifications count
- `handleLogout()` - Logout user

**Special Features:**
- Polls notifications every 30 seconds
- Shows notification badge
- Cleans up interval on unmount

---

#### ChatModal.js
**Purpose:** Real-time chat window

**State:**
- `messages` - Chat messages array
- `newMessage` - Current message input
- `socket` - Socket.IO connection

**API Calls:**
- `GET /api/chats/:chatId/messages` - Load messages
- `POST /api/chats/:chatId/messages` - Send message (or Socket.IO)

**Key Functions:**
- Socket.IO connection setup
- `sendMessage()` - Send message via Socket.IO
- `loadMessages()` - Load message history

**Special Features:**
- Real-time updates via Socket.IO
- Auto-scroll to latest message
- Connection cleanup on unmount

---

### Component State Patterns

#### Pattern 1: Loading State
```javascript
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const response = await fetch(url);
        const data = await response.json();
        setData(data);
        setLoading(false);
    };
    fetchData();
}, []);

if (loading) return <div>Loading...</div>;
return <div>{data}</div>;
```

#### Pattern 2: Error Handling
```javascript
const [error, setError] = useState(null);
const [data, setData] = useState(null);

const fetchData = async () => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        setData(data);
        setError(null);
    } catch (err) {
        setError(err.message);
    }
};
```

#### Pattern 3: Form Handling
```javascript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
};
```

---

## 🎯 Quick Reference

### Hooks Cheat Sheet
- `useState(value)` - Local state
- `useEffect(() => {}, [deps])` - Side effects
- `useContext(Context)` - Access context
- `useNavigate()` - Navigation
- `useParams()` - URL parameters

### Lifecycle Cheat Sheet
- **Mount**: Component created → useState → useEffect([])
- **Update**: State/Props change → Re-render → useEffect([deps])
- **Unmount**: Component removed → Cleanup function

### API Call Pattern
```javascript
const fetchData = async () => {
    try {
        const token = sessionStorage.getItem('auth-token');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed');
        const data = await response.json();
        // Handle success
    } catch (error) {
        // Handle error
    }
};
```

---

**Good luck! 🎉**

