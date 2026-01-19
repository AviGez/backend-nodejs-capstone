# 🔔 Notifications & 💳 Payments - How They Work

## Table of Contents
1. [Notifications System](#notifications-system)
2. [Payments System](#payments-system)
3. [How They Work Together](#how-they-work-together)

---

## 🔔 Notifications System

### Overview
The notifications system allows the app to notify users about important events like new messages, item sales, pickup requests, etc.

### Architecture

```
┌─────────────────────────────────────────────────┐
│         NOTIFICATIONS FLOW                      │
└─────────────────────────────────────────────────┘

1. Event Occurs (e.g., item sold)
   ↓
2. notificationService.createNotification()
   ↓
3. Save to MongoDB (notifications collection)
   ↓
4. User fetches notifications via API
   ↓
5. Frontend displays notification badge/count
```

### Components

#### 1. Notification Service (`notificationService`)

This is a helper service that other modules use to create notifications:

```javascript
// notificationsRoutes.js
const notificationService = {
    // Core function - creates notifications for multiple users
    async createNotification({ userIds, type, title, message, context = {} }) {
        const docs = userIds.map((userId) => ({
            userId,
            type: normalizeType(type),
            title,
            message,
            context,        // Additional data (itemId, buyerId, etc.)
            createdAt: new Date(),
            readAt: null,   // null = unread
        }));
        
        await notificationsCollection.insertMany(docs);
    },
    
    // Specific notification types
    async notifyItemSold({ sellerId, itemId, itemName, buyerId }) {
        await this.createNotification({
            userIds: [sellerId],
            type: 'itemSold',
            title: 'Your item was sold',
            message: `${itemName} has been purchased.`,
            context: { itemId, buyerId }
        });
    },
    
    async notifyPickupApprovalRequest({ sellerId, itemId, itemName, buyerId }) {
        await this.createNotification({
            userIds: [sellerId],
            type: 'pickupApprovalRequest',
            title: 'New pickup approval request',
            message: `A buyer asked to pick up ${itemName}.`,
            context: { itemId, buyerId }
        });
    },
    
    // ... more notification types
};
```

#### 2. Notification Types

```javascript
const NOTIFICATION_TYPES = {
    NEW_ITEM_CATEGORY: 'newItemInCategory',
    FEEDBACK: 'feedback',
    ITEM_RELEASED: 'itemReleased',        // Reserved item expired
    NEW_ITEM_ADMIN: 'adminNewItem',       // Admin notifications
    ITEM_SOLD: 'itemSold',                // Item was purchased
    PICKUP_APPROVAL_REQUEST: 'pickupApprovalRequest',
    CAROUSEL_EXIT_SOON: 'carouselExitSoon',
    BUYER_FLAGGED: 'buyerFlagged',        // Buyer missed pickup multiple times
};
```

#### 3. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/` | Get all user notifications |
| POST | `/api/notifications/mark-read` | Mark notifications as read |
| DELETE | `/api/notifications/:id` | Delete a notification |
| POST | `/api/notifications/preferences` | Save notification preferences |
| GET | `/api/notifications/preferences` | Get notification preferences |
| GET | `/api/notifications/admin/unread` | Get unread admin notifications count |

### How It Works - Step by Step

#### Example: Item Sold Notification

1. **Payment is completed** (in `paymentRoutes.js`):
```javascript
// After payment capture
await itemsCollection.updateOne(
    { id: payment.itemId },
    { $set: { status: 'sold', soldTo: payment.buyerId } }
);

// Create notification for seller
await notificationService.notifyItemSold({
    sellerId: payment.sellerId,
    itemId: payment.itemId,
    itemName: item.name,
    buyerId: payment.buyerId
});
```

2. **Notification is saved to MongoDB**:
```javascript
{
    _id: ObjectId("..."),
    userId: "seller_user_id",
    type: "itemSold",
    title: "Your item was sold",
    message: "Vintage Chair has been purchased. Open the chat to coordinate pickup.",
    context: {
        itemId: "item123",
        buyerId: "buyer_user_id"
    },
    createdAt: ISODate("2024-01-15T10:30:00Z"),
    readAt: null  // null = unread
}
```

3. **User fetches notifications**:
```javascript
// Frontend calls: GET /api/notifications/
// Backend returns all notifications for the user
const notifications = await notificationsCollection
    .find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
```

4. **Frontend displays**:
- Shows notification badge with count
- Lists notifications in dropdown
- Highlights unread notifications

### Database Schema

```javascript
// Collection: notifications
{
    _id: ObjectId,
    userId: String,           // Who receives the notification
    type: String,             // Notification type (itemSold, feedback, etc.)
    title: String,            // Notification title
    message: String,           // Notification message
    context: Object,          // Additional data (itemId, buyerId, etc.)
    createdAt: Date,          // When created
    readAt: Date | null      // When read (null = unread)
}

// Collection: notificationPreferences
{
    _id: ObjectId,
    userId: String,
    categories: Array,        // Which notification types user wants
    updatedAt: Date
}
```

### Real-World Usage Examples

#### 1. Chat Request Notification
```javascript
// When buyer opens chat with seller
await notificationService.createNotification({
    userIds: [sellerId],
    type: 'chatRequest',
    title: 'New chat request',
    message: `${buyerName} wants to chat about ${itemName}`,
    context: { itemId, chatId }
});
```

#### 2. Item Released Notification
```javascript
// When reserved item expires
await notificationService.notifyItemReleased({
    userId: buyerId,
    itemId: item.id,
    itemName: item.name
});
```

#### 3. Admin Notification
```javascript
// When buyer misses pickup multiple times
await notificationService.notifyAdminsBuyerNoShow({
    buyerId: user._id.toString(),
    buyerName: displayName,
    email: user.email,
    count: user.pickupTimeoutCount
});
```

---

## 💳 Payments System

### Overview
The payments system handles the purchase flow using PayPal Sandbox (simulated payments for development).

### Architecture

```
┌─────────────────────────────────────────────────┐
│         PAYMENT FLOW                            │
└─────────────────────────────────────────────────┘

1. User clicks "Buy" on item
   ↓
2. Frontend calls: POST /api/payments/create-order
   ↓
3. Backend creates payment order (status: pending)
   ↓
4. Frontend redirects to PayPal (or simulates)
   ↓
5. User approves payment
   ↓
6. Frontend calls: POST /api/payments/capture-order
   ↓
7. Backend updates payment (status: completed)
   ↓
8. Backend marks item as sold
   ↓
9. Notification sent to seller
```

### Components

#### 1. Create Payment Order

```javascript
// paymentRoutes.js
router.post('/create-order', authenticate, async (req, res) => {
    const { itemId, amount } = req.body;
    
    // 1. Validate item exists
    const item = await itemsCollection.findOne({ id: itemId });
    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }
    
    // 2. Check item is available
    if (item.status === 'sold') {
        return res.status(400).json({ error: 'Item already sold' });
    }
    
    // 3. Validate price matches
    if (item.price !== amount) {
        return res.status(400).json({ error: 'Price mismatch' });
    }
    
    // 4. Check buyer is not seller
    if (item.ownerId === req.user.id) {
        return res.status(400).json({ error: 'Cannot buy your own item' });
    }
    
    // 5. Create payment order
    const payment = {
        orderId: `SANDBOX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        provider: 'paypal-sandbox',
        itemId,
        buyerId: req.user.id,
        sellerId: item.ownerId,
        amount,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    
    await paymentsCollection.insertOne(payment);
    
    res.json({ 
        orderId: payment.orderId, 
        amount: payment.amount, 
        provider: payment.provider 
    });
});
```

#### 2. Capture Payment (Complete Purchase)

```javascript
router.post('/capture-order', authenticate, async (req, res) => {
    const { orderId } = req.body;
    
    // 1. Find payment order
    const payment = await paymentsCollection.findOne({ orderId });
    if (!payment) {
        return res.status(404).json({ error: 'Order not found' });
    }
    
    // 2. Verify buyer owns this order
    if (payment.buyerId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // 3. Check order is still pending
    if (payment.status !== 'pending') {
        return res.status(400).json({ error: `Order already ${payment.status}` });
    }
    
    // 4. Update payment status to completed
    await paymentsCollection.updateOne(
        { orderId },
        {
            $set: {
                status: 'completed',
                completedAt: new Date(),
                updatedAt: new Date(),
                providerResponse: { simulated: true },
            },
        }
    );
    
    // 5. Mark item as sold
    await itemsCollection.updateOne(
        { id: payment.itemId },
        {
            $set: {
                status: 'sold',
                soldTo: payment.buyerId,
                soldAt: new Date(),
                isPaid: true,
            },
        }
    );
    
    // 6. Send notification to seller (via notificationService)
    // This happens in the route that calls capture-order
    
    res.json({ success: true, orderId, status: 'completed' });
});
```

#### 3. Cancel Payment

```javascript
router.post('/cancel-order', authenticate, async (req, res) => {
    const { orderId } = req.body;
    
    const payment = await paymentsCollection.findOne({ orderId });
    
    // Only allow canceling pending orders
    if (payment.status !== 'pending') {
        return res.status(400).json({ error: `Cannot cancel ${payment.status} order` });
    }
    
    await paymentsCollection.updateOne(
        { orderId },
        {
            $set: {
                status: 'cancelled',
                cancelledAt: new Date(),
                updatedAt: new Date(),
            },
        }
    );
    
    res.json({ success: true, orderId, status: 'cancelled' });
});
```

### Database Schema

```javascript
// Collection: payments
{
    _id: ObjectId,
    orderId: String,          // Unique order ID (SANDBOX-...)
    provider: String,          // 'paypal-sandbox'
    itemId: String,           // Which item was purchased
    buyerId: String,          // Who bought it
    sellerId: String,         // Who sold it
    amount: Number,           // Payment amount
    status: String,           // 'pending' | 'completed' | 'cancelled'
    createdAt: Date,
    updatedAt: Date,
    completedAt: Date | null,
    cancelledAt: Date | null,
    providerResponse: Object  // PayPal response (if real integration)
}
```

### Payment Status Flow

```
pending → completed ✅
pending → cancelled ❌
completed → (cannot change)
cancelled → (cannot change)
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-order` | Create new payment order |
| POST | `/api/payments/capture-order` | Complete/capture payment |
| POST | `/api/payments/cancel-order` | Cancel payment order |
| GET | `/api/payments/my-purchases` | Get purchase history |
| GET | `/api/payments/my-sales` | Get sales history |
| GET | `/api/payments/paypal-config` | Get PayPal client ID |

---

## 🔗 How They Work Together

### Complete Purchase Flow with Notifications

```javascript
// 1. User clicks "Buy" on item
// Frontend: POST /api/payments/create-order
{
    itemId: "item123",
    amount: 50
}

// 2. Backend creates payment order
const payment = {
    orderId: "SANDBOX-1234567890-abc123",
    itemId: "item123",
    buyerId: "buyer_user_id",
    sellerId: "seller_user_id",
    amount: 50,
    status: "pending"
};
await paymentsCollection.insertOne(payment);

// 3. User approves payment (PayPal or simulated)
// Frontend: POST /api/payments/capture-order
{
    orderId: "SANDBOX-1234567890-abc123"
}

// 4. Backend completes payment
await paymentsCollection.updateOne(
    { orderId },
    { $set: { status: 'completed', completedAt: new Date() } }
);

// 5. Backend marks item as sold
await itemsCollection.updateOne(
    { id: payment.itemId },
    { $set: { status: 'sold', soldTo: payment.buyerId } }
);

// 6. Send notification to seller
await notificationService.notifyItemSold({
    sellerId: payment.sellerId,
    itemId: payment.itemId,
    itemName: item.name,
    buyerId: payment.buyerId
});

// 7. Notification saved to MongoDB
{
    userId: "seller_user_id",
    type: "itemSold",
    title: "Your item was sold",
    message: "Vintage Chair has been purchased...",
    context: { itemId: "item123", buyerId: "buyer_user_id" },
    readAt: null
}

// 8. Seller sees notification badge update
// Frontend polls: GET /api/notifications/
// Shows: "1 new notification"
```

### Integration Points

#### 1. Payment → Notification
- When payment is completed → notify seller
- When payment is cancelled → (optional notification)

#### 2. Item → Notification
- When item is reserved → notify seller
- When reservation expires → notify buyer (item released)
- When pickup is requested → notify seller

#### 3. Chat → Notification
- When chat is opened → notify seller
- When message is sent → (real-time via Socket.IO, not notification)

#### 4. Admin → Notification
- When buyer misses pickup → notify admins
- When new item needs approval → notify admins

---

## 📊 Data Flow Diagrams

### Notification Creation Flow

```
┌─────────────┐
│   Event     │  (e.g., item sold)
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ notificationService │  .createNotification()
│   .notifyItemSold() │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   MongoDB           │  notifications collection
│   insertMany()      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   User fetches      │  GET /api/notifications/
│   notifications     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   Frontend displays │  Badge, dropdown, list
└─────────────────────┘
```

### Payment Flow

```
┌─────────────┐
│   User      │  Clicks "Buy"
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  Create Order       │  POST /api/payments/create-order
│  (status: pending)  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  PayPal Approval    │  (or simulated)
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Capture Order      │  POST /api/payments/capture-order
│  (status: completed)│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Update Item        │  status: 'sold'
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Notify Seller      │  notificationService.notifyItemSold()
└─────────────────────┘
```

---

## 🔍 Key Differences

| Feature | Notifications | Payments |
|---------|--------------|----------|
| **Purpose** | Inform users about events | Process purchases |
| **Storage** | `notifications` collection | `payments` collection |
| **Lifecycle** | Created → Read → Deleted | Created → Completed/Cancelled |
| **User Action** | View, mark read, delete | Create, approve, cancel |
| **Integration** | Used by many modules | Standalone but triggers notifications |
| **Real-time** | Polling (can be enhanced with Socket.IO) | Immediate (API calls) |

---

## 💡 Best Practices

### Notifications
1. **Don't spam** - Only notify for important events
2. **Use context** - Include itemId, buyerId for easy navigation
3. **Clear messages** - Users should understand what happened
4. **Mark as read** - Allow users to dismiss notifications
5. **Preferences** - Let users choose what they want to be notified about

### Payments
1. **Validate everything** - Price, item availability, buyer authorization
2. **Idempotency** - Same orderId shouldn't be processed twice
3. **Status checks** - Don't allow invalid state transitions
4. **Logging** - Log all payment events for debugging
5. **Notifications** - Always notify seller when payment completes

---

## 🚀 Future Enhancements

### Notifications
- Real-time push notifications (Socket.IO)
- Email notifications
- SMS notifications
- Notification grouping
- Rich notifications (with images)

### Payments
- Real PayPal integration (not sandbox)
- Stripe integration
- Refund support
- Payment receipts
- Escrow system

