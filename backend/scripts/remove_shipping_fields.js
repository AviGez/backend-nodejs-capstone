const connectToDatabase = require('../models/db');

async function removeFields() {
  try {
    const db = await connectToDatabase();
    const items = db.collection('secondChanceItems');
    const payments = db.collection('payments');

    console.log('Unsetting shipping-related fields from secondChanceItems...');
    await items.updateMany({}, {
      $unset: {
        enableShipping: '',
        shippingBasePrice: '',
        shippingPricePerKm: '',
        pickupAddress: '',
        pickupCity: '',
        pickupArea: '',
        deliveryMethod: '',
        shippingAddress: '',
      }
    });

    console.log('Unsetting shipping-related fields from payments...');
    await payments.updateMany({}, {
      $unset: {
        deliveryMethod: '',
        shippingAddress: '',
      }
    });

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

removeFields();
