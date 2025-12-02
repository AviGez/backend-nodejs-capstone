require('dotenv').config();
const connectToDatabase = require('../models/db');

async function pruneToFirstThirteen() {
  const db = await connectToDatabase();
  const collection = db.collection('secondChanceItems');

  const allDocs = await collection.find({}, { projection: { id: 1 } }).toArray();
  if (!allDocs.length) {
    console.log('No items found; nothing to prune.');
    process.exit(0);
  }

  const sorted = allDocs.sort((a, b) => {
    const aNum = Number(a.id);
    const bNum = Number(b.id);
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
      return aNum - bNum;
    }
    return String(a.id).localeCompare(String(b.id));
  });

  const keepIds = sorted.slice(0, 13).map((doc) => doc.id?.toString());
  const result = await collection.deleteMany({
    id: { $nin: keepIds },
  });

  console.log(`Kept ${keepIds.length} items, deleted ${result.deletedCount || 0} extra items.`);
  process.exit(0);
}

pruneToFirstThirteen().catch((err) => {
  console.error('Failed to prune items:', err);
  process.exit(1);
});

