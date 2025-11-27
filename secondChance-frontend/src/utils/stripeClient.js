import { loadStripe } from '@stripe/stripe-js';
import { urlConfig } from '../config';

const stripePromise = urlConfig.stripePublicKey
  ? loadStripe(urlConfig.stripePublicKey)
  : Promise.resolve(null);

export const getStripe = async () => {
  const stripe = await stripePromise;
  return stripe;
};

