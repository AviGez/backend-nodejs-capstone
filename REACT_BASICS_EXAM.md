# ⚛️ React Basics - מדריך מהיר למבחן

## 📋 מה זה React?

React היא ספרייה ליצירת ממשקי משתמש (UI) באמצעות **Components** - רכיבים שניתן לשימוש חוזר.

---

## 🧩 1. Component - רכיב

### מה זה?
Component הוא **פונקציה JavaScript** שמחזירה **JSX** (HTML-like syntax).

### דוגמה בסיסית:
```javascript
function Welcome() {
    return <h1>Hello World!</h1>;
}
```

### דוגמה מהפרויקט (LoginPage.js):
```javascript
function LoginPage() {
    return (
        <div className="container">
            <h2>Login</h2>
            <input type="text" />
            <button>Login</button>
        </div>
    );
}
```

---

## 📝 2. JSX - JavaScript XML

### מה זה?
JSX מאפשר לכתוב HTML בתוך JavaScript.

### כללים חשובים:
1. **חייב להיות element אחד עליון:**
```javascript
// ✅ נכון
return (
    <div>
        <h1>Title</h1>
        <p>Text</p>
    </div>
);

// ❌ שגוי - שני elements עליונים
return (
    <h1>Title</h1>
    <p>Text</p>
);
```

2. **JavaScript expressions בתוך `{}`:**
```javascript
const name = "John";
return <h1>Hello {name}</h1>;  // Hello John

const age = 25;
return <p>Age: {age + 1}</p>;  // Age: 26
```

3. **className במקום class:**
```javascript
// ✅ נכון
<div className="container">

// ❌ שגוי
<div class="container">
```

---

## 🎁 3. Props - העברת נתונים

### מה זה?
Props הם **נתונים** שמועברים מ-Component אחד לאחר.

### דוגמה:
```javascript
// Parent Component
function App() {
    return <Welcome name="John" age={25} />;
}

// Child Component
function Welcome(props) {
    return (
        <div>
            <h1>Hello {props.name}!</h1>
            <p>You are {props.age} years old</p>
        </div>
    );
}

// או עם destructuring:
function Welcome({ name, age }) {
    return (
        <div>
            <h1>Hello {name}!</h1>
            <p>You are {age} years old</p>
        </div>
    );
}
```

---

## 🔄 4. State - useState

### מה זה?
State הוא **נתונים שמשתנים** במהלך חיי ה-Component.

### Syntax:
```javascript
const [variableName, setVariableName] = useState(initialValue);
```

### דוגמה בסיסית:
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

### דוגמה מהפרויקט (LoginPage.js):
```javascript
function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    return (
        <div>
            <input 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
        </div>
    );
}
```

### כללים חשובים:
- **אל תשנה state ישירות:**
```javascript
// ❌ שגוי
count = count + 1;

// ✅ נכון
setCount(count + 1);
```

- **עדכון state תלוי ב-state הקודם:**
```javascript
// ✅ נכון
setCount(prevCount => prevCount + 1);
```

---

## ⚡ 5. useEffect - Side Effects

