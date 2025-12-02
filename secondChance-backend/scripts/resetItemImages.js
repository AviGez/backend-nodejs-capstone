require('dotenv').config();
const connectToDatabase = require('../models/db');

const DEFAULT_IMAGE_POOL = [
  '/images/item01.jpeg',
  '/images/item02.jpeg',
  '/images/item03.jpeg',
  '/images/item04.jpeg',
  '/images/item05.jpeg',
  '/images/item06.jpeg',
  '/images/item07.jpeg',
  '/images/item08.jpeg',
  '/images/item09.jpeg',
  '/images/item10.jpeg',
  '/images/item11.jpeg',
  '/images/item12.jpeg',
  '/images/item13.jpeg',
];

async function resetItemImages() {
  const db = await connectToDatabase();
  const collection = db.collection('secondChanceItems');

  const cursor = collection.find({}, { projection: { _id: 1 } }).sort({ id: 1 });
  const updates = [];
  let index = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    const image = DEFAULT_IMAGE_POOL[index % DEFAULT_IMAGE_POOL.length];
    updates.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { image } },
      },
    });
    index += 1;
    if (updates.length >= 500) {
      await collection.bulkWrite(updates, { ordered: false });
      updates.length = 0;
    }
  }

  if (updates.length) {
    await collection.bulkWrite(updates, { ordered: false });
  }

  console.log(`Assigned default images to ${index} items.`);
  process.exit(0);
}

resetItemImages().catch((err) => {
  console.error('Failed to reset item images:', err);
  process.exit(1);
});

