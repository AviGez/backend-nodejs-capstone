const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY || '';
const stripeApiVersion = process.env.STRIPE_API_VERSION || '2024-06-20';
const paymentsMode = (process.env.PAYMENTS_MODE || 'stripe').toLowerCase();

let stripeClient = null;
if (stripeSecretKey && paymentsMode === 'stripe') {
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
const isDemoPayments = paymentsMode === 'demo';

module.exports = {
    getStripeClient,
    stripePublicKey,
    paypalConfig,
    paymentsMode,
    isDemoPayments,
};

