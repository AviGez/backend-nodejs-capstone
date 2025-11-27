# SecondChance marketplace

## Environment variables

### Backend (`secondChance-backend/.env`)

| Variable | Description |
| --- | --- |
| `MONGO_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing auth tokens |
| `FRONTEND_BASE_URL` | Base URL the backend should redirect users to (e.g. `http://localhost:3000`) |
| `BACKEND_PUBLIC_URL` | Optional: public URL that serves item images (used for Stripe product thumbnails) |
| `STRIPE_SECRET_KEY` | **Required for payments.** Stripe secret API key |
| `STRIPE_PUBLIC_KEY` | Stripe publishable key (shared with the frontend for Checkout) |
| `STRIPE_CURRENCY` | Currency code for prices (defaults to `usd`) |
| `STRIPE_SUCCESS_URL` | Optional explicit success URL. Defaults to `${FRONTEND_BASE_URL}/app/payment-success` |
| `STRIPE_CANCEL_URL` | Optional cancel URL. Defaults to `${FRONTEND_BASE_URL}/app/payment-cancel` |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Placeholders for the future PayPal integration |

### Frontend (`secondChance-frontend/.env`)

| Variable | Description |
| --- | --- |
| `REACT_APP_BACKEND_URL` | The backend origin, e.g. `http://localhost:3060` |
| `REACT_APP_STRIPE_PUBLIC_KEY` | Stripe publishable key (matches backend configuration) |

## Payments quick start

1. Set the environment variables above.  
2. Restart the backend (`npm run dev` inside `secondChance-backend`).  
3. Restart the frontend (`npm start` inside `secondChance-frontend`).  
4. Paid items now show a **Buy now** button that launches Stripe Checkout.  
5. After a successful payment you are redirected back to `/app/payment-success`, the item is marked as *sold*, and an `orders` record is stored for future use.