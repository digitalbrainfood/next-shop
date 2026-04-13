import { loadStripe } from '@stripe/stripe-js';

// These will be set via environment variables
// For development, create a .env.local file with:
// NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
// STRIPE_SECRET_KEY=sk_test_...

let stripePromise;

export const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    }
    return stripePromise;
};
