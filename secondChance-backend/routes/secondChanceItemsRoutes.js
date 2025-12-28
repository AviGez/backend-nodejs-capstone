// This file now simply re-exports the refactored items router
// All routes have been split into separate files under routes/items/
// and helper functions are in routes/utils/

const itemsRouter = require('./items');

module.exports = itemsRouter;