### מה זה?
useEffect מבצע **פעולות צד** (API calls, subscriptions, וכו') אחרי render.

### Syntax:
```javascript
useEffect(() => {
    // Code to run
}, [dependencies]);
```

### דוגמאות:

#### 1. Run once on mount:
```javascript
useEffect(() => {
    fetchData();
}, []); // Empty array = run once
```

#### 2. Run when dependency changes:
```javascript
useEffect(() => {
    fetchItem(itemId);
}, [itemId]); // Runs when itemId changes
```

#### 3. Cleanup on unmount:
```javascript
useEffect(() => {
    const interval = setInterval(() => {
        fetchData();
    }, 1000);
    
    return () => clearInterval(interval); // Cleanup
}, []);
```

### דוגמה מהפרויקט (MainPage.js):
```javascript
function MainPage() {
    const [items, setItems] = useState([]);
    
    useEffect(() => {
        fetchItems();
    }, []); // Load items once when component mounts
    
    const fetchItems = async () => {
        const response = await fetch('/api/items');
        const data = await response.json();
        setItems(data);
    };
}
```

---

## 🎯 6. Event Handlers - טיפול באירועים

### דוגמה בסיסית:
```javascript
function Button() {
    const handleClick = () => {
        console.log('Clicked!');
    };
    
    return <button onClick={handleClick}>Click me</button>;
}
```

### דוגמה עם פרמטרים:
```javascript
function ItemList() {
    const handleReserve = (itemId) => {
        console.log('Reserving item:', itemId);
    };
    
    return (
        <div>
            {items.map(item => (
                <button onClick={() => handleReserve(item.id)}>
                    Reserve {item.name}
                </button>
            ))}
        </div>
    );
}
```

### דוגמה מהפרויקט (LoginPage.js):
```javascript
function LoginPage() {
    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent form submission
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    };
    
    return (
        <form onSubmit={handleLogin}>
            <button type="submit">Login</button>
        </form>
    );
}
```

---

## 🔀 7. Conditional Rendering - רינדור מותנה

### שיטה 1: if/else
```javascript
function Welcome({ isLoggedIn }) {
    if (isLoggedIn) {
        return <h1>Welcome back!</h1>;
    } else {
        return <h1>Please login</h1>;
    }
}
```

### שיטה 2: Ternary Operator (?:)
```javascript
function Welcome({ isLoggedIn }) {
    return (
        <div>
            {isLoggedIn ? (
                <h1>Welcome back!</h1>
            ) : (
                <h1>Please login</h1>
            )}
        </div>
    );
}
```

### שיטה 3: Logical AND (&&)
```javascript
function Welcome({ isLoggedIn }) {
    return (
        <div>
            {isLoggedIn && <h1>Welcome back!</h1>}
        </div>
    );
}
```

### דוגמה מהפרויקט (Navbar.js):
```javascript
{isLoggedIn ? (
    <>
        <span>Hello {userName}</span>
        <button onClick={handleLogout}>Logout</button>
    </>
) : (
    <>
        <Link to="/app/login">Login</Link>
        <Link to="/app/register">Register</Link>
    </>
)}
```

---

## 📋 8. Lists & Keys - רשימות ומפתחות

### דוגמה בסיסית:
```javascript
function ItemList() {
    const items = ['Apple', 'Banana', 'Orange'];
    
    return (
        <ul>
            {items.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </ul>
    );
}
```

### דוגמה עם objects:
```javascript
function ItemList() {
    const items = [
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Banana' },
    ];
    
    return (
        <div>
            {items.map(item => (
                <div key={item.id}>
                    <h3>{item.name}</h3>
                </div>
            ))}
        </div>
    );
}
```

### דוגמה מהפרויקט (MainPage.js):
```javascript
function MainPage() {
    const [items, setItems] = useState([]);
    
    return (
        <div>
            {items.map(item => (
                <div key={item.id}>
                    <h3>{item.name}</h3>
                    <p>Price: ${item.price}</p>
                </div>
            ))}
        </div>
    );
}
```

### כללים חשובים:
- **תמיד צריך `key` ב-lists**
- **`key` צריך להיות unique**
- **אל תשתמש ב-index כ-key אם הרשימה משתנה**

---

## 📝 9. Forms - טפסים

### Controlled Components:
```javascript
function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({ email, password });
    };
    
    return (
        <form onSubmit={handleSubmit}>
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
            <button type="submit">Login</button>
        </form>
    );
}
```

### דוגמה מהפרויקט (LoginPage.js):
```javascript
function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const handleLogin = async (e) => {
        e.preventDefault();
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
    };
    
    return (
        <form onSubmit={handleLogin}>
            <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Login</button>
        </form>
    );
}
```

---

## 🎣 10. Hooks נוספים

### useContext - גישה ל-Context
```javascript
import { useAppContext } from '../../context/AppContext';

function MyComponent() {
    const { isLoggedIn, userName } = useAppContext();
    
    return <div>Hello {userName}</div>;
}
```

### useNavigate - ניווט
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

### useParams - פרמטרים מה-URL
```javascript
import { useParams } from 'react-router-dom';

function DetailsPage() {
    const { itemId } = useParams();
    // URL: /app/item/123 → itemId = "123"
    
    return <div>Item ID: {itemId}</div>;
}
```

---

## 📚 שאלות נפוצות במבחן

### 1. מה ההבדל בין Props ל-State?
- **Props**: נתונים שמועברים מ-Parent ל-Child (read-only)
- **State**: נתונים מקומיים של Component (mutable)

### 2. מה זה JSX?
- JavaScript XML - HTML-like syntax בתוך JavaScript
- React ממיר JSX ל-JavaScript

### 3. מה זה Component?
- פונקציה JavaScript שמחזירה JSX
- ניתן לשימוש חוזר

### 4. מה זה useState?
- Hook לניהול state מקומי ב-Component
- מחזיר [value, setValue]

### 5. מה זה useEffect?
- Hook לביצוע side effects (API calls, subscriptions)
- רץ אחרי render

### 6. מה זה Key ב-Lists?
- מזהה ייחודי לכל item ב-list
- עוזר ל-React לעדכן רק את מה שצריך

### 7. מה זה Controlled Component?
- Component שהערך שלו נשלט על ידי React state
- `value={state}` + `onChange={(e) => setState(e.target.value)}`

### 8. מה זה Event Handler?
- פונקציה שמטפלת באירוע (click, submit, וכו')
- `onClick={handleClick}`

---

## ✅ Checklist למבחן

- [ ] יודע מה זה Component
- [ ] יודע מה זה JSX
- [ ] יודע מה זה Props
- [ ] יודע מה זה State (useState)
- [ ] יודע מה זה useEffect
- [ ] יודע לכתוב Event Handler
- [ ] יודע Conditional Rendering
- [ ] יודע Lists & Keys
- [ ] יודע Forms (Controlled Components)
- [ ] יודע useNavigate, useParams, useContext

---

## 🎯 טיפים למבחן

1. **תמיד התחל עם Component:**
```javascript
function MyComponent() {
    return <div>...</div>;
}
```

2. **State תמיד עם useState:**
```javascript
const [value, setValue] = useState(initialValue);
```

3. **Event Handlers תמיד עם arrow functions:**
```javascript
onClick={() => handleClick()}
```

4. **Lists תמיד עם key:**
```javascript
{items.map(item => <div key={item.id}>...</div>)}
```

5. **Forms תמיד עם preventDefault:**
```javascript
const handleSubmit = (e) => {
    e.preventDefault();
    // ...
};
```

---

## 📖 דוגמאות מהפרויקט

### LoginPage.js - Component מלא:
```javascript
function LoginPage() {
    // State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Event Handler
    const handleLogin = async (e) => {
        e.preventDefault();
        // API call
    };
    
    // JSX
    return (
        <form onSubmit={handleLogin}>
            <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit">Login</button>
        </form>
    );
}
```

### MainPage.js - List & State:
```javascript
function MainPage() {
    const [items, setItems] = useState([]);
    
    useEffect(() => {
        fetchItems();
    }, []);
    
    return (
        <div>
            {items.map(item => (
                <div key={item.id}>
                    <h3>{item.name}</h3>
                </div>
            ))}
        </div>
    );
}
```

---

**Good luck on your exam! 🎉**

