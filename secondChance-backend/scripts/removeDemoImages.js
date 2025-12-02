require('dotenv').config();
const connectToDatabase = require('../models/db');

const DEMO_PATTERN = '/images/demo-item-';

async function removeDemoImageReferences() {
  const db = await connectToDatabase();
  const collection = db.collection('secondChanceItems');

  const result = await collection.updateMany(
    { image: { $regex: DEMO_PATTERN, $options: 'i' } },
    { $unset: { image: '' } }
  );

  console.log(`Cleared demo-image paths from ${result.modifiedCount || 0} items.`);
  process.exit(0);
}

removeDemoImageReferences().catch((err) => {
  console.error('Failed to remove demo images:', err);
  process.exit(1);
});

