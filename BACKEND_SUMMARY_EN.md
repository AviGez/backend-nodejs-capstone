# Backend Summary - SecondChance Application

## 📋 Table of Contents
1. [General Structure](#general-structure)
2. [Main Technologies](#main-technologies)
3. [File Structure](#file-structure)
4. [Routes (API Endpoints)](#routes-api-endpoints)
5. [Authentication & Authorization](#authentication--authorization)
6. [Database](#database)
7. [WebSocket (Real-time)](#websocket-real-time)
8. [Main Processes](#main-processes)

---

## 🏗️ General Structure

The backend is built on **Node.js + Express** and uses **MongoDB** as the database.

### Entry Point: `app.js`
- Creates Express server
- Connects to MongoDB
- Defines routes
- Initializes WebSocket server
- Handles global errors

---

## 🛠️ Main Technologies

### Dependencies:
- **express** - Web framework
- **mongodb** - Database driver
- **jsonwebtoken (JWT)** - Authentication
- **bcryptjs** - Password hashing
- **multer** - File uploads
- **socket.io** - Real-time communication
- **cors** - Cross-origin requests
- **pino** - Logging
- **dotenv** - Environment variables

---

## 📁 File Structure

```
secondChance-backend/
├── app.js                    # Main entry point
├── socket.js                 # WebSocket configuration
├── logger.js                 # Logging configuration
├── package.json              # Dependencies
├── Dockerfile                # Docker configuration
│
├── models/
│   ├── db.js                 # MongoDB connection
│   └── baseModel.js          # Utilities (ObjectId normalization)
│
├── middleware/
│   └── auth.js               # Authentication & Authorization middleware
│
├── routes/
│   ├── authRoutes.js         # Registration, Login, Update
│   ├── secondChanceItemsRoutes.js  # CRUD operations on items
│   ├── searchRoutes.js       # Item search
│   ├── chatRoutes.js         # Chat management
│   └── notificationsRoutes.js # Notification management
│
├── services/
│   └── reservations.js       # Reservation logic
│
└── public/
    └── images/               # Uploaded images
```

---

## 🛣️ Routes (API Endpoints)

### 1. Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
- **Purpose**: Register a new user
- **Body**: `{ email, password, firstName, lastName, role? }`
- **Process**:
  1. Checks if email already exists
  2. Hashes password with bcryptjs
  3. Creates new user in MongoDB
  4. If first user → role = 'admin', otherwise 'user'
  5. Returns JWT token
- **Response**: `{ authtoken, email, role, userId }`

#### POST `/api/auth/login`
- **Purpose**: User login
- **Body**: `{ email, password }`
- **Process**:
  1. Finds user by email
  2. Compares password with bcryptjs.compare()
  3. Creates JWT token
- **Response**: `{ authtoken, userName, userEmail, userRole, userId }`

#### PUT `/api/auth/update`
- **Purpose**: Update user details
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ name }`
- **Process**:
  1. Authenticates token (middleware: authenticate)
  2. Updates user name
  3. Creates new token
- **Response**: `{ authtoken, role }`

---

### 2. Items Routes (`/api/secondchance/items`)

#### GET `/api/secondchance/items`
- **Purpose**: Get all available items
- **Process**: Returns only items with status = 'available'
- **Response**: Array of items

#### GET `/api/secondchance/items/carousel`
- **Purpose**: Items for carousel (new items from last 7 days)
- **Response**: Array of recent items

#### GET `/api/secondchance/items/:id`
- **Purpose**: Get specific item by ID
- **Response**: Single item object

#### POST `/api/secondchance/items`
- **Purpose**: Create new item
- **Headers**: `Authorization: Bearer <token>`
- **Body**: FormData (including images)
- **Process**:
  1. Authenticates user
  2. Uploads images with multer
  3. Saves item to MongoDB
  4. Creates notifications for users
- **Response**: Created item

#### PUT `/api/secondchance/items/:id`
- **Purpose**: Update item
- **Headers**: `Authorization: Bearer <token>`
- **Process**: Only owner or admin can update
- **Response**: Updated item

#### DELETE `/api/secondchance/items/:id`
- **Purpose**: Delete item
- **Headers**: `Authorization: Bearer <token>`
- **Process**: Only owner or admin can delete

#### POST `/api/secondchance/items/:id/reserve`
- **Purpose**: Reserve item (10 hours)
- **Headers**: `Authorization: Bearer <token>`
- **Process**:
  1. Checks item is available
  2. Creates reservation for 10 hours
  3. Updates status to 'reserved'
  4. Activates timer for automatic release

#### GET `/api/secondchance/items/mine`
- **Purpose**: Get logged-in user's items
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of user's items

#### GET `/api/secondchance/items/reservations/me`
- **Purpose**: Get user's reservations
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Array of reserved items

#### POST `/api/secondchance/items/:id/request-approval`
- **Purpose**: Request pickup approval (for paid items)
- **Headers**: `Authorization: Bearer <token>`
- **Process**: Creates request in itemApprovals collection

#### POST `/api/secondchance/items/:id/approve-buyer`
- **Purpose**: Approve buyer (for seller)
- **Headers**: `Authorization: Bearer <token>`
- **Process**: Updates status to 'approved' and creates chat

#### GET `/api/secondchance/items/:id/secure`
- **Purpose**: Get secure information (pickup address, approvals)
- **Headers**: `Authorization: Bearer <token>`
- **Process**: Returns info only if user is seller or approved buyer

#### GET `/api/secondchance/items/:id/pickup-options`
- **Purpose**: Get pickup options
- **Headers**: `Authorization: Bearer <token>`

#### Admin Routes:
- `GET /api/secondchance/items/admin/stats` - Statistics
- `GET /api/secondchance/items/admin/all` - All items
- `DELETE /api/secondchance/items/admin/:id` - Delete (admin only)

---

### 3. Search Routes (`/api/secondchance/search`)

#### GET `/api/secondchance/search`
- **Purpose**: Search items
- **Query Parameters**: `name`, `category`, `condition`, `city`, `area`
- **Process**: Searches database by parameters
- **Response**: Array of matching items

---

### 4. Chat Routes (`/api/chats`)

#### POST `/api/chats/:itemId`
- **Purpose**: Create new chat
- **Headers**: `Authorization: Bearer <token>`
- **Process**: Creates chat between buyer and seller

#### GET `/api/chats`
- **Purpose**: Get all user's chats
- **Headers**: `Authorization: Bearer <token>`

#### GET `/api/chats/:chatId/messages`
- **Purpose**: Get messages in chat
- **Headers**: `Authorization: Bearer <token>`

#### POST `/api/chats/:chatId/messages`
- **Purpose**: Send message (REST API)
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ content }`

#### PATCH `/api/chats/:chatId/approve`
- **Purpose**: Approve chat
- **Headers**: `Authorization: Bearer <token>`

#### DELETE `/api/chats/:chatId`
- **Purpose**: Delete chat
- **Headers**: `Authorization: Bearer <token>`

---

### 5. Notifications Routes (`/api/notifications`)

#### GET `/api/notifications`
- **Purpose**: Get all user's notifications
- **Headers**: `Authorization: Bearer <token>`

#### POST `/api/notifications/mark-read`
- **Purpose**: Mark notifications as read
- **Headers**: `Authorization: Bearer <token>`

#### DELETE `/api/notifications/:id`
- **Purpose**: Delete notification
- **Headers**: `Authorization: Bearer <token>`

#### POST `/api/notifications/preferences`
- **Purpose**: Update notification preferences
- **Headers**: `Authorization: Bearer <token>`

---

## 🔐 Authentication & Authorization

### Middleware: `middleware/auth.js`

#### `authenticate` middleware
- **Purpose**: Authenticate user
- **Process**:
  1. Reads token from header: `Authorization: Bearer <token>`
  2. Verifies token with JWT_SECRET
  3. Finds user in MongoDB
  4. Adds `req.user` with user details
- **Usage**: Add before routes that require authentication

#### `authorizeAdmin` middleware
- **Purpose**: Check if user is admin
- **Process**: Checks `req.user.role === 'admin'`
- **Usage**: Add after `authenticate` for admin routes

### JWT Token Structure:
```javascript
{
  user: {
    id: "userId",
    role: "user" | "admin"
  }
}
```

---

## 🗄️ Database

### MongoDB Collections:

#### 1. `users`
- **Fields**: `_id`, `email`, `password` (hashed), `firstName`, `lastName`, `role`, `createdAt`
- **Purpose**: Store users

#### 2. `secondChanceItems`
- **Fields**: `id`, `name`, `category`, `condition`, `price`, `status`, `image`, `galleryImages`, `city`, `area`, `description`, `date_added`, `userId`, `reservedUntil`, `pickupLocations`, `enableShipping`, `shippingBasePrice`, `shippingPricePerKm`
- **Purpose**: Store items

#### 3. `chats`
- **Fields**: `_id`, `itemId`, `buyerId`, `sellerId`, `isApproved`, `createdAt`, `updatedAt`
- **Purpose**: Store chats between buyers and sellers

#### 4. `chatMessages`
- **Fields**: `_id`, `chatId`, `senderId`, `content`, `createdAt`
- **Purpose**: Store messages in chats

#### 5. `itemApprovals`
- **Fields**: `itemId`, `buyerId`, `sellerId`, `status` (pending/approved/rejected), `chatId`, `createdAt`, `updatedAt`
- **Purpose**: Manage pickup approval requests

#### 6. `notifications`
- **Fields**: `_id`, `userId`, `type`, `message`, `read`, `createdAt`
- **Purpose**: Store notifications for users

### Database Connection: `models/db.js`
- **Function**: `connectToDatabase()`
- **Purpose**: Connect to MongoDB
- **Singleton pattern**: Returns same instance each time
- **URL**: Gets from `process.env.MONGO_URL`

---

## 🔌 WebSocket (Real-time)

### File: `socket.js`

### Authentication Process:
1. User sends token in handshake
2. Verifies token with JWT
3. Saves `socket.userId`

### Events:

#### `join_chat`
- **Purpose**: Join chat room
- **Data**: `{ chatId }`
- **Process**:
  1. Checks chat exists
  2. Checks user is authorized
  3. Checks chat is approved
  4. Joins room: `chat:${chatId}`

#### `send_message`
- **Purpose**: Send real-time message
- **Data**: `{ chatId, content }`
- **Process**:
  1. Checks authorization
  2. Saves message to MongoDB
  3. Updates chat `updatedAt`
  4. Sends `new_message` to all room members

### Rooms:
- Each chat = separate room
- Format: `chat:${chatId}`
- Only authorized users can join

---

## ⚙️ Main Processes

### 1. Creating New Item
1. User uploads images (multer)
2. Saves item to MongoDB
3. Creates notifications for relevant users
4. Returns new item

### 2. Reserving Item
1. Checks item is available
2. Creates reservation for 10 hours
3. Updates status to 'reserved'
4. Activates timer for automatic release (service: reservations.js)

### 3. Pickup Approval Process (for paid items)
1. Buyer requests approval (`request-approval`)
2. Seller sees the request
3. Seller approves (`approve-buyer`)
4. Chat is created automatically
5. Buyer gets access to pickup address

### 4. Chat System
- **REST API**: Create, read, delete
- **WebSocket**: Real-time messages
- **Approval**: Chat opens only after seller approval

### 5. Notification System
- Notifications on new items
- Notifications on reservations
- Notifications on approval requests
- User preferences

---

## 🔒 Security

### 1. Password Hashing
- Uses `bcryptjs`
- Passwords never stored in plain text

### 2. JWT Authentication
- Every request authenticated with token
- Token contains: userId, role
- Secret key in `.env`

### 3. Authorization
- Ownership checks on resources
- Admin routes protected with `authorizeAdmin`
- Permission checks before operations

### 4. Input Validation
- Uses `express-validator`
- Input validation before processing

---

## 📤 File Upload

### Multer Configuration
- **Destination**: `public/images/`
- **Filename**: `{safeName}-{timestamp}-{random}.{ext}`
- **Max files**: Defined in `MAX_IMAGES_PER_ITEM`
- **Storage**: `diskStorage` (saves to disk)

---

## 🎯 Important Points for Exam

1. **Authentication Flow**: Register → Login → JWT Token → Authenticate Middleware
2. **Authorization**: Role-based (user/admin)
3. **Database Structure**: Collections and relationships
4. **WebSocket**: Real-time messaging
5. **File Upload**: Multer configuration
6. **Reservations**: Timer system for automatic release
7. **Approval System**: Pickup approval process
8. **Error Handling**: Global error handler
9. **Environment Variables**: `.env` file
10. **Docker**: Containerization with docker-compose

---

## 📝 Important Code Examples

### Database Connection:
```javascript
const db = await connectToDatabase();
const collection = db.collection('secondChanceItems');
```

### Authentication Middleware:
```javascript
router.get('/protected', authenticate, (req, res) => {
  // req.user contains user details
});
```

### Admin Route:
```javascript
router.delete('/admin/:id', authenticate, authorizeAdmin, ...);
```

### WebSocket Event:
```javascript
socket.on('send_message', async ({ chatId, content }) => {
  // Send real-time message
});
```

---

## 🚀 Running

```bash
# Development
npm run dev

# Production
npm start

# Docker
docker-compose up
```

---

**Port**: 3060  
**Database**: MongoDB (port 27017)  
**Environment**: `.env` file with:
- `MONGO_URL`
- `JWT_SECRET`
- `FRONTEND_BASE_URL`
- `SOCKET_ORIGIN`

---

## 🔄 Key Data Flows

### User Registration Flow:
```
Client → POST /api/auth/register
  → Check email exists
  → Hash password (bcryptjs)
  → Save to MongoDB (users collection)
  → Generate JWT token
  → Return { authtoken, email, role, userId }
```

### Item Creation Flow:
```
Client → POST /api/secondchance/items (with FormData)
  → Authenticate (JWT)
  → Upload images (multer)
  → Save item to MongoDB
  → Create notifications
  → Return created item
```

### Reservation Flow:
```
Client → POST /api/secondchance/items/:id/reserve
  → Authenticate
  → Check item available
  → Set reservedUntil = now + 10 hours
  → Update status = 'reserved'
  → Timer releases after 10 hours
```

### Chat Flow:
```
1. Buyer requests approval → POST /api/secondchance/items/:id/request-approval
2. Seller approves → POST /api/secondchance/items/:id/approve-buyer
3. Chat created automatically
4. Users join via WebSocket → join_chat event
5. Real-time messaging → send_message event
```

---

## 📊 Database Relationships

- **users** ↔ **secondChanceItems**: One-to-many (userId)
- **secondChanceItems** ↔ **chats**: One-to-many (itemId)
- **chats** ↔ **chatMessages**: One-to-many (chatId)
- **secondChanceItems** ↔ **itemApprovals**: One-to-many (itemId)
- **users** ↔ **notifications**: One-to-many (userId)

---

## 🛡️ Security Best Practices

1. **Password**: Never stored in plain text, always hashed
2. **JWT**: Secret key in environment variables
3. **Authorization**: Check ownership before operations
4. **Input Validation**: Validate all user inputs
5. **Error Messages**: Don't expose sensitive information
6. **CORS**: Configured for cross-origin requests

---

This summary covers all the essential aspects of the backend for your exam preparation!

