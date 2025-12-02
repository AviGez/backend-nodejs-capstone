require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const path = require('path');

// MongoDB connection URL with authentication options
const url = `${process.env.MONGO_URL}`;
const filename = `${__dirname}/secondChanceItems.json`;
const dbName = 'secondChance';
const collectionName = 'secondChanceItems';
const TARGET_ITEM_COUNT = 200;
const MAX_PICKUP_LOCATIONS = 3;
const IMAGES_DIR = path.join(__dirname, '..', '..', 'public', 'images');

// notice you have to load the array of items into the data object
const data = JSON.parse(fs.readFileSync(filename, 'utf8')).docs;

const DEFAULT_IMAGE_POOL = Array.from({ length: 33 }, (_, idx) => {
    const padded = String(idx + 1).padStart(2, '0');
    return `/images/item${padded}.jpeg`;
});
let imagePool = DEFAULT_IMAGE_POOL.slice();
let imageCursor = 0;
const nextImagePath = () => {
    if (!imagePool.length) {
        return `/images/item01.jpeg`;
    }
    const image = imagePool[imageCursor % imagePool.length];
    imageCursor += 1;
    return image;
};

const categories = ['Living', 'Bedroom', 'Kitchen', 'Office', 'Outdoor', 'Kids', 'Electronics'];
const conditions = ['New', 'Like New', 'Older'];
const namePrefixes = ['Cozy', 'Vintage', 'Modern', 'Stylish', 'Compact', 'Premium', 'Minimal'];
const nameItems = ['Sofa', 'Desk', 'Lamp', 'Bookshelf', 'Chair', 'Table', 'Storage Bench', 'Coffee Table', 'Plant Stand'];
const cities = [
    { city: 'Tel Aviv', area: 'Center', lat: 32.0853, lng: 34.7818 },
    { city: 'Jerusalem', area: 'Jerusalem', lat: 31.7683, lng: 35.2137 },
    { city: 'Haifa', area: 'North', lat: 32.7940, lng: 34.9896 },
    { city: 'Beer Sheva', area: 'South', lat: 31.2520, lng: 34.7915 },
    { city: 'Ramat Gan', area: 'Center', lat: 32.0823, lng: 34.8106 },
    { city: 'Netanya', area: 'Sharon', lat: 32.3215, lng: 34.8532 },
    { city: 'Herzliya', area: 'Sharon', lat: 32.1656, lng: 34.8436 },
    { city: 'Ashdod', area: 'South', lat: 31.8014, lng: 34.6435 },
];
const pickupLabels = ['Home pickup', 'Work pickup', 'Storage locker', 'Friend drop-off', 'Community center'];

function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const ownerPool = [
    { ownerId: 'demo-owner-1', ownerEmail: 'demo1@secondchance.app' },
    { ownerId: 'demo-owner-2', ownerEmail: 'demo2@secondchance.app' },
    { ownerId: 'demo-owner-3', ownerEmail: 'demo3@secondchance.app' },
];

const buildPickupLocations = (primaryCityData) => {
    const count = randomInt(1, MAX_PICKUP_LOCATIONS);
    const locations = [];

    const addLocation = (cityData, label) => {
        if (!cityData) {
            return;
        }
        locations.push({
            label,
            city: cityData.city,
            area: cityData.area,
            address: `${randomInt(10, 250)} ${cityData.area || 'Main'} St, ${cityData.city}`,
            lat: cityData.lat,
            lng: cityData.lng,
        });
    };

    addLocation(primaryCityData, 'Primary pickup');
    while (locations.length < count) {
        addLocation(randomFrom(cities), randomFrom(pickupLabels));
    }

    return locations.slice(0, MAX_PICKUP_LOCATIONS);
};

const buildDemoItem = (idNumber) => {
    const cityData = randomFrom(cities);
    const { city, area } = cityData;
    const owner = randomFrom(ownerPool);
    const ageDays = randomInt(30, 1800);
    const price = Math.random() < 0.3 ? 0 : randomInt(20, 400);
    const imagePath = nextImagePath();
    const createdSeconds = Math.floor((Date.now() - randomInt(7, 365) * 86400000) / 1000);
    const itemName = `${randomFrom(namePrefixes)} ${randomFrom(nameItems)}`;

    return {
        id: idNumber.toString(),
        name: itemName,
        category: randomFrom(categories),
        condition: randomFrom(conditions),
        posted_by: owner.ownerId,
        ownerId: owner.ownerId,
        ownerEmail: owner.ownerEmail,
        zipcode: randomInt(90000, 99999).toString(),
        date_added: createdSeconds,
        age_days: ageDays,
        age_years: Number((ageDays / 365).toFixed(1)),
        description: `${itemName} in excellent shape looking for a new home. Perfect addition to your space.`,
        image: imagePath,
        comments: [],
        price,
        status: 'available',
        reservedByUserId: null,
        reservedUntil: null,
        averageRating: 0,
        ratingCount: 0,
        ratings: [],
        city,
        area,
        mapUrl: '',
        lat: cityData.lat,
        lng: cityData.lng,
        pickupLocations: buildPickupLocations(cityData),
    };
};

data.forEach((doc) => {
    const cityData = randomFrom(cities);
    doc.image = nextImagePath();
    doc.city = doc.city || cityData.city;
    doc.area = doc.area || cityData.area;
    doc.lat = typeof doc.lat === 'number' ? doc.lat : cityData.lat;
    doc.lng = typeof doc.lng === 'number' ? doc.lng : cityData.lng;
    doc.status = doc.status || 'available';
    doc.reservedByUserId = null;
    doc.reservedUntil = null;
    doc.averageRating = doc.averageRating || 0;
    doc.ratingCount = doc.ratingCount || 0;
    doc.ratings = Array.isArray(doc.ratings) ? doc.ratings : [];
    doc.price = typeof doc.price === 'number' ? doc.price : (Math.random() < 0.3 ? 0 : randomInt(20, 400));
    doc.mapUrl = doc.mapUrl || '';
    doc.pickupLocations = doc.pickupLocations || buildPickupLocations(cityData);
});

async function ensureMinimumItems(collection) {
    const count = await collection.countDocuments();
    if (count >= TARGET_ITEM_COUNT) {
        console.log(`Marketplace already has ${count} items`);
        return;
    }

    const needed = TARGET_ITEM_COUNT - count;
    const maxIdDoc = await collection.aggregate([
        {
            $addFields: {
                numericId: {
                    $convert: {
                        input: '$id',
                        to: 'int',
                        onError: 0,
                        onNull: 0
                    }
                }
            }
        },
        { $sort: { numericId: -1 } },
        { $limit: 1 }
    ]).toArray();
    let nextId = (maxIdDoc[0]?.numericId || 0) + 1;

    const docs = [];
    for (let i = 0; i < needed; i += 1) {
        docs.push(buildDemoItem(nextId));
        nextId += 1;
    }
    await collection.insertMany(docs);
    console.log(`Seeded ${docs.length} demo items to reach ${TARGET_ITEM_COUNT}`);
}

// connect to database and insert data into the collection
async function loadData() {
    const client = new MongoClient(url);

    try {
        await client.connect();
        console.log("Connected successfully to server");

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const existingCount = await collection.countDocuments();
        if (existingCount === 0) {
            const insertResult = await collection.insertMany(data);
            console.log('Inserted base documents:', insertResult.insertedCount);
        } else {
            console.log(`Marketplace already seeded with ${existingCount} base items`);
        }

        await ensureMinimumItems(collection);
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

if (require.main === module) {
    loadData();
}

module.exports = {
    loadData,
  };
