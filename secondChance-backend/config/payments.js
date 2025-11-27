const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY || '';
const stripeApiVersion = process.env.STRIPE_API_VERSION || '2024-06-20';

let stripeClient = null;
if (stripeSecretKey) {
    stripeClient = new Stripe(stripeSecretKey, {
        apiVersion: stripeApiVersion,
    });
}

const paypalConfig = {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    // Placeholder: future PayPal integration can use the config above.
};

const getStripeClient = () => stripeClient;

module.exports = {
    getStripeClient,
    stripePublicKey,
    paypalConfig,
};

