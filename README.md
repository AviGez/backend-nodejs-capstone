# SecondChance marketplace

## Environment variables

### Backend (`secondChance-backend/.env`)

| Variable | Description |
| --- | --- |
| `MONGO_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing auth tokens |
| `FRONTEND_BASE_URL` | Base URL the backend should redirect users to (e.g. `http://localhost:3000`) |
| `BACKEND_PUBLIC_URL` | Optional: public URL that serves item images (used for Stripe product thumbnails) |
| `STRIPE_SECRET_KEY` | Stripe secret API key (ignored if `PAYMENTS_MODE=demo`) |
| `STRIPE_PUBLIC_KEY` | Stripe publishable key (shared with the frontend) |
| `STRIPE_CURRENCY` | Currency code for prices (defaults to `usd`) |
| `PAYMENTS_MODE` | `stripe` (ברירת מחדל) או `demo` כדי לדמות תשלום ללא Stripe |
| `STRIPE_SUCCESS_URL` | Optional explicit success URL. Defaults to `${FRONTEND_BASE_URL}/app/payment-success` |
| `STRIPE_CANCEL_URL` | Optional cancel URL. Defaults to `${FRONTEND_BASE_URL}/app/payment-cancel` |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Placeholders for the future PayPal integration |
| `OPENAI_API_KEY` | API key for generating AI descriptions |

### Frontend (`secondChance-frontend/.env`)

| Variable | Description |
| --- | --- |
| `REACT_APP_BACKEND_URL` | The backend origin, e.g. `http://localhost:3060` |
| `REACT_APP_STRIPE_PUBLIC_KEY` | Stripe publishable key (matches backend configuration) |

## Payments quick start

1. Set the environment variables above.  
2. Restart the backend (`npm run dev` inside `secondChance-backend`).  
3. Restart the frontend (`npm start` inside `secondChance-frontend`).  
4. Paid items now show a **Buy now** button. במצב `stripe` – זה מפנה ל‑Stripe Checkout; במצב `demo` – זה מדמה תשלום ומחזיר ישר ל־`/app/payment-success`.  
5. After a successful payment you are redirected back to `/app/payment-success`, the item is marked as *sold*, and an `orders` record is stored for future use.

## Demo marketplace seeding

- הסקריפט `secondChance-backend/util/import-mongo/index.js` לא רץ אוטומטית יותר. להפעלה ידנית:
  ```bash
  cd secondChance-backend/util/import-mongo
  node index.js
  ```
- הוא מזריע את פריטי הדמו מתוך `secondChanceItems.json` ומוסיף פריטים רנדומליים עם תמונות הבסיס (`/images/item01.jpeg` …).  
- אפשר להוריד סט מורחב של תמונות (200 יחידות) עם:
  ```bash
  cd secondChance-backend
  npm run fetch:demo-images
  ```
  ואז להריץ שוב את ה‑seed.

## Docker & Compose

- לבנייה ידנית:
  ```bash
  docker build -t secondchance-backend ./secondChance-backend
  docker build -t secondchance-frontend ./secondChance-frontend
  ```
- להרצת כל הערימה (Mongo + Backend + Frontend):
  ```bash
  docker compose up --build
  ```
  זה מעלה:
  - MongoDB על `mongodb://root:example@localhost:27017`
  - Backend על `http://localhost:3060`
  - Frontend על `http://localhost:3000`

## CI/CD

- קיים GitHub Action (`.github/workflows/ci.yml`) שמריץ build/test לשני החלקים ומייצר Docker images ל‑GHCR (או רישום אחר).  
- להפקת images נדרש להוסיף סודות רישום אם לא משתמשים ב‑GHCR ברירת מחדל.  
- אפשר להוסיף שלב deploy (SSH, Render, ECS וכו’) לפי סביבת ההפצה שלכם, אחרי שה‑images נדחפים.