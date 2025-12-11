# SecondChance marketplace

## Environment variables

### Backend (`backend/.env`)

| Variable | Description |
| --- | --- |
| `MONGO_URL` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing auth tokens |
| `FRONTEND_BASE_URL` | Base URL the backend should redirect users to (e.g. `http://localhost:3000`) |
| `BACKEND_PUBLIC_URL` | Optional: public URL that serves item images |

### Frontend (`frontend/.env`)

| Variable | Description |
| --- | --- |
| `REACT_APP_BACKEND_URL` | The backend origin, e.g. `http://localhost:3060` |

## Docker & Compose

- לבנייה ידנית:
  ```bash
  docker build -t secondchance-backend ./backend
  docker build -t secondchance-frontend ./frontend
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