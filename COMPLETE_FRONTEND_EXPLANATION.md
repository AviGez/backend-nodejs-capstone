# 📚 Complete Frontend Explanation - With Real Code Examples

## Table of Contents
1. [React Fundamentals](#react-fundamentals)
2. [Hooks Deep Dive](#hooks-deep-dive)
3. [Component Lifecycle](#component-lifecycle)
4. [State Management](#state-management)
5. [API Calls - Complete Guide](#api-calls)
6. [Routing - Complete Guide](#routing)
7. [Real Component Examples](#real-component-examples)
8. [Common Patterns](#common-patterns)

---

## ⚛️ React Fundamentals

### What is React?

React is a JavaScript library for building user interfaces. It uses a component-based architecture where you build reusable pieces of UI.

### JSX Explained

**JSX** (JavaScript XML) allows you to write HTML-like syntax in JavaScript.

#### Example 1: Basic JSX
```javascript
// ✅ This is JSX - React understands this
const element = <h1>Hello World</h1>;

// ❌ This is NOT JSX - just a string
const element = "<h1>Hello World</h1>";
```

#### Example 2: JSX with JavaScript Expressions
```javascript
const name = "John";
const age = 25;

// Embed JavaScript in JSX with {}
const element = (
    <div>
        <h1>Hello {name}</h1>
        <p>You are {age} years old</p>
        <p>Next year you'll be {age + 1}</p>
    </div>
);
```

#### Example 3: JSX with Conditional Rendering
```javascript
const isLoggedIn = true;

// Conditional rendering
const element = (
    <div>
        {isLoggedIn ? (
            <p>Welcome back!</p>
        ) : (
            <p>Please login</p>
        )}
    </div>
);
```

**Real Example from Navbar.js:**
```javascript
{isLoggedIn ? (
    <>
        <li className="nav-item">
            <span className="nav-link">Personal area</span>
        </li>
        <li className="nav-item">
            <button onClick={handleLogout}>Logout</button>
        </li>
    </>
) : (
    <>
        <li className="nav-item">
            <Link to="/app/login">Login</Link>
        </li>
        <li className="nav-item">
            <Link to="/app/register">Join</Link>
        </li>
    </>
)}
```

---

### Components Explained

A component is a JavaScript function that returns JSX.

#### Example 1: Simple Component
```javascript
function Welcome() {
    return <h1>Welcome to our app!</h1>;
}
```

#### Example 2: Component with Props
```javascript
// Parent component passes data
function App() {
    return <Welcome name="John" age={25} />;
}

// Child component receives props
function Welcome(props) {
    return (
        <div>
            <h1>Welcome {props.name}!</h1>
            <p>You are {props.age} years old</p>
        </div>
    );
}

// Or with destructuring
function Welcome({ name, age }) {
    return (
        <div>
            <h1>Welcome {name}!</h1>
            <p>You are {age} years old</p>
        </div>
    );
}
```

#### Example 3: Component with State
```javascript
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

## 🎣 Hooks Deep Dive

### useState - Complete Guide

**What it does:** Manages local state in a component.

#### Syntax
```javascript
const [stateVariable, setStateFunction] = useState(initialValue);
```

#### Example 1: String State
```javascript
function LoginPage() {
    // Initialize with empty string
    const [email, setEmail] = useState('');
    
    return (
        <input 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />
    );
}
```

**How it works:**
1. `useState('')` creates state with initial value `''`
2. `email` holds the current value
3. `setEmail` is a function to update the value
4. When `setEmail('new@email.com')` is called, React re-renders the component

#### Example 2: Array State
```javascript
function MainPage() {
    // Initialize with empty array
    const [items, setItems] = useState([]);
    
    // Update array - ADD item
    const addItem = (newItem) => {
        setItems([...items, newItem]); // Spread operator
    };
    
    // Update array - UPDATE item
    const updateItem = (itemId, updatedItem) => {
        setItems(items.map(item => 
            item.id === itemId ? updatedItem : item
        ));
    };
    
    // Update array - REMOVE item
    const removeItem = (itemId) => {
        setItems(items.filter(item => item.id !== itemId));
    };
    
    return <div>{items.map(item => <div key={item.id}>{item.name}</div>)}</div>;
}
```

**Real Example from MainPage.js:**
```javascript
const [items, setItems] = useState([]);

// After fetching items
const fetchItems = async () => {
    const data = await response.json();
    setItems(data); // Updates the entire array
};

// After reserving an item
const handleReserve = async (itemId) => {
    const updatedItem = await response.json();
    // Update only the specific item in the array
    setItems(prevItems =>
        prevItems.map(item => 
            item.id === updatedItem.id ? updatedItem : item
        )
    );
};
```

#### Example 3: Object State
```javascript
function DetailsPage() {
    const [gift, setGift] = useState(null); // null initially
    
    // Update entire object
    const updateGift = (newGift) => {
        setGift(newGift);
    };
    
    // Update specific property
    const updateGiftName = (newName) => {
        setGift({ ...gift, name: newName }); // Spread operator
    };
}
```

#### Example 4: Boolean State
```javascript
function ChatModal() {
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        loadMessages().then(() => {
            setLoading(false); // Change to false when done
        });
    }, []);
    
    if (loading) {
        return <div>Loading...</div>;
    }
    
    return <div>Messages loaded!</div>;
}
```

#### Example 5: Multiple States
```javascript
function MainPage() {
    // Multiple independent states
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Each state is independent
    // Changing searchQuery doesn't affect items
    // Changing items doesn't affect searchQuery
}
```

#### Important Rules:
1. **Never mutate state directly:**
```javascript
// ❌ WRONG - Don't do this
items.push(newItem);
setItems(items);

// ✅ CORRECT - Create new array
setItems([...items, newItem]);
```

2. **Use functional updates when depending on previous state:**
```javascript
// ✅ CORRECT - Uses previous state
setCount(prevCount => prevCount + 1);

// ✅ CORRECT - Uses previous items
setItems(prevItems => [...prevItems, newItem]);
```

---

### useEffect - Complete Guide

**What it does:** Performs side effects (API calls, subscriptions, DOM manipulation).

#### Syntax
```javascript
useEffect(() => {
    // Effect code
    return () => {
        // Cleanup code (optional)
    };
}, [dependencies]); // Dependency array
```

#### Pattern 1: Run Once on Mount

```javascript
useEffect(() => {
    // This runs ONCE when component first mounts
    fetchItems();
}, []); // Empty array = no dependencies = run once
```

**Real Example from MainPage.js:**
```javascript
const fetchItems = useCallback(async () => {
    const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items`);
    const data = await response.json();
    setItems(data);
}, []);

useEffect(() => {
    fetchItems(); // Runs once when MainPage mounts
}, [fetchItems]);
```

**When to use:**
- Loading initial data
- Setting up subscriptions
- One-time initialization

---

#### Pattern 2: Run When Dependencies Change

```javascript
useEffect(() => {
    // This runs every time itemId changes
    fetchItem(itemId);
}, [itemId]); // itemId is a dependency
```

**Real Example from DetailsPage.js:**
```javascript
const { itemId } = useParams();

useEffect(() => {
    const fetchItem = async () => {
        const response = await fetch(
            `${urlConfig.backendUrl}/api/secondchance/items/${itemId}`
        );
        const data = await response.json();
        setGift(data);
    };
    
    fetchItem(); // Runs every time itemId changes
}, [itemId]); // Dependency: itemId
```

**How it works:**
1. Component mounts → `itemId` is "123" → useEffect runs
2. User navigates to `/app/item/456` → `itemId` changes to "456" → useEffect runs again
3. User navigates to `/app/item/789` → `itemId` changes to "789" → useEffect runs again

**When to use:**
- Fetching data based on URL parameters
- Reacting to prop changes
- Updating when state changes

---

#### Pattern 3: Cleanup on Unmount

```javascript
useEffect(() => {
    // Setup
    const interval = setInterval(() => {
        fetchData();
    }, 1000);
    
    // Cleanup - runs when component unmounts
    return () => {
        clearInterval(interval);
    };
}, []); // Empty array = run once, cleanup on unmount
```

**Real Example from Navbar.js:**
```javascript
useEffect(() => {
    const fetchUnread = async () => {
        const token = sessionStorage.getItem('auth-token');
        const response = await fetch(`${urlConfig.backendUrl}/api/notifications`);
        const notifications = await response.json();
        const unread = notifications.filter(n => !n.readAt).length;
        setUnreadCount(unread);
    };
    
    if (isLoggedIn) {
        fetchUnread(); // Run immediately
        const intervalId = setInterval(fetchUnread, 30000); // Every 30 seconds
        
        // Cleanup function
        return () => {
            clearInterval(intervalId); // Stop polling when component unmounts
        };
    }
}, [isLoggedIn]);
```

**Why cleanup is important:**
- Prevents memory leaks
- Stops unnecessary API calls
- Cleans up subscriptions

**Real Example from ChatModal.js:**
```javascript
useEffect(() => {
    const socket = io(urlConfig.backendUrl, {
        auth: { token }
    });
    
    socket.on('new_message', (message) => {
        setMessages(prev => [...prev, message]);
    });
    
    // Cleanup - disconnect socket when component unmounts
    return () => {
        socket.disconnect(); // Important! Prevents memory leaks
    };
}, [chatId]);
```

---

#### Pattern 4: Multiple useEffect Hooks

You can have multiple `useEffect` hooks in one component:

```javascript
function DetailsPage() {
    const { itemId } = useParams();
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Effect 1: Fetch item when itemId changes
    useEffect(() => {
        const fetchItem = async () => {
            const response = await fetch(`/api/items/${itemId}`);
            const data = await response.json();
            setGift(data);
            setLoading(false);
        };
        fetchItem();
    }, [itemId]);
    
    // Effect 2: Scroll to top when gift changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [gift?.id]);
    
    // Effect 3: Reset image index when gift changes
    useEffect(() => {
        setActiveImageIndex(0);
    }, [gift?.id]);
}
```

---

### useContext - Complete Guide

**What it does:** Accesses Context values (global state) without props drilling.

#### Step 1: Create Context

```javascript
// AppContext.js
import { createContext } from 'react';

const AppContext = createContext();
```

#### Step 2: Provide Values

```javascript
// AppContext.js
export const AppProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userName, setUserName] = useState('');
    
    return (
        <AppContext.Provider value={{
            isLoggedIn,
            setIsLoggedIn,
            userName,
            setUserName,
        }}>
            {children}
        </AppContext.Provider>
    );
};
```

#### Step 3: Use in Components

```javascript
// Any component
import { useAppContext } from '../../context/AppContext';

function MyComponent() {
    const { isLoggedIn, userName, setIsLoggedIn } = useAppContext();
    
    return (
        <div>
            {isLoggedIn ? (
                <p>Hello {userName}!</p>
            ) : (
                <p>Please login</p>
            )}
        </div>
    );
}
```

**Real Example from LoginPage.js:**
```javascript
import { useAppContext } from '../../context/AppContext';

function LoginPage() {
    const { setIsLoggedIn, setUserName, setUserRole, setCurrentUserId } = useAppContext();
    
    const handleLogin = async () => {
        const json = await res.json();
        
        if (json.authtoken) {
            // Update global state
            setIsLoggedIn(true);
            setUserName(json.userName);
            setUserRole(json.userRole);
            setCurrentUserId(json.userId);
        }
    };
}
```

**Why use Context:**
- Avoids passing props through many components
- Makes state accessible to any component
- Centralized state management

**Without Context (Props Drilling):**
```javascript
// ❌ BAD - Props drilling
function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    return <Page1 isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />;
}

function Page1({ isLoggedIn, setIsLoggedIn }) {
    return <Page2 isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />;
}

function Page2({ isLoggedIn, setIsLoggedIn }) {
    return <Button isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />;
}
```

**With Context:**
```javascript
// ✅ GOOD - Context
function App() {
    return (
        <AppProvider>
            <Page1 />
        </AppProvider>
    );
}

function Page1() {
    return <Page2 />;
}

function Page2() {
    const { isLoggedIn, setIsLoggedIn } = useAppContext();
    return <Button />;
}
```

---

### useNavigate - Complete Guide

**What it does:** Programmatically navigates between pages.

#### Basic Usage

```javascript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
    const navigate = useNavigate();
    
    const goToLogin = () => {
        navigate('/app/login');
    };
    
    return <button onClick={goToLogin}>Go to Login</button>;
}
```

#### Real Examples

**Example 1: Navigate after login**
```javascript
// LoginPage.js
const navigate = useNavigate();

const handleLogin = async () => {
    const json = await res.json();
    
    if (json.authtoken) {
        sessionStorage.setItem('auth-token', json.authtoken);
        navigate('/app'); // Navigate to home page
    }
};
```

**Example 2: Redirect if not logged in**
```javascript
// DetailsPage.js
const navigate = useNavigate();
const { isLoggedIn } = useAppContext();

useEffect(() => {
    if (!isLoggedIn) {
        navigate('/app/login'); // Redirect to login
    }
}, [isLoggedIn, navigate]);
```

**Example 3: Navigate with button click**
```javascript
// MainPage.js
const navigate = useNavigate();

const goToDetailsPage = (itemId) => {
    navigate(`/app/item/${itemId}`); // Navigate with parameter
};

return (
    <button onClick={() => goToDetailsPage(item.id)}>
        View Details
    </button>
);
```

**Example 4: Navigate back**
```javascript
const navigate = useNavigate();

const goBack = () => {
    navigate(-1); // Go back one page in history
};
```

---

### useParams - Complete Guide

**What it does:** Gets URL parameters from the route.

#### Basic Usage

```javascript
import { useParams } from 'react-router-dom';

function DetailsPage() {
    const { itemId } = useParams();
    // URL: /app/item/123 → itemId = "123"
    
    return <div>Item ID: {itemId}</div>;
}
```

#### Route Definition

```javascript
// App.js
<Route path="/app/item/:itemId" element={<DetailsPage />} />
//                                    ↑
//                            This becomes the parameter name
```

#### Real Example from DetailsPage.js

```javascript
function DetailsPage() {
    const { itemId } = useParams(); // Gets "123" from URL /app/item/123
    
    useEffect(() => {
        const fetchItem = async () => {
            // Use itemId in API call
            const response = await fetch(
                `${urlConfig.backendUrl}/api/secondchance/items/${itemId}`
            );
            const data = await response.json();
            setGift(data);
        };
        
        fetchItem();
    }, [itemId]); // Re-run when itemId changes
}
```

**How it works:**
1. User navigates to `/app/item/123`
2. React Router matches the route `/app/item/:itemId`
3. `useParams()` returns `{ itemId: "123" }`
4. Component can use `itemId` to fetch data

---

## 🔄 Component Lifecycle

### Complete Lifecycle Flow

#### 1. Mounting (Component Created)

**What happens:**
1. Component function is called
2. `useState` hooks initialize
3. Component renders (first time)
4. `useEffect` hooks with empty dependencies run

**Example:**
```javascript
function MainPage() {
    console.log('1. Component function called');
    
    const [items, setItems] = useState([]); // 2. State initialized
    console.log('2. State initialized');
    
    useEffect(() => {
        console.log('4. useEffect runs (mount)');
        fetchItems();
    }, []);
    
    console.log('3. Component renders');
    return <div>Main Page</div>;
}

// Output:
// 1. Component function called
// 2. State initialized
// 3. Component renders
// 4. useEffect runs (mount)
```

---

#### 2. Updating (Component Updates)

**What triggers update:**
- State changes (`setState` called)
- Props change from parent
- Context value changes
- URL parameter changes (`useParams`)

**Example:**
```javascript
function DetailsPage() {
    const { itemId } = useParams();
    const [gift, setGift] = useState(null);
    
    useEffect(() => {
        console.log('Item ID changed:', itemId);
        fetchItem(itemId);
    }, [itemId]); // Runs when itemId changes
    
    // When user navigates from /app/item/123 to /app/item/456:
    // 1. itemId changes from "123" to "456"
    // 2. useEffect runs
    // 3. fetchItem("456") is called
    // 4. setGift(data) updates state
    // 5. Component re-renders with new data
}
```

---

#### 3. Unmounting (Component Removed)

**What happens:**
1. Component is removed from DOM
2. `useEffect` cleanup functions run
3. All subscriptions/intervals are cleaned up

**Example:**
```javascript
function Navbar() {
    useEffect(() => {
        const interval = setInterval(() => {
            fetchUnread();
        }, 30000);
        
        console.log('Interval started');
        
        // Cleanup function
        return () => {
            console.log('Interval cleared');
            clearInterval(interval);
        };
    }, []);
    
    // When user navigates away:
    // 1. Component unmounts
    // 2. Cleanup function runs
    // 3. Interval is cleared
    // 4. No more API calls
}
```

---

## 📊 State Management

### sessionStorage Explained

**What it is:** Browser storage that persists only for the current tab session.

#### Saving Data

```javascript
// Save single value
sessionStorage.setItem('auth-token', 'abc123');
sessionStorage.setItem('name', 'John');
sessionStorage.setItem('role', 'user');

// Save object (must convert to string)
const user = { id: '123', name: 'John' };
sessionStorage.setItem('user', JSON.stringify(user));
```

#### Reading Data

```javascript
// Read single value
const token = sessionStorage.getItem('auth-token');
const name = sessionStorage.getItem('name');

// Read object (must parse)
const userStr = sessionStorage.getItem('user');
const user = JSON.parse(userStr);
```

#### Deleting Data

```javascript
// Delete single item
sessionStorage.removeItem('auth-token');

// Delete everything
sessionStorage.clear();
```

#### Real Example from LoginPage.js

```javascript
const handleLogin = async () => {
    const json = await res.json();
    
    if (json.authtoken) {
        // Save authentication data
        sessionStorage.setItem('auth-token', json.authtoken);
        sessionStorage.setItem('name', json.userName);
        sessionStorage.setItem('email', json.userEmail);
        sessionStorage.setItem('role', json.userRole);
        sessionStorage.setItem('user-id', json.userId);
        
        // Update Context
        setIsLoggedIn(true);
        setUserName(json.userName);
    }
};
```

#### Real Example from Navbar.js (Reading on Mount)

```javascript
useEffect(() => {
    // Read from sessionStorage when component mounts
    const authTokenFromSession = sessionStorage.getItem('auth-token');
    const nameFromSession = sessionStorage.getItem('name') || '';
    const roleFromSession = sessionStorage.getItem('role') || 'user';
    
    if (authTokenFromSession) {
        // Restore login state
        setIsLoggedIn(true);
        setUserName(nameFromSession);
        setUserRole(roleFromSession);
    } else {
        setIsLoggedIn(false);
    }
}, []);
```

---

## 🌐 API Calls - Complete Guide

### Basic Fetch Pattern

```javascript
const fetchData = async () => {
    const response = await fetch(url);
    const data = await response.json();
    return data;
};
```

### GET Request (No Auth)

**Real Example from MainPage.js:**
```javascript
const fetchItems = useCallback(async () => {
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
}, []);
```

**Step by step:**
1. `fetch()` makes HTTP request
2. `await` waits for response
3. `response.ok` checks if status is 200-299
4. `response.json()` parses JSON response
5. `setItems()` updates state
6. `catch` handles errors

---

### GET Request (With Auth)

**Real Example from Navbar.js:**
```javascript
const fetchUnread = async () => {
    const authToken = sessionStorage.getItem('auth-token');
    
    const res = await fetch(`${urlConfig.backendUrl}/api/notifications`, {
        headers: { 
            Authorization: `Bearer ${authToken}` 
        }
    });
    
    if (!res.ok) return;
    
    const items = await res.json();
    const unread = items.filter((n) => !n.readAt).length;
    setUnreadCount(unread);
};
```

**Key points:**
- Get token from `sessionStorage`
- Add `Authorization` header
- Format: `Bearer ${token}`

---

### POST Request (With Body)

**Real Example from LoginPage.js:**
```javascript
const handleLogin = async (e) => {
    e.preventDefault();
    
    const res = await fetch(`${urlConfig.backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            email: email,
            password: password,
        })
    });
    
    const json = await res.json();
    
    if (json.authtoken) {
        sessionStorage.setItem('auth-token', json.authtoken);
        navigate('/app');
    }
};
```

**Key points:**
- `method: 'POST'` specifies HTTP method
- `headers` includes Content-Type
- `body` contains data (must be JSON string)

---

### POST Request (With Auth)

**Real Example from MainPage.js:**
```javascript
const handleReserve = async (itemId) => {
    const token = sessionStorage.getItem('auth-token');
    
    try {
        const response = await fetch(
            `${urlConfig.backendUrl}/api/secondchance/items/${itemId}/reserve`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        
        if (!response.ok) {
            const errorJson = await response.json().catch(() => ({}));
            throw new Error(errorJson.error || 'Unable to reserve item');
        }
        
        const updatedItem = await response.json();
        setItems(prevItems =>
            prevItems.map(item => 
                item.id === updatedItem.id ? updatedItem : item
            )
        );
    } catch (error) {
        setErrorMessage(error.message);
    }
};
```

---

### Error Handling Patterns

#### Pattern 1: Basic Try/Catch

```javascript
try {
    const response = await fetch(url);
    const data = await response.json();
    setItems(data);
} catch (error) {
    setError(error.message);
}
```

#### Pattern 2: Check Response Status

```javascript
try {
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP error! ${response.status}`);
    }
    
    const data = await response.json();
    setItems(data);
} catch (error) {
    setError(error.message);
}
```

#### Pattern 3: Handle API Error Messages

```javascript
try {
    const response = await fetch(url);
    
    if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Request failed');
    }
    
    const data = await response.json();
    setItems(data);
} catch (error) {
    setError(error.message);
    setTimeout(() => setError(''), 4000); // Clear after 4 seconds
}
```

---

## 🧭 Routing - Complete Guide

### Route Definition

```javascript
// App.js
<Routes>
    <Route path="/" element={<MainPage />} />
    <Route path="/app/login" element={<LoginPage />} />
    <Route path="/app/item/:itemId" element={<DetailsPage />} />
</Routes>
```

**How it works:**
- `/` matches exactly `/`
- `/app/login` matches exactly `/app/login`
- `/app/item/:itemId` matches `/app/item/123`, `/app/item/456`, etc.
  - `:itemId` is a parameter

---

### Navigation Methods

#### Method 1: useNavigate Hook

```javascript
const navigate = useNavigate();
navigate('/app/login');
```

#### Method 2: Link Component

```javascript
import { Link } from 'react-router-dom';

<Link to="/app/login">Go to Login</Link>
```

**Real Example from Navbar.js:**
```javascript
<Link className="navbar-brand" to={`/app`}>
    SecondChance
</Link>

<Link className="nav-link" to="/app">Home</Link>
```

---

### URL Parameters

#### Getting Parameters

```javascript
// Route: /app/item/:itemId
// URL: /app/item/123

const { itemId } = useParams();
// itemId = "123"
```

#### Using Parameters

```javascript
function DetailsPage() {
    const { itemId } = useParams();
    
    useEffect(() => {
        fetch(`/api/items/${itemId}`);
    }, [itemId]);
}
```

---

## 🧩 Real Component Examples

### MainPage.js - Complete Breakdown

```javascript
function MainPage() {
    // ========== STATE ==========
    const [items, setItems] = useState([]);              // Items to display
    const [searchQuery, setSearchQuery] = useState('');  // Search input
    const [selectedCategory, setSelectedCategory] = useState(''); // Filter
    const [errorMessage, setErrorMessage] = useState(''); // Errors
    
    // ========== HOOKS ==========
    const navigate = useNavigate();                      // Navigation
    const { isLoggedIn } = useAppContext();             // Global state
    
    // ========== FUNCTIONS ==========
    
    // Load items on mount
    const fetchItems = useCallback(async () => {
        try {
            const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items`);
            const data = await response.json();
            setItems(data);
        } catch (error) {
            setErrorMessage(error.message);
        }
    }, []);
    
    // Search items
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
    
    // Reserve item
    const handleReserve = async (itemId) => {
        if (!isLoggedIn) {
            navigate('/app/login');
            return;
        }
        
        const token = sessionStorage.getItem('auth-token');
        const response = await fetch(
            `${urlConfig.backendUrl}/api/secondchance/items/${itemId}/reserve`,
            {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        const updatedItem = await response.json();
        setItems(prevItems =>
            prevItems.map(item => 
                item.id === updatedItem.id ? updatedItem : item
            )
        );
    };
    
    // Navigate to details
    const goToDetailsPage = (itemId) => {
        navigate(`/app/item/${itemId}`);
    };
    
    // ========== EFFECTS ==========
    useEffect(() => {
        fetchItems(); // Load items when component mounts
    }, [fetchItems]);
    
    // ========== RENDER ==========
    return (
        <div>
            {/* Search form */}
            <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {/* Items list */}
            {items.map(item => (
                <div key={item.id}>
                    <h3>{item.name}</h3>
                    <button onClick={() => goToDetailsPage(item.id)}>
                        View Details
                    </button>
                    <button onClick={() => handleReserve(item.id)}>
                        Reserve
                    </button>
                </div>
            ))}
        </div>
    );
}
```

---

### LoginPage.js - Complete Breakdown

```javascript
function LoginPage() {
    // ========== STATE ==========
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [incorrect, setIncorrect] = useState('');
    
    // ========== HOOKS ==========
    const navigate = useNavigate();
    const { setIsLoggedIn, setUserName, setUserRole } = useAppContext();
    
    // ========== EFFECTS ==========
    useEffect(() => {
        // Redirect if already logged in
        if (sessionStorage.getItem('auth-token')) {
            navigate('/app');
        }
    }, [navigate]);
    
    // ========== HANDLERS ==========
    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent form submission
        
        // API call
        const res = await fetch(`${urlConfig.backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
            })
        });
        
        const json = await res.json();
        
        if (json.authtoken) {
            // Save to sessionStorage
            sessionStorage.setItem('auth-token', json.authtoken);
            sessionStorage.setItem('name', json.userName);
            sessionStorage.setItem('role', json.userRole);
            
            // Update Context
            setIsLoggedIn(true);
            setUserName(json.userName);
            setUserRole(json.userRole);
            
            // Navigate to home
            navigate('/app');
        } else {
            setIncorrect('Wrong password. Try again.');
            setTimeout(() => setIncorrect(''), 2000);
        }
    };
    
    // ========== RENDER ==========
    return (
        <form onSubmit={handleLogin}>
            <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />
            {incorrect && <p style={{color: 'red'}}>{incorrect}</p>}
            <button type="submit">Login</button>
        </form>
    );
}
```

---

### DetailsPage.js - Complete Breakdown

```javascript
function DetailsPage() {
    // ========== GET URL PARAMETER ==========
    const { itemId } = useParams(); // Gets itemId from URL
    
    // ========== STATE ==========
    const [gift, setGift] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [chatModal, setChatModal] = useState({ open: false, chatId: null });
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    // ========== HOOKS ==========
    const navigate = useNavigate();
    const { isLoggedIn, currentUserId } = useAppContext();
    
    // ========== EFFECTS ==========
    
    // Effect 1: Redirect if not logged in
    useEffect(() => {
        if (!isLoggedIn) {
            navigate('/app/login');
        }
    }, [isLoggedIn, navigate]);
    
    // Effect 2: Fetch item data
    useEffect(() => {
        const fetchItem = async () => {
            try {
                const response = await fetch(
                    `${urlConfig.backendUrl}/api/secondchance/items/${itemId}`
                );
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setGift(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        
        fetchItem();
    }, [itemId]); // Re-run when itemId changes
    
    // Effect 3: Fetch secure data (if logged in)
    useEffect(() => {
        const fetchSecure = async () => {
            if (!isLoggedIn) return;
            
            const token = sessionStorage.getItem('auth-token');
            const response = await fetch(
                `${urlConfig.backendUrl}/api/secondchance/items/${itemId}/secure`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            const data = await response.json();
            setSecureData(data);
        };
        
        fetchSecure();
    }, [itemId, isLoggedIn]);
    
    // ========== HANDLERS ==========
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
    
    // ========== RENDER ==========
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!gift) return <div>Item not found</div>;
    
    return (
        <div>
            <h1>{gift.name}</h1>
            <p>Price: ${gift.price}</p>
            <button onClick={handleOpenChat}>Chat with Seller</button>
            {chatModal.open && (
                <ChatModal 
                    chatId={chatModal.chatId}
                    onClose={() => setChatModal({ open: false, chatId: null })}
                />
            )}
        </div>
    );
}
```

---

## 🔄 Common Patterns

### Pattern 1: Loading State

```javascript
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(url);
            const data = await response.json();
            setData(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
}, []);

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;
return <div>{data}</div>;
```

### Pattern 2: Controlled Input

```javascript
const [email, setEmail] = useState('');

<input
    type="text"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
/>
```

### Pattern 3: Update Array State

```javascript
// Add item
setItems([...items, newItem]);

// Update item
setItems(items.map(item => 
    item.id === itemId ? updatedItem : item
));

// Remove item
setItems(items.filter(item => item.id !== itemId));
```

### Pattern 4: Conditional Rendering

```javascript
{isLoggedIn ? (
    <LoggedInView />
) : (
    <LoggedOutView />
)}

{items.length > 0 && (
    <ItemsList items={items} />
)}

{error && (
    <ErrorMessage message={error} />
)}
```

---

**This guide covers everything you need to know! Good luck! 🎉**

