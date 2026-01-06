# Second‑Hand Store - SecondChance Project

## Summary
-------
This is a comprehensive second-hand store project (SecondChance) that includes a full-stack application with backend service (Node.js/Express + MongoDB) and frontend (React). The platform enables users to buy and sell second-hand items with features including item management, image uploads, real-time chat system with Socket.IO, payment integration (PayPal), notifications, and admin panel.

---

## Table of Contents
- [Key Features](#key-features)
- [Project Architecture](#project-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Docker Deployment](#docker-deployment)
- [Testing](#testing)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## Key Features

### Core Functionality
- **Item Management**: Create, read, update, and delete second-hand items with detailed information
- **Image Upload**: Upload up to 5 images per item (stored in `backend/public/images`)
- **Advanced Search**: Filter items by name, category, condition, price, age, location (city/area)
- **Item Reservations**: Reserve items with expiration dates and automatic release
- **Real-time Chat**: Socket.IO-based chat system for buyer-seller communication
- **Payment Integration**: PayPal Sandbox integration for secure payments
- **User Authentication**: JWT-based authentication with role-based access control (user/admin)
- **Notifications System**: Real-time notifications for various events
- **Admin Panel**: User management, item moderation, and system statistics
- **Purchase History**: Track purchases and sales for both buyers and sellers

### Advanced Features
- **Location-based Services**: Pickup location management with geolocation support
- **Reservation System**: Automatic expiration handling and buyer timeout tracking
- **Approval Workflow**: Seller approval for item pickup requests
- **Carousel Display**: Featured items carousel on homepage
- **Responsive Design**: Mobile-friendly React Bootstrap UI

---

## Project Architecture

### Backend Architecture
- **Framework**: Express.js (Node.js)
- **Database**: MongoDB with native driver
- **Authentication**: JWT tokens with bcrypt password hashing
- **Real-time**: Socket.IO for chat functionality
- **File Upload**: Multer for image handling
- **Logging**: Pino logger with HTTP middleware
- **Validation**: express-validator for input validation

### Frontend Architecture
- **Framework**: React 18 with Create React App
- **State Management**: React Context API (`AppContext`)
- **Routing**: React Router DOM v6
- **UI Library**: React Bootstrap 5
- **Real-time**: Socket.IO client
- **Payment**: PayPal React SDK
- **Styling**: CSS modules and Bootstrap

---

## Technology Stack

### Backend Dependencies
- `express` ^4.18.2 - Web framework
- `mongodb` 6.8.0 - Database driver
- `jsonwebtoken` ^9.0.2 - JWT authentication
- `bcryptjs` ^2.4.3 - Password hashing
- `socket.io` ^4.8.1 - Real-time communication
- `multer` ^1.4.5-lts.1 - File upload handling
- `cors` ^2.8.5 - Cross-origin resource sharing
- `pino` ^8.17.2 - Logging
- `express-validator` ^7.0.1 - Input validation
- `axios` ^1.4.0 - HTTP client for PayPal API
- `dotenv` ^16.3.1 - Environment variables

### Frontend Dependencies
- `react` ^18.2.0 - UI library
- `react-router-dom` ^6.20.1 - Routing
- `react-bootstrap` ^2.9.2 - UI components
- `socket.io-client` ^4.7.2 - Real-time client
- `@paypal/react-paypal-js` ^8.9.2 - PayPal integration
- `react-datepicker` ^4.24.0 - Date selection
- `bootstrap` ^5.3.2 - CSS framework

---

## Project Structure

### Backend Structure (`backend/`)
```
backend/
├── app.js                    # Main server entry point
├── logger.js                 # Pino logger configuration
├── socket.js                 # Socket.IO initialization and event handlers
├── Dockerfile               # Docker image configuration
├── package.json             # Dependencies and scripts
│
├── middleware/
│   └── auth.js              # JWT authentication & admin authorization middleware
│
├── models/
│   ├── db.js                # MongoDB connection singleton
│   └── baseModel.js         # Utility functions (ObjectId normalization)
│
├── routes/
│   ├── authRoutes.js         # Authentication endpoints (register, login, update)
│   ├── secondChanceItemsRoutes.js  # Item CRUD operations
│   ├── searchRoutes.js      # Advanced search functionality
│   ├── chatRoutes.js        # Chat management endpoints
│   ├── notificationsRoutes.js  # Notification system endpoints
│   ├── paymentRoutes.js     # PayPal payment processing
│   └── adminUsersRoutes.js  # Admin user management
│
├── services/
│   └── reservations.js      # Expired reservation cleanup service
│
└── public/
    └── images/              # Uploaded item images (served statically)
```

### Frontend Structure (`frontend/`)
```
frontend/
├── public/
│   ├── index.html          # Main HTML template
│   ├── home.html           # Homepage template
│   └── manifest.json       # PWA manifest
│
├── src/
│   ├── index.js            # React entry point
│   ├── App.js              # Main app component with routing
│   ├── config.js           # Backend URL configuration
│   │
│   ├── context/
│   │   └── AppContext.js   # Global state management (auth, user)
│   │
│   └── components/
│       ├── AdminPanel/     # Admin dashboard
│       ├── ChatModal/      # Real-time chat interface
│       ├── DetailsPage/    # Item detail view
│       ├── Footer/         # Site footer
│       ├── ItemPage/       # Item listing page
│       ├── LoginPage/      # User login
│       ├── MainPage/       # Homepage with carousel
│       ├── Navbar/         # Navigation bar
│       ├── NewArrivalsCarousel/  # Featured items carousel
│       ├── PaymentModal/   # PayPal payment interface
│       ├── Profile/        # User profile page
│       ├── PurchaseHistory/  # Purchase/sales history
│       ├── RegisterPage/   # User registration
│       └── SearchPage/     # Advanced search interface
│
├── Dockerfile              # Production build with nginx
└── package.json            # Dependencies and scripts
```

---

## API Documentation

### Base URL
- Development: `http://localhost:3060`
- Production: Set via `REACT_APP_API_URL` environment variable

### Authentication
Most endpoints require JWT authentication via header:
```
Authorization: Bearer <JWT_TOKEN>
```

### Main API Endpoints

#### 1. Authentication (`/api/auth`)
- `POST /api/auth/register` - Register new user
  - Body: `{ email, password, firstName, lastName, role? }`
  - Returns: `{ authtoken, email, role, userId }`
- `POST /api/auth/login` - User login
  - Body: `{ email, password }`
  - Returns: `{ authtoken, userName, userEmail, userRole, userId }`
- `PUT /api/auth/update` - Update user profile (requires auth)
  - Body: `{ name }`

#### 2. Items (`/api/secondchance/items`)
- `GET /api/secondchance/items` - List items (supports filters)
- `GET /api/secondchance/items/carousel` - Featured items for carousel
- `GET /api/secondchance/items/:id` - Get item by ID
- `POST /api/secondchance/items` - Create new item (auth, multipart/form-data)
  - Fields: `name`, `description`, `price`, `city`, `area`, `images` (up to 5)
- `PUT /api/secondchance/items/:id` - Update item (auth, owner/admin)
- `DELETE /api/secondchance/items/:id` - Delete item (auth, owner/admin)
- `POST /api/secondchance/items/:id/reserve` - Reserve item (auth)
- `POST /api/secondchance/items/:id/cancel-reservation` - Cancel reservation (auth)
- `GET /api/secondchance/items/mine` - Get user's items (auth)
- `GET /api/secondchance/items/reservations/me` - Get user's reservations (auth)

#### 3. Search (`/api/secondchance/search`)
- `GET /api/secondchance/search` - Advanced search
  - Query params: `name`, `category`, `condition`, `price`, `price_max`, `age_years`, `city`, `area`, `sort`

#### 4. Chat (`/api/chats`)
- `POST /api/chats/:itemId` - Create chat for item (auth)
- `GET /api/chats/` - Get user's chats (auth)
- `GET /api/chats/:chatId/messages` - Get chat messages (auth)
- `POST /api/chats/:chatId/messages` - Send message (auth)
  - Body: `{ content: string }`
- `PATCH /api/chats/:chatId/approve` - Approve chat (seller/admin)
- `DELETE /api/chats/:chatId` - Delete chat (owner/admin)

#### 5. Payments (`/api/payments`)
- `POST /api/payments/create-order` - Create payment order (auth)
  - Body: `{ itemId, amount, deliveryMethod?, shippingAddress? }`
- `POST /api/payments/capture-order` - Capture payment (auth)
  - Body: `{ orderId }`
- `POST /api/payments/cancel-order` - Cancel order (auth)
- `GET /api/payments/my-purchases` - Get purchase history (auth)
- `GET /api/payments/my-sales` - Get sales history (auth)
- `GET /api/payments/paypal-config` - Get PayPal client ID (public)

#### 6. Notifications (`/api/notifications`)
- `GET /api/notifications/` - Get user notifications (auth)
- `POST /api/notifications/mark-read` - Mark notifications as read (auth)
  - Body: `{ ids?: string[] }` (empty = mark all unread)
- `DELETE /api/notifications/:id` - Delete notification (auth)
- `POST /api/notifications/preferences` - Save notification preferences (auth)
- `GET /api/notifications/preferences` - Get notification preferences (auth)
- `GET /api/notifications/admin/unread` - Admin unread count (admin only)

#### 7. Admin (`/api/admin/users`)
- `GET /api/admin/users/` - List all users (admin)
- `DELETE /api/admin/users/:id` - Delete user (admin)
- `POST /api/admin/users/:id/message` - Send message to user (admin)
  - Body: `{ title?, message }`

### Socket.IO Events

#### Client → Server
- `join_chat` - Join chat room: `{ chatId }`
- `send_message` - Send message: `{ chatId, content }`

#### Server → Client
- `chat_joined` - Confirmation of joining chat: `{ chatId }`
- `new_message` - New message received: `{ id, chatId, senderId, content, createdAt }`
- `error` - Error occurred: `{ message }`

For detailed API documentation, see `API.md` file.

---

## Database Schema

### MongoDB Collections

#### `users`
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String ('user' | 'admin'),
  pickupTimeoutCount: Number (default: 0),
  pickupTimeoutFlagged: Boolean (default: false),
  createdAt: Date
}
```

#### `secondChanceItems`
```javascript
{
  _id: ObjectId,
  id: String (unique identifier),
  name: String,
  description: String,
  price: Number,
  category: String,
  condition: String,
  images: [String] (image filenames),
  ownerId: String (user ID),
  status: String ('available' | 'reserved' | 'sold'),
  city: String,
  area: String,
  lat: Number,
  lng: Number,
  pickupLocations: [Object],
  reservedByUserId: String?,
  reservedUntil: Date?,
  reservedReason: String?,
  pickupApprovedAt: Date?,
  createdAt: Date,
  updatedAt: Date
}
```

#### `chats`
```javascript
{
  _id: ObjectId,
  itemId: String,
  buyerId: String,
  sellerId: String,
  isApproved: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### `chatMessages`
```javascript
{
  _id: ObjectId,
  chatId: ObjectId,
  senderId: String,
  content: String,
  createdAt: Date
}
```

#### `payments`
```javascript
{
  _id: ObjectId,
  orderId: String (unique),
  itemId: String,
  buyerId: String,
  sellerId: String,
  amount: Number,
  deliveryMethod: String ('pickup' | 'shipping'),
  shippingAddress: String?,
  status: String ('pending' | 'completed' | 'cancelled'),
  createdAt: Date,
  completedAt: Date?,
  updatedAt: Date
}
```

#### `notifications`
```javascript
{
  _id: ObjectId,
  userId: String,
  title: String,
  message: String,
  category: String,
  isRead: Boolean,
  createdAt: Date
}
```

---

## Installation & Setup

### Prerequisites
- **Node.js** 18+ and npm
- **MongoDB** 6+ (or use Docker Compose)
- **Docker** + Docker Compose (optional, for containerized deployment)
- **PayPal Developer Account** (optional, for payment integration)

### Step 1: Clone Repository
```bash
git clone https://github.com/EliBini/Second-hand-store.git
cd Second-hand-store
```

### Step 2: Backend Setup
```bash
cd backend
npm ci
```

Create `.env` file in `backend/`:
```env
MONGO_URL=mongodb://localhost:27017/secondChance
JWT_SECRET=your-secret-key-here
NODE_ENV=development
PORT=3060
PAYPAL_CLIENT_ID=your-paypal-client-id (optional)
PAYPAL_SECRET=your-paypal-secret (optional)
FRONTEND_BASE_URL=http://localhost:3000
SOCKET_ORIGIN=*
```

### Step 3: Frontend Setup
```bash
cd frontend
npm ci
```

Create `.env` file in `frontend/`:
```env
REACT_APP_API_URL=http://localhost:3060
REACT_APP_BACKEND_URL=http://localhost:3060
```

---

## Environment Variables

### Backend Environment Variables
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGO_URL` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | - | Yes |
| `NODE_ENV` | Environment (development/production) | development | No |
| `PORT` | Server port | 3060 | No |
| `PAYPAL_CLIENT_ID` | PayPal client ID | - | Optional |
| `PAYPAL_SECRET` | PayPal secret key | - | Optional |
| `FRONTEND_BASE_URL` | Frontend URL for CORS | http://localhost:3000 | No |
| `SOCKET_ORIGIN` | Socket.IO CORS origin | * | No |

### Frontend Environment Variables
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_API_URL` | Backend API URL | http://localhost:3060 | Yes |
| `REACT_APP_BACKEND_URL` | Alternative backend URL | - | No |

---

## Running the Application

### Development Mode

#### Option 1: Local Development (Separate Terminals)

**Terminal 1 - MongoDB:**
```bash
# If MongoDB is installed locally
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongo mongo:6
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start  # Opens http://localhost:3000
```

#### Option 2: Docker Compose (Recommended)
```bash
# From project root
docker compose up --build

# Or in detached mode
docker compose up -d --build
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3060
- MongoDB: localhost:27017

### Production Mode

#### Backend
```bash
cd backend
npm start
```

#### Frontend
```bash
cd frontend
npm run build
# Serve the build/ directory with a web server (nginx, Apache, etc.)
```

---

## Docker Deployment

### Docker Compose Configuration
The `docker-compose.yml` defines three services:

1. **mongo**: MongoDB 6 database
   - Port: 27017
   - Volume: `mongo_data` for persistence
   - Credentials: root/example

2. **backend**: Node.js Express server
   - Port: 3060
   - Depends on: mongo
   - Environment variables from `.env` or docker-compose

3. **frontend**: React app served via nginx
   - Port: 3000 (host) → 80 (container)
   - Depends on: backend
   - Builds React app and serves static files

### Building and Running
```bash
# Build and start all services
docker compose up --build

# Stop services
docker compose down

# Stop and remove volumes
docker compose down -v

# View logs
docker compose logs -f [service-name]
```

### Dockerfiles

**Backend Dockerfile:**
- Base: `node:18-alpine`
- Installs dependencies
- Runs `node app.js`

**Frontend Dockerfile:**
- Builds React app (`npm run build`)
- Uses `nginx:alpine` to serve static files
- Configures nginx for SPA routing

---

## Testing

### Backend Testing
```bash
cd backend
npm test
```

Testing stack:
- **Mocha** - Test framework
- **Chai** - Assertion library
- **Sinon** - Mocking and spying
- **Supertest** - HTTP assertions

### Frontend Testing
```bash
cd frontend
npm test
```

Uses React Testing Library and Jest (via Create React App).

---

## Security

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Role-Based Access**: Admin and user roles
- **Token Validation**: Middleware validates tokens on protected routes

### Security Best Practices
- Never commit `.env` files with secrets
- Use strong `JWT_SECRET` in production
- Enable HTTPS in production
- Validate all user inputs (express-validator)
- Sanitize file uploads (Multer)
- CORS configuration for allowed origins
- Rate limiting (consider adding for production)

### Payment Security
- PayPal Sandbox for testing (no real money)
- Server-side payment validation
- Order ID verification
- Item availability checks before payment

---

## Troubleshooting

### Common Issues

#### MongoDB Connection Errors
**Problem**: `Failed to connect to DB`
- **Solution**: 
  - Verify MongoDB is running: `mongod` or `docker ps`
  - Check `MONGO_URL` in `.env` matches your MongoDB setup
  - Ensure MongoDB is accessible (firewall, network)

#### JWT Authentication Errors
**Problem**: `Invalid or expired token`
- **Solution**:
  - Verify `JWT_SECRET` is set correctly
  - Check token expiration (default: no expiration)
  - Ensure token is sent in header: `Authorization: Bearer <token>`

#### CORS Errors
**Problem**: CORS policy blocking requests
- **Solution**:
  - Check `FRONTEND_BASE_URL` matches frontend URL
  - Verify `SOCKET_ORIGIN` allows your origin
  - Backend uses `app.use("*", cors())` - adjust if needed

#### Image Upload Fails
**Problem**: Images not uploading
- **Solution**:
  - Check `backend/public/images/` directory exists and is writable
  - Verify Multer configuration
  - Check file size limits (default: no limit)
  - Ensure `multipart/form-data` content type

#### Socket.IO Connection Issues
**Problem**: Chat not working
- **Solution**:
  - Verify Socket.IO server is initialized in `app.js`
  - Check token is passed in socket handshake: `auth: { token }`
  - Verify `SOCKET_ORIGIN` allows your origin
  - Check browser console for connection errors

#### PayPal Integration Issues
**Problem**: Payment not processing
- **Solution**:
  - Verify `PAYPAL_CLIENT_ID` and `PAYPAL_SECRET` are set (optional for sandbox mode)
  - Check PayPal Sandbox account status
  - Verify frontend PayPal SDK is loading
  - Check network requests in browser DevTools

---

## Quick Links (Important Files)

- `backend/app.js` - Server entry point and route registration
- `backend/models/db.js` - MongoDB connection singleton
- `backend/middleware/auth.js` - JWT authentication middleware
- `backend/socket.js` - Socket.IO initialization and event handlers
- `backend/services/reservations.js` - Expired reservation cleanup service
- `frontend/src/config.js` - Backend URL configuration
- `frontend/src/context/AppContext.js` - Global state management
- `frontend/src/App.js` - Main React app with routing
- `docker-compose.yml` - Docker services configuration
- `API.md` - Detailed API endpoint documentation
- `PAYMENT_INTEGRATION.md` - PayPal integration guide

---

## Additional Documentation

- **API.md** - Complete API endpoint documentation with examples
- **PAYMENT_INTEGRATION.md** - PayPal integration setup and usage guide

---

## Scripts Reference

### Backend Scripts (`backend/package.json`)
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run test suite
- `npm run fetch:demo-images` - Fetch demo images (if script exists)

### Frontend Scripts (`frontend/package.json`)
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (irreversible)

---

## License
See `LICENSE` file in the repository.

---

## Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m "Add feature"`
6. Push: `git push origin feature/your-feature`
7. Open a Pull Request

### Code Style
- Follow existing code patterns
- Use meaningful variable names
- Add comments for complex logic
- Update documentation for API changes

---

## Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation
- Review `API.md` for endpoint details
- Check `PAYMENT_INTEGRATION.md` for payment setup

---

**Thank you for using SecondChance!**
