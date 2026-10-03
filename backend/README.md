# RetailIQ Backend

Express API for RetailIQ: login and roles, products, stock, sales, dashboard, and connections to the ML and GenAI services.

## Setup

1. Apply the database changes: see `SCHEMA_ADDITIONS.md`, then run `npx prisma migrate deploy` in `../database/`.
2. Copy `.env.example` to `.env` and fill in `DATABASE_URL`, `JWT_SECRET` and `INTERNAL_KEY`.
3. Run `npm install` (Node 20 or newer).
4. Run `npm run prisma:generate` (repeat after every `npm install`).
5. Optional demo data on a fresh database: `npm run seed`.
6. Run `npm start`. The server runs on port 5000.

All environment variables are explained in `.env.example`.

## Main routes

- **Auth:** `/api/signup` (first user becomes Admin), `/api/login`, `/api/invite-staff`, `/api/set-password`
- **Inventory:** `/api/products`, `/api/stock`, `/api/products/expiry-risk`
- **Sales and dashboard:** `/api/sales`, `/api/dashboard`, `/api/staff`
- **ML and AI:** `/api/forecast/:productId`, `/api/restock-recommendations`, `/api/anomalies`, `/api/assistant`, `/api/report`, `/api/voice`

Errors are returned as `{ "error": "message" }`.