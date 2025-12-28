# Second Chance Items Routes - Complete Explanation

This file (`secondChanceItemsRoutes.js`) is the main API route handler for managing second-hand items in the application. It handles all CRUD operations, reservations, approvals, carousel items, and more.

---

## 📦 **Imports and Dependencies** (Lines 1-10)

```javascript
const express = require('express');
const multer = require('multer');
const { ObjectId } = require('mongodb');
const path = require('path');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { notificationService, NOTIFICATION_TYPES } = require('./notificationsRoutes');
const { releaseExpiredReservations } = require('../services/reservations');
```

- **express**: Web framework
- **multer**: Handles file uploads (images)
- **ObjectId**: MongoDB document IDs
- **path**: File path utilities
- **router**: Express router instance
- **connectToDatabase**: Database connection
- **logger**: Logging utility
- **authenticate/authorizeAdmin**: Authentication middleware
- **notificationService**: Notification system
- **releaseExpiredReservations**: Service to release expired item reservations

---

## 📤 **File Upload Configuration** (Lines 12-28)

```javascript
const directoryPath = 'public/images';
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, directoryPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    const safeBaseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .slice(0, 32) || 'item';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${safeBaseName}-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({ storage: storage });
```

**Purpose**: Configures image uploads
- Saves files to `public/images`
- Sanitizes filenames (removes special characters)
- Adds timestamp + random number for uniqueness
- Prevents filename conflicts

---

## 🔐 **Approval System Constants** (Lines 30-52)

```javascript
const APPROVAL_STATUSES = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};
```

**Purpose**: Defines status values for buyer-seller pickup approvals

```javascript
let approvalsIndexEnsured = false;
const ensureApprovalsIndex = async (db) => {
    if (approvalsIndexEnsured) return;
    const approvalsCollection = db.collection('itemApprovals');
    await approvalsCollection.createIndex(
        { itemId: 1, buyerId: 1, sellerId: 1 },
        { unique: true }
    );
    approvalsIndexEnsured = true;
};
```

**Purpose**: Ensures database index exists (one-time operation)
- Prevents duplicate approval requests
- Improves query performance

---

## 🌍 **Location & Pickup Constants** (Lines 54-60)

```javascript
const MAX_PICKUP_LOCATIONS = 1;
const CAROUSEL_WINDOW_SECONDS = 7 * 24 * 60 * 60; // 7 days
const CAROUSEL_NOTICE_SECONDS = CAROUSEL_WINDOW_SECONDS - (2 * 24 * 60 * 60); // 5 days
const MAX_LAT = 90;
const MIN_LAT = -90;
const MAX_LNG = 180;
const MIN_LNG = -180;
```

**Purpose**: 
- Maximum pickup locations per item
- Carousel window: Items featured for 7 days
- Carousel notice: Notify sellers 2 days before removal
- Geographic coordinate limits

---

## 🛠️ **Helper Functions**

### **1. Coordinate Parsing** (Lines 62-77)

```javascript
const parseCoordinate = (value, min, max) => {
    if (typeof value === 'undefined' || value === null || value === '') {
        return undefined;
    }
    const num = Number(value);
    if (Number.isNaN(num) || !Number.isFinite(num)) {
        return undefined;
    }
    if (num < min || num > max) {
        return undefined;
    }
    return num;
};
const parseLatitude = (value) => parseCoordinate(value, MIN_LAT, MAX_LAT);
const parseLongitude = (value) => parseCoordinate(value, MIN_LNG, MAX_LNG);
```

**Purpose**: Validates and parses latitude/longitude coordinates
- Ensures coordinates are within valid ranges
- Returns `undefined` for invalid values

### **2. Pickup Locations Parsing** (Lines 79-126)

```javascript
const parsePickupLocationsInput = (input) => {
    // Parses JSON string or array
    // Validates required fields: label, city, address
    // Optionally includes lat/lng
    // Limits to MAX_PICKUP_LOCATIONS
}
```

**Purpose**: Parses and validates pickup location data from requests

### **3. Pickup Locations Sanitization** (Lines 128-146)

```javascript
const sanitizePickupLocations = (locations = [], canViewFullDetails = false) => {
    // Returns basic info (label, city, area) by default
    // Adds address, lat, lng only if canViewFullDetails = true
}
```

**Purpose**: Hides sensitive location data from unauthorized users
- Sellers and approved buyers see full details
- Others see only city/area

### **4. Distance Calculation** (Lines 148-161)

```javascript
const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
    // Calculates great-circle distance between two coordinates
    // Returns distance in kilometers
}
```

**Purpose**: Calculates real-world distance between buyer and pickup location
- Uses Haversine formula for sphere
- Used to sort pickup options by distance

### **5. City Match Scoring** (Lines 163-180)

```javascript
const computeCityMatchScore = (location, buyerCity = '', buyerArea = '') => {
    let score = 0;
    if (buyerCity && location.city && 
        location.city.toLowerCase() === buyerCity.toLowerCase()) {
        score += 2;
    }
    if (buyerArea && location.area && 
        location.area.toLowerCase() === buyerArea.toLowerCase()) {
        score += 1;
    }
    return score;
};
```

**Purpose**: Scores pickup locations based on city/area match
- Used when coordinates are not available
- City match = +2 points, Area match = +1 point

### **6. Query Building** (Lines 182-208)

```javascript
const buildItemQuery = (params) => {
    // Builds MongoDB query from request parameters
    // Supports: name (regex), category, condition, age_years, city, area
}
```

**Purpose**: Constructs database queries for filtering items

---

## 🛣️ **API Routes**

### **1. GET `/` - Get All Items** (Lines 213-230)

```javascript
router.get('/', async (req, res, next) => {
    // 1. Releases expired reservations
    // 2. Builds query from request parameters
    // 3. Finds items matching query
    // 4. Returns JSON array of items
});
```

**Access**: Public  
**Purpose**: List/search all items with optional filters

---

### **2. GET `/carousel` - Get Featured Items** (Lines 232-281)

```javascript
router.get('/carousel', async (req, res, next) => {
    // 1. Finds items added in last 7 days (not sold)
    // 2. Checks for items approaching carousel exit (5+ days old)
    // 3. Sends notifications to sellers about upcoming exit
    // 4. Marks items as notified
    // 5. Returns up to 20 newest items
});
```

**Access**: Public  
**Purpose**: Gets items for the homepage carousel
- Items featured for 7 days
- Notifies sellers 2 days before removal

---

### **3. GET `/reservations/me` - Get My Reservations** (Lines 284-299)

```javascript
router.get('/reservations/me', authenticate, async (req, res, next) => {
    // Returns all items reserved by the logged-in user
});
```

**Access**: Authenticated users only  
**Purpose**: Get all items currently reserved by the user

---

### **4. GET `/mine` - Get My Items** (Lines 301-318)

```javascript
router.get('/mine', authenticate, async (req, res, next) => {
    // Returns all items owned by the logged-in user
    // Sorted by date_added (newest first)
    // Limited to 100 items
});
```

**Access**: Authenticated users only  
**Purpose**: Get all items uploaded by the user

---

### **5. GET `/admin/stats` - Admin Statistics** (Lines 321-428)

```javascript
router.get('/admin/stats', authenticate, authorizeAdmin, async (req, res, next) => {
    // Returns comprehensive statistics:
    // - Total users, new users (last 30 days)
    // - Total items, items by status
    // - Top 5 categories
    // - Recent items (6 newest)
    // - Monthly item counts (last 6 months)
});
```

**Access**: Admin only  
**Purpose**: Dashboard statistics for administrators

---

### **6. GET `/admin/all` - Admin Get All Items** (Lines 431-475)

```javascript
router.get('/admin/all', authenticate, authorizeAdmin, async (req, res, next) => {
    // Returns all items with owner details (email, name)
    // Enriched with owner information from users collection
});
```

**Access**: Admin only  
**Purpose**: Admin view of all items with owner details

---

### **7. GET `/:id` - Get Single Item** (Lines 478-494)

```javascript
router.get('/:id', async (req, res, next) => {
    // Finds item by ID
    // Returns 404 if not found
});
```

**Access**: Public  
**Purpose**: Get detailed information about a specific item

---

### **8. POST `/` - Create New Item** (Lines 500-576)

```javascript
router.post('/', authenticate, upload.array('images', MAX_IMAGES_PER_ITEM), async (req, res, next) => {
    // 1. Generates unique ID (increments from highest existing ID)
    // 2. Sets ownerId from authenticated user
    // 3. Processes uploaded images (max 5)
    // 4. Parses pickup locations
    // 5. Validates coordinates
    // 6. Sets status to 'available'
    // 7. Saves to database
    // 8. Notifies admins about new item
    // 9. Returns created item
});
```

**Access**: Authenticated users only  
**Purpose**: Upload a new item for sale  
**Features**:
- Image upload (up to 5 images)
- Automatic ID generation
- Owner assignment
- Admin notifications

---

### **9. PUT `/:id` - Update Item** (Lines 579-656)

```javascript
router.put('/:id', authenticate, async(req, res,next) => {
    // 1. Finds item by ID
    // 2. Checks ownership or admin role
    // 3. Updates fields from request body:
    //    - category, condition, age_days, description
    //    - city, area, mapUrl, price
    //    - lat, lng (validated)
    //    - pickupLocations
    // 4. Calculates age_years from age_days
    // 5. Saves updated item
    // 6. Notifies users interested in this category
});
```

**Access**: Item owner or admin  
**Purpose**: Update item details  
**Validation**: Only owner or admin can update

---

### **10. POST `/:id/request-approval` - Request Pickup Approval** (Lines 658-712)

```javascript
router.post('/:id/request-approval', authenticate, async (req, res, next) => {
    // 1. Finds item
    // 2. Prevents owners from requesting approval for their own items
    // 3. Checks for existing approval request
    // 4. Creates new approval request (status: 'pending')
    // 5. Notifies seller about pickup request
    // 6. Returns approval document
});
```

**Access**: Authenticated users (not item owner)  
**Purpose**: Buyer requests seller approval to pick up item  
**Business Logic**: 
- One approval request per buyer-item-seller combination
- Sellers receive notification

---

### **11. POST `/:id/approve-buyer` - Approve Buyer** (Lines 714-823)

```javascript
router.post('/:id/approve-buyer', authenticate, async (req, res, next) => {
    // 1. Validates buyerId in request
    // 2. Finds item (must exist, not sold)
    // 3. Checks seller ownership
    // 4. Updates approval status to 'approved'
    // 5. Creates or updates chat (sets isApproved = true)
    // 6. Reserves item for buyer (24-hour deadline)
    // 7. Sets status to 'reserved'
    // 8. Notifies buyer of approval
    // 9. Returns approval and chatId
});
```

**Access**: Item owner (seller) only  
**Purpose**: Seller approves a buyer's pickup request  
**Important**: 
- Item is reserved for 24 hours after approval
- Chat is automatically created/updated
- Buyer receives notification

---

### **12. GET `/:id/secure` - Get Secure Item Details** (Lines 825-922)

```javascript
router.get('/:id/secure', authenticate, async (req, res, next) => {
    // Returns different data based on user role:
    
    // If user is seller (owner):
    // - List of all approval requests
    // - Buyer names/emails
    // - Approval statuses
    // - Chat IDs
    
    // If user is buyer:
    // - Their approval status
    // - Chat ID (if approved)
    
    // All users:
    // - Pickup locations (sanitized based on permissions)
    //   - Sellers and approved buyers: full details
    //   - Others: city/area only
});
```

**Access**: Authenticated users only  
**Purpose**: Get item details with role-based permissions  
**Security**: Hides sensitive location data from unauthorized users

---

### **13. GET `/:id/pickup-options` - Get Pickup Options** (Lines 924-1031)

```javascript
router.get('/:id/pickup-options', authenticate, async (req, res, next) => {
    // 1. Gets item pickup locations
    // 2. Checks if user can view full details (seller or approved buyer)
    // 3. If buyer provides coordinates (lat, lng):
    //    - Calculates distance to each location
    //    - Sorts by distance (closest first)
    // 4. If buyer provides city/area only:
    //    - Calculates city match score
    //    - Sorts by score (best match first)
    // 5. Returns sorted pickup options with distance/score
    // 6. Full details (address, coordinates) only if authorized
});
```

**Access**: Authenticated users only  
**Purpose**: Get pickup locations sorted by proximity or match  
**Features**:
- Distance calculation (if coordinates provided)
- City/area matching (if coordinates not available)
- Privacy protection (full details only for authorized users)

---

### **14. POST `/:id/reserve` - Reserve Item** (Lines 1034-1073)

```javascript
router.post('/:id/reserve', authenticate, async (req, res, next) => {
    // 1. Finds item
    // 2. Checks item is available (status = 'available')
    // 3. Reserves item for user (10-hour window)
    // 4. Sets status to 'reserved'
    // 5. Sets reservedByUserId and reservedUntil
    // 6. Returns updated item
});
```

**Access**: Authenticated users only  
**Purpose**: Reserve an item for 10 hours  
**Note**: Different from approval system - this is a simple reservation

---

### **15. DELETE `/admin/:id` - Admin Delete Item** (Lines 1076-1091)

```javascript
router.delete('/admin/:id', authenticate, authorizeAdmin, async(req, res,next) => {
    // Admin can delete any item by ID
    // Returns success message with adminOverride flag
});
```

**Access**: Admin only  
**Purpose**: Admin override to delete any item

---

### **16. DELETE `/:id` - Delete Item** (Lines 1094-1116)

```javascript
router.delete('/:id', authenticate, async(req, res,next) => {
    // 1. Finds item
    // 2. Checks ownership or admin role
    // 3. Deletes item
    // 4. Returns success message
});
```

**Access**: Item owner or admin  
**Purpose**: Delete an item  
**Validation**: Only owner or admin can delete

---

## 🔄 **Common Patterns**

### **1. Expired Reservation Release**
Many routes call `await releaseExpiredReservations(db, notificationService)` to automatically release items whose reservation period has expired.

### **2. Error Handling**
All routes use try-catch with `next(e)` to pass errors to Express error handler.

### **3. Authentication**
- `authenticate`: Verifies JWT token, adds `req.user`
- `authorizeAdmin`: Checks if `req.user.role === 'admin'`

### **4. Notifications**
The file integrates with the notification service to:
- Notify admins of new items
- Notify sellers of pickup requests
- Notify buyers of approvals
- Notify users of new items in their category of interest
- Notify sellers about carousel exit

### **5. Data Sanitization**
- Pickup locations are sanitized based on user permissions
- Coordinates are validated
- File names are sanitized
- Input data is parsed and validated

---

## 📊 **Database Collections Used**

1. **`secondChanceItems`**: Main items collection
2. **`itemApprovals`**: Approval requests (buyer-seller-item)
3. **`chats`**: Chat conversations between buyers and sellers
4. **`users`**: User accounts (for owner details)

---

## 🔑 **Key Concepts**

1. **Item Statuses**: `available`, `reserved`, `sold`, `pending`
2. **Approval Flow**: Request → Pending → Approved → Reserved
3. **Reservation System**: Items can be reserved with expiration timestamps
4. **Carousel**: Featured items shown on homepage for 7 days
5. **Privacy**: Location details hidden from unauthorized users
6. **Distance Sorting**: Items sorted by proximity to buyer location

---

## 🎯 **Summary**

This file is the core of the items management system. It handles:
- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ File uploads (images)
- ✅ Search and filtering
- ✅ Reservation system
- ✅ Approval workflow
- ✅ Admin features
- ✅ Location-based features
- ✅ Notifications integration
- ✅ Privacy and security

All routes follow RESTful conventions and include proper authentication, authorization, validation, and error handling.


