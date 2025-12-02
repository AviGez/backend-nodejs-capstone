const { ObjectId } = require('mongodb');

const normalizeObjectId = (maybeId) => {
  try {
    return new ObjectId(maybeId);
  } catch (e) {
    return null;
  }
};

module.exports = {
  normalizeObjectId,
};

