# Frontend Summary - SecondChance Application

## 📋 Table of Contents
1. [General Structure](#general-structure)
2. [Main Technologies](#main-technologies)
3. [File Structure](#file-structure)
4. [Routing](#routing)
5. [State Management](#state-management)
6. [Components](#components)
7. [API Integration](#api-integration)
8. [WebSocket (Real-time Chat)](#websocket-real-time-chat)
9. [Styling & Theming](#styling--theming)
10. [Key Features](#key-features)

---

## 🏗️ General Structure

The frontend is built on **React 18** with **React Router** for navigation and uses **Context API** for global state management.

### Entry Point: `src/index.js`
- Initializes React app
- Sets up BrowserRouter
- Renders App component

### Main App: `src/App.js`
- Defines all routes
- Wraps app with AppProvider (Context)
- Contains Navbar and Footer (global components)
- Main routing configuration

---

## 🛠️ Main Technologies

### Dependencies:
- **react** (^18.2.0) - UI library
- **react-dom** (^18.2.0) - DOM rendering
- **react-router-dom** (^6.20.1) - Client-side routing
- **socket.io-client** (^4.7.2) - Real-time WebSocket communication
- **bootstrap** (^5.3.2) - CSS framework
- **react-bootstrap** (^2.9.2) - React components for Bootstrap
- **react-datepicker** (^4.24.0) - Date picker component

### Build Tools:
- **react-scripts** (5.0.1) - Create React App (CRA)
- Webpack, Babel configured automatically

---

## 📁 File Structure

```
secondChance-frontend/
├── public/
│   ├── index.html              # HTML template
│   └── static/                 # Static assets
│
├── src/
│   ├── index.js                # Entry point
│   ├── App.js                  # Main app component & routes
│   ├── App.css                 # Global styles & CSS variables
│   ├── index.css               # Base styles
│   │
│   ├── config.js               # Configuration (backend URL)
│   │
│   ├── context/
│   │   └── AppContext.js       # Global state management
│   │
│   └── components/
│       ├── Navbar/             # Navigation bar
│       ├── Footer/             # Footer component
│       ├── MainPage/           # Home page
│       ├── LoginPage/          # Login form
│       ├── RegisterPage/       # Registration form
│       ├── DetailsPage/        # Item details page
│       ├── ItemPage/           # Add/Edit item form
│       ├── Profile/            # User profile page
│       ├── AdminPanel/         # Admin dashboard
│       ├── SearchPage/         # Search results
│       ├── ChatModal/          # Chat interface
│       ├── Notifications/      # Notifications dropdown
│       ├── MyReservations/     # User's reservations
│       ├── NewArrivalsCarousel/ # Featured items carousel
│       └── ...                 # Other components
```

---

## 🛣️ Routing

### Routes Configuration (`App.js`):

```javascript
<Routes>
  <Route path="/" element={<MainPage />} />
  <Route path="/app" element={<MainPage />} />
  <Route path="/app/profile" element={<Profile />} />
  <Route path="/app/item/:itemId" element={<DetailsPage />} />
  <Route path="/app/login" element={<LoginPage />} />
  <Route path="/app/register" element={<RegisterPage />} />
  <Route path="/app/addItem" element={<ItemPage />} />
  <Route path="/app/admin" element={<AdminPanel />} />
  <Route path="/app/reservations" element={<MyReservations />} />
</Routes>
```

### Route Details:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` or `/app` | MainPage | Home page with item listings |
| `/app/item/:itemId` | DetailsPage | View item details |
| `/app/login` | LoginPage | User login |
| `/app/register` | RegisterPage | User registration |
| `/app/addItem` | ItemPage | Create new item |
| `/app/profile` | Profile | User profile page |
| `/app/admin` | AdminPanel | Admin dashboard |
| `/app/reservations` | MyReservations | User's reserved items |

---

## 🔄 State Management

### Context API: `src/context/AppContext.js`

**Global State:**
- `isLoggedIn` - Authentication status
- `userName` - Current user's name
- `userRole` - User role ('user' or 'admin')
- `currentUserId` - Current user's ID

**Session Storage:**
- `auth-token` - JWT token
- `name` - User name
- `role` - User role
- `user-id` - User ID
- `email` - User email

**Usage:**
```javascript
import { useAppContext } from '../../context/AppContext';

const { isLoggedIn, userName, userRole, setUserName } = useAppContext();
```

**AppProvider:**
- Wraps entire app in `App.js`
- Provides global state to all components
- Initializes state from sessionStorage

---

## 🧩 Components

### 1. Navbar (`components/Navbar/`)
- **Purpose**: Main navigation bar
- **Features**:
  - Brand logo and title
  - Navigation links (Home, Admin Panel)
  - User greeting (when logged in)
  - Login/Join buttons (when not logged in)
  - Logout button
  - Notifications bell icon with unread count
  - Theme toggle button
- **State**: Reads from AppContext

### 2. MainPage (`components/MainPage/`)
- **Purpose**: Home page with item listings
- **Features**:
  - Hero section with search
  - New arrivals carousel
  - Item cards grid
  - Search functionality
  - Filter by category
- **API**: GET `/api/secondchance/items`, GET `/api/secondchance/items/carousel`

### 3. DetailsPage (`components/DetailsPage/`)
- **Purpose**: Display item details
- **Features**:
  - Item images gallery
  - Item information (name, category, condition, price)
  - Description
  - Pickup locations (if approved)
  - Reserve button
  - Request approval button (for paid items)
  - Chat button
  - Seller information
- **API**: GET `/api/secondchance/items/:id`, POST `/api/secondchance/items/:id/reserve`

### 4. ItemPage (`components/ItemPage/`)
- **Purpose**: Create new item
- **Features**:
  - Form with fields: name, category, condition, description, price
  - Image upload (up to 5 images, FormData)
  - City and area selection
  - Pickup location configuration
  - Shipping options
- **API**: POST `/api/secondchance/items` (with FormData)
- **File Upload**: Uses FormData with `images` field

### 5. LoginPage (`components/LoginPage/`)
- **Purpose**: User authentication
- **Features**:
  - Email and password form
  - Error handling
  - Redirects to home after login
- **API**: POST `/api/auth/login`
- **Storage**: Saves token to sessionStorage

### 6. RegisterPage (`components/RegisterPage/`)
- **Purpose**: User registration
- **Features**:
  - Registration form (email, password, firstName, lastName)
  - Validation
  - Redirects to home after registration
- **API**: POST `/api/auth/register`

### 7. Profile (`components/Profile/`)
- **Purpose**: User profile page
- **Features**:
  - Display user information
  - List user's items
  - Edit/Delete items
- **API**: GET `/api/secondchance/items/mine`

### 8. AdminPanel (`components/AdminPanel/`)
- **Purpose**: Admin dashboard
- **Features**:
  - Statistics (total users, items, etc.)
  - Item management
  - User management
- **API**: GET `/api/secondchance/items/admin/stats`, GET `/api/secondchance/items/admin/all`

### 9. ChatModal (`components/ChatModal/`)
- **Purpose**: Real-time chat interface
- **Features**:
  - Display messages
  - Send messages (WebSocket)
  - Auto-scroll to bottom
  - Optimistic UI updates
- **WebSocket**: Uses socket.io-client
- **API**: GET `/api/chats/:chatId/messages` (for initial load)

### 10. Notifications (`components/Notifications/`)
- **Purpose**: Display user notifications
- **Features**:
  - List notifications
  - Mark as read
  - Delete notifications
  - Notification preferences
- **API**: GET `/api/notifications`, POST `/api/notifications/mark-read`

### 11. SearchPage (`components/SearchPage/`)
- **Purpose**: Search results page
- **Features**:
  - Search by name, category, city, area
  - Filter results
- **API**: GET `/api/secondchance/search`

### 12. MyReservations (`components/MyReservations/`)
- **Purpose**: Display user's reservations
- **Features**:
  - List reserved items
  - Reservation countdown
- **API**: GET `/api/secondchance/items/reservations/me`

### 13. Footer (`components/Footer/`)
- **Purpose**: Site footer
- **Features**: Links and copyright information

### 14. NewArrivalsCarousel (`components/NewArrivalsCarousel/`)
- **Purpose**: Featured items carousel
- **Features**: Displays recent items in a carousel
- **API**: GET `/api/secondchance/items/carousel`

---

## 🔌 API Integration

### Configuration: `src/config.js`

```javascript
const config = {
  backendUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3060'
};
```

### API Calls Pattern:

**1. Authentication Headers:**
```javascript
const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${sessionStorage.getItem('auth-token')}`
});
```

**2. Fetch Pattern:**
```javascript
const response = await fetch(`${urlConfig.backendUrl}/api/endpoint`, {
  method: 'POST',
  headers: authHeaders(),
  body: JSON.stringify(data)
});
```

**3. File Upload (FormData):**
```javascript
const formData = new FormData();
formData.append('images', file);
formData.append('name', name);
// ...

const response = await fetch(`${urlConfig.backendUrl}/api/secondchance/items`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Don't set Content-Type - browser sets it automatically for FormData
  },
  body: formData
});
```

### Main API Endpoints Used:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/secondchance/items` | GET | Get all items |
| `/api/secondchance/items` | POST | Create item (FormData) |
| `/api/secondchance/items/:id` | GET | Get item by ID |
| `/api/secondchance/items/:id/reserve` | POST | Reserve item |
| `/api/secondchance/items/carousel` | GET | Get carousel items |
| `/api/secondchance/items/mine` | GET | Get user's items |
| `/api/secondchance/items/admin/stats` | GET | Admin statistics |
| `/api/chats/:itemId` | POST | Create chat |
| `/api/chats/:chatId/messages` | GET | Get messages |
| `/api/notifications` | GET | Get notifications |
| `/api/notifications/mark-read` | POST | Mark as read |

---

## 🔌 WebSocket (Real-time Chat)

### Socket.io Client Integration

**Setup** (`ChatModal.js`):
```javascript
import { io } from 'socket.io-client';

const socket = io(urlConfig.backendUrl, {
  auth: { token: sessionStorage.getItem('auth-token') }
});
```

**Events:**

1. **join_chat** (emit):
   ```javascript
   socket.emit('join_chat', { chatId });
   ```

2. **send_message** (emit):
   ```javascript
   socket.emit('send_message', { chatId, content: message });
   ```

3. **new_message** (listen):
   ```javascript
   socket.on('new_message', (message) => {
     setMessages(prev => [...prev, message]);
   });
   ```

4. **error** (listen):
   ```javascript
   socket.on('error', (err) => {
     setError(err.message);
   });
   ```

**Cleanup:**
```javascript
useEffect(() => {
  // Setup socket...
  
  return () => {
    socket.disconnect();
  };
}, [chatId]);
```

---

## 🎨 Styling & Theming

### CSS Variables (`App.css`)

**Color System:**
```css
:root {
  --bg-base: #050915;
  --bg-card: rgba(12, 19, 32, 0.9);
  --text-primary: #f8fafc;
  --text-muted: #d1d9ff;
  --accent: #38bdf8;
  --border-color: rgba(148, 163, 184, 0.2);
  --shadow-strong: 0 35px 80px rgba(2, 6, 23, 0.55);
}
```

**Design System:**
- Dark theme with blue accents
- Glassmorphic cards (backdrop-filter, transparency)
- Smooth gradients
- Modern rounded corners (--card-radius: 24px)
- Strong shadows for depth

**Styling Approach:**
- CSS Modules: Each component has its own `.css` file
- CSS Variables: Global theme variables in `App.css`
- Bootstrap: Used for some components (modals, alerts)
- Responsive: Media queries for mobile/tablet/desktop

**Component Styling:**
- Each component folder contains `.css` file
- Scoped styles (component-specific)
- Uses CSS variables for consistency

---

## 🎯 Key Features

### 1. Authentication Flow
1. User registers/logs in
2. Token saved to sessionStorage
3. AppContext updates `isLoggedIn` state
4. Protected routes check authentication
5. Navbar shows user info

### 2. Item Management
- **Create**: Form with image upload (FormData)
- **View**: Details page with gallery
- **Reserve**: 10-hour reservation system
- **Search**: Filter by category, city, area

### 3. Real-time Chat
- WebSocket connection per chat
- Optimistic UI updates
- Auto-scroll to latest message
- Error handling

### 4. Notifications System
- Bell icon with unread count
- Dropdown with notifications list
- Mark as read / Delete
- Preferences management

### 5. Admin Panel
- Statistics dashboard
- Item management
- User management (admin only)

### 6. Image Upload
- Multi-image upload (up to 5)
- FormData format
- Preview before upload
- Image gallery display

### 7. Responsive Design
- Mobile-friendly
- Adaptive layouts
- Touch-friendly interactions

---

## 📝 Important Code Patterns

### Protected Routes:
```javascript
useEffect(() => {
  if (!isLoggedIn) {
    navigate('/app/login');
  }
}, [isLoggedIn, navigate]);
```

### API Call with Error Handling:
```javascript
try {
  const response = await fetch(url, { headers: authHeaders() });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  const data = await response.json();
  // Handle success
} catch (error) {
  // Handle error
  setError(error.message);
}
```

### FormData Upload:
```javascript
const formData = new FormData();
files.forEach(file => formData.append('images', file));
formData.append('name', name);
// ... other fields

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### WebSocket Hook Pattern:
```javascript
useEffect(() => {
  const socket = io(url, { auth: { token } });
  
  socket.on('event', handler);
  socket.emit('event', data);
  
  return () => socket.disconnect();
}, [dependencies]);
```

---

## 🚀 Running

```bash
# Development
npm start          # Runs on http://localhost:3000

# Build for production
npm run build      # Creates optimized build in /build

# Test
npm test
```

**Environment Variables:**
- `REACT_APP_BACKEND_URL` - Backend API URL (default: `http://localhost:3060`)

---

## 🔄 Key Data Flows

### Login Flow:
```
User submits form → POST /api/auth/login
  → Receive token → Save to sessionStorage
  → Update AppContext → Navbar updates
  → Navigate to home
```

### Item Creation Flow:
```
User fills form → Select images → Create FormData
  → POST /api/secondchance/items (FormData)
  → Receive created item → Navigate to details page
```

### Chat Flow:
```
Click chat button → POST /api/chats/:itemId → Get chatId
  → Open ChatModal → Connect WebSocket
  → Join chat room → Load messages (REST)
  → Send/receive messages (WebSocket)
```

### Reservation Flow:
```
Click reserve → POST /api/secondchance/items/:id/reserve
  → Update UI → Show reservation status
  → Timer counts down (10 hours)
```

---

## 🛡️ Security & Best Practices

1. **Authentication**: Token stored in sessionStorage (not localStorage for better security)
2. **Protected Routes**: Check `isLoggedIn` before rendering
3. **Error Handling**: Try-catch blocks, user-friendly error messages
4. **Input Validation**: Form validation before submission
5. **Optimistic UI**: Update UI immediately, sync with server response
6. **Cleanup**: Disconnect WebSocket on component unmount
7. **Environment Variables**: Sensitive URLs in `.env` file

---

## 📊 Component Hierarchy

```
App (AppProvider)
├── Navbar
│   └── Notifications (dropdown)
├── Routes
│   ├── MainPage
│   │   └── NewArrivalsCarousel
│   ├── DetailsPage
│   │   └── ChatModal
│   ├── ItemPage
│   ├── Profile
│   ├── AdminPanel
│   ├── LoginPage
│   ├── RegisterPage
│   ├── SearchPage
│   └── MyReservations
└── Footer
```

---

## 🎯 Important Points for Exam

1. **React Router**: Client-side routing with React Router v6
2. **Context API**: Global state management (AppContext)
3. **Hooks**: useState, useEffect, useRef, useCallback, useContext
4. **WebSocket**: Real-time chat with socket.io-client
5. **File Upload**: FormData for multi-image upload
6. **Session Storage**: Token and user data persistence
7. **API Integration**: Fetch API with authentication headers
8. **Error Handling**: Try-catch, error states
9. **Responsive Design**: CSS variables, media queries
10. **Component Lifecycle**: useEffect cleanup functions

---

## 📚 Component Communication

- **Props**: Parent → Child
- **Context**: Global state (AppContext)
- **Session Storage**: Persistence across refreshes
- **React Router**: Navigation and URL params
- **WebSocket**: Real-time updates
- **API**: Server communication

---

This summary covers all the essential aspects of the frontend for your exam preparation!

