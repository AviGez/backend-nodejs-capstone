const express = require('express');
const router = express.Router();

// Import all route modules
const itemsRoutes = require('./items.routes');
const reservationsRoutes = require('./reservations.routes');
const approvalsRoutes = require('./approvals.routes');
const carouselRoutes = require('./carousel.routes');
const adminRoutes = require('./admin.routes');
const pickupRoutes = require('./pickup.routes');

// Mount all sub-routers
// Note: Order matters - more specific routes should come before generic ones
router.use('/', carouselRoutes);        // GET /carousel (before /:id)
router.use('/', reservationsRoutes);    // GET /reservations/me, POST /:id/reserve
router.use('/', adminRoutes);           // GET /admin/stats, GET /admin/all, DELETE /admin/:id
router.use('/', pickupRoutes);          // GET /:id/secure, GET /:id/pickup-options
router.use('/', approvalsRoutes);       // POST /:id/request-approval, POST /:id/approve-buyer
router.use('/', itemsRoutes);           // GET /, POST /, GET /:id, PUT /:id, DELETE /:id, GET /mine

module.exports = router;


