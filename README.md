# SecondChance Marketplace

A full-stack marketplace application for buying and selling second-hand items. Built with React frontend, Node.js/Express backend, and MongoDB database.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Running the Application](#running-the-application)
8. [API Endpoints](#api-endpoints)
9. [Database](#database)
10. [Development](#development)

---

## 🎯 Overview

SecondChance is a marketplace platform where users can:
- Post second-hand items for sale
- Browse and search available items
- Reserve items (10-hour reservation system)
- Chat with sellers/buyers in real-time
- Receive notifications for relevant items
- Manage pickup approvals for paid items

The application consists of:
- **Frontend**: React 18 application with React Router
- **Backend**: Node.js/Express REST API with WebSocket support
- **Database**: MongoDB for data persistence
- **Real-time**: Socket.io for chat functionality

---

## ✨ Features

### User Features
- 🔐 User authentication (JWT-based)
- 📦 Item listing with multiple images
- 🔍 Advanced search and filtering
- ⏰ Item reservation system (10-hour timer)
- 💬 Real-time chat between buyers and sellers
- 🔔 Notification system with preferences
- 👤 User profiles
- 📍 Pickup location management
- 🛒 My Reservations page

### Admin Features
- 📊 Admin dashboard with statistics
- 👥 User management
- 📦 Item management
- 🗑️ Item deletion with admin override

### Technical Features
- 🖼️ Multi-image upload (up to 5 images per item)
- 🎨 Dark theme UI with glassmorphic design
- 📱 Responsive design (mobile-friendly)
- 🔄 Real-time updates via WebSocket
- 🔒 Secure authentication and authorization
- 🐳 Docker support for easy deployment

---

## 🛠️ Tech Stack

### Frontend
- **React** 18.2.0 - UI library
- **React Router** 6.20.1 - Client-side routing
- **Socket.io Client** 4.7.2 - Real-time communication
- **Bootstrap** 5.3.2 - CSS framework
- **React Bootstrap** 2.9.2 - React components

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Socket.io** - WebSocket server
- **JWT** (jsonwebtoken) - Authentication
- **Bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Pino** - Logging

### Infrastructure
- **Docker** & **Docker Compose** - Containerization
- **MongoDB** 6 - Database container

---

## 📁 Project Structure

```
backend-nodejs-capstone/
├── secondChance-backend/          # Backend application
│   ├── app.js                     # Main entry point
│   ├── socket.js                  # WebSocket configuration
│   ├── logger.js                  # Logging setup
│   ├── models/                    # Database models
│   │   ├── db.js                  # MongoDB connection
│   │   └── baseModel.js           # Utility functions
│   ├── middleware/                # Express middleware
│   │   └── auth.js                # Authentication & authorization
│   ├── routes/                    # API routes
│   │   ├── authRoutes.js          # Authentication routes
│   │   ├── secondChanceItemsRoutes.js  # Main items router
│   │   ├── items/                 # Item routes (refactored)
│   │   │   ├── items.routes.js    # Basic CRUD
│   │   │   ├── reservations.routes.js
│   │   │   ├── approvals.routes.js
│   │   │   ├── carousel.routes.js
│   │   │   ├── admin.routes.js
│   │   │   └── pickup.routes.js
│   │   ├── utils/                 # Route utilities
│   │   ├── chatRoutes.js          # Chat routes
│   │   ├── notificationsRoutes.js # Notifications
│   │   └── searchRoutes.js        # Search functionality
│   ├── services/                  # Business logic
│   │   └── reservations.js        # Reservation service
│   └── public/images/             # Uploaded images
│
├── secondChance-frontend/         # Frontend application
│   ├── src/
│   │   ├── App.js                 # Main app component
│   │   ├── App.css                # Global styles
│   │   ├── index.js               # Entry point
│   │   ├── config.js              # Configuration
│   │   ├── context/               # React Context
│   │   │   └── AppContext.js      # Global state
│   │   └── components/            # React components
│   │       ├── Navbar/            # Navigation bar
│   │       ├── MainPage/          # Home page
│   │       ├── DetailsPage/       # Item details
│   │       ├── ItemPage/          # Add/edit item
│   │       ├── LoginPage/         # Login form
│   │       ├── RegisterPage/      # Registration
│   │       ├── Profile/           # User profile
│   │       ├── AdminPanel/        # Admin dashboard
│   │       ├── ChatModal/         # Chat interface
│   │       ├── Notifications/     # Notifications
│   │       ├── SearchPage/        # Search results
│   │       ├── MyReservations/    # User reservations
│   │       ├── NewArrivalsCarousel/ # Featured items
│   │       └── Footer/            # Footer
│   └── public/                    # Static assets
│
├── docker-compose.yml             # Docker Compose configuration
└── README.md                      # This file
```

---

## 📦 Installation

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MongoDB** (or use Docker)
- **Docker** & **Docker Compose** (optional, for containerized setup)

### Clone the Repository

```bash
git clone <repository-url>
cd backend-nodejs-capstone
```

### Backend Setup

```bash
cd secondChance-backend
npm install
```

### Frontend Setup

```bash
cd secondChance-frontend
npm install
```

---

## ⚙️ Configuration

### Environment Variables

#### Backend (`secondChance-backend/.env`)

Create a `.env` file in the `secondChance-backend` directory:

```env
# MongoDB connection string
MONGO_URL=mongodb://root:example@localhost:27017/secondChance?authSource=admin

# JWT secret for token signing (use a strong random string)
JWT_SECRET=your-secret-key-here

# Frontend URL (for redirects)
FRONTEND_BASE_URL=http://localhost:3000

# Optional: Public URL for serving images
BACKEND_PUBLIC_URL=http://localhost:3060

# Socket.io origin (for CORS)
SOCKET_ORIGIN=*

# Node environment
NODE_ENV=development
```

#### Frontend (`secondChance-frontend/.env`)

Create a `.env` file in the `secondChance-frontend` directory:

```env
# Backend API URL
REACT_APP_BACKEND_URL=http://localhost:3060
```

**Note**: Environment variable names in React must start with `REACT_APP_` to be accessible in the browser.

---

## 🚀 Running the Application

### Option 1: Docker Compose (Recommended)

This is the easiest way to run the entire application stack:

```bash
# Build and start all services (MongoDB, Backend, Frontend)
docker compose up --build

# Or run in detached mode (background)
docker compose up -d --build

# Stop all services
docker compose down

# View logs
docker compose logs -f
```

This will start:
- **MongoDB** on `mongodb://localhost:27017`
- **Backend** on `http://localhost:3060`
- **Frontend** on `http://localhost:3000`

### Option 2: Manual Setup (Development)

#### Start MongoDB

If MongoDB is installed locally:
```bash
mongod
```

Or use Docker for MongoDB only:
```bash
docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=root -e MONGO_INITDB_ROOT_PASSWORD=example mongo:6
```

#### Start Backend

```bash
cd secondChance-backend
npm install
npm run dev    # Development mode with nodemon
# or
npm start      # Production mode
```

Backend will run on `http://localhost:3060`

#### Start Frontend

```bash
cd secondChance-frontend
npm install
npm start      # Starts development server
```

Frontend will run on `http://localhost:3000` and automatically open in your browser.

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| PUT | `/api/auth/update` | Update user info | Yes |

### Items (`/api/secondchance/items`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/secondchance/items` | Get all items | No |
| GET | `/api/secondchance/items/carousel` | Get carousel items | No |
| GET | `/api/secondchance/items/:id` | Get item by ID | No |
| GET | `/api/secondchance/items/mine` | Get user's items | Yes |
| GET | `/api/secondchance/items/reservations/me` | Get user's reservations | Yes |
| POST | `/api/secondchance/items` | Create new item | Yes |
| PUT | `/api/secondchance/items/:id` | Update item | Yes (Owner/Admin) |
| DELETE | `/api/secondchance/items/:id` | Delete item | Yes (Owner/Admin) |
| POST | `/api/secondchance/items/:id/reserve` | Reserve item | Yes |
| POST | `/api/secondchance/items/:id/request-approval` | Request pickup approval | Yes |
| POST | `/api/secondchance/items/:id/approve-buyer` | Approve buyer | Yes (Seller) |
| GET | `/api/secondchance/items/:id/secure` | Get secure info | Yes |
| GET | `/api/secondchance/items/:id/pickup-options` | Get pickup options | Yes |

### Admin (`/api/secondchance/items/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/secondchance/items/admin/stats` | Get statistics | Yes (Admin) |
| GET | `/api/secondchance/items/admin/all` | Get all items with owners | Yes (Admin) |
| DELETE | `/api/secondchance/items/admin/:id` | Delete any item | Yes (Admin) |

### Search (`/api/secondchance/search`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/secondchance/search` | Search items | No |

### Chats (`/api/chats`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/chats/:itemId` | Create chat | Yes |
| GET | `/api/chats` | Get user's chats | Yes |
| GET | `/api/chats/:chatId/messages` | Get messages | Yes |
| POST | `/api/chats/:chatId/messages` | Send message (REST) | Yes |
| PATCH | `/api/chats/:chatId/approve` | Approve chat | Yes |
| DELETE | `/api/chats/:chatId` | Delete chat | Yes |

### Notifications (`/api/notifications`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notifications` | Get notifications | Yes |
| POST | `/api/notifications/mark-read` | Mark as read | Yes |
| DELETE | `/api/notifications/:id` | Delete notification | Yes |
| GET | `/api/notifications/preferences` | Get preferences | Yes |
| POST | `/api/notifications/preferences` | Update preferences | Yes |

### WebSocket Events

**Client → Server:**
- `join_chat` - Join a chat room
- `send_message` - Send a message

**Server → Client:**
- `new_message` - Receive new message
- `error` - Error event
- `connect_error` - Connection error

---

## 🗄️ Database

### MongoDB Collections

#### `users`
- `_id` - User ID
- `email` - User email
- `password` - Hashed password
- `firstName` - First name
- `lastName` - Last name
- `role` - User role ('user' or 'admin')
- `createdAt` - Creation date

#### `secondChanceItems`
- `id` - Item ID (string)
- `name` - Item name
- `category` - Item category
- `condition` - Item condition
- `price` - Price (number)
- `description` - Item description
- `image` - Main image URL
- `galleryImages` - Array of image URLs
- `status` - Item status ('available', 'reserved', 'sold')
- `ownerId` - Owner user ID
- `ownerEmail` - Owner email
- `city` - City
- `area` - Area
- `date_added` - Unix timestamp
- `reservedByUserId` - Reserved by user ID
- `reservedUntil` - Reservation expiry date
- `pickupLocations` - Array of pickup locations

#### `chats`
- `_id` - Chat ID
- `itemId` - Related item ID
- `buyerId` - Buyer user ID
- `sellerId` - Seller user ID
- `isApproved` - Approval status
- `createdAt` - Creation date
- `updatedAt` - Last update

#### `chatMessages`
- `_id` - Message ID
- `chatId` - Chat ID
- `senderId` - Sender user ID
- `content` - Message content
- `createdAt` - Creation date

#### `itemApprovals`
- `_id` - Approval ID
- `itemId` - Item ID
- `buyerId` - Buyer user ID
- `sellerId` - Seller user ID
- `status` - Status ('pending', 'approved', 'rejected')
- `createdAt` - Creation date
- `updatedAt` - Last update

#### `notifications`
- `_id` - Notification ID
- `userId` - User ID
- `type` - Notification type
- `title` - Notification title
- `message` - Notification message
- `context` - Additional context
- `readAt` - Read timestamp (null if unread)
- `createdAt` - Creation date

#### `notificationPreferences`
- `_id` - Preference ID
- `userId` - User ID
- `categories` - Array of interested categories
- `updatedAt` - Last update

---

## 💻 Development

### Backend Development

```bash
cd secondChance-backend
npm run dev    # Uses nodemon for auto-reload
```

### Frontend Development

```bash
cd secondChance-frontend
npm start      # React development server with hot reload
```

### Building for Production

**Backend:**
```bash
cd secondChance-backend
npm start
```

**Frontend:**
```bash
cd secondChance-frontend
npm run build  # Creates optimized build in /build folder
```

### Code Structure

The backend uses a modular structure:
- Routes are organized by feature in `routes/items/`
- Utility functions in `routes/utils/`
- Business logic in `services/`
- Middleware for authentication/authorization

The frontend uses component-based architecture:
- Each component in its own folder with CSS
- Global state via Context API
- Route-based page components

---

## 🔐 Authentication Flow

1. User registers/logs in via `/api/auth/register` or `/api/auth/login`
2. Backend returns JWT token
3. Frontend stores token in `sessionStorage`
4. Token is sent in `Authorization: Bearer <token>` header for protected routes
5. Backend middleware validates token and extracts user info

---

## 📝 Notes

- **Image Upload**: Images are uploaded to `public/images/` directory
- **Reservation Timer**: Items are automatically released after 10 hours
- **First User**: The first registered user automatically gets 'admin' role
- **WebSocket**: Chat requires authentication token in handshake
- **Session Storage**: Tokens stored in sessionStorage (cleared on browser close)

---

## 🐛 Troubleshooting

### Backend won't start
- Check MongoDB is running
- Verify `MONGO_URL` in `.env` is correct
- Check port 3060 is available

### Frontend can't connect to backend
- Verify `REACT_APP_BACKEND_URL` in frontend `.env`
- Check backend is running on correct port
- Check CORS configuration

### Images not loading
- Verify `public/images/` directory exists in backend
- Check file permissions
- Verify image URLs in database

### WebSocket connection fails
- Check `SOCKET_ORIGIN` in backend `.env`
- Verify token is valid
- Check socket.io versions match (client/server)

---

## 📄 License

See LICENSE file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

For more detailed information, see:
- `BACKEND_SUMMARY_EN.md` - Complete backend documentation
- `FRONTEND_SUMMARY_EN.md` - Complete frontend documentation
