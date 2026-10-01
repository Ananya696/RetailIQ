# RetailIQ Backend

This folder contains the RetailIQ application/backend contribution: Express server, authentication, JWT, RBAC, product, stock, sales, and expiry-aware business logic.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`.
2. Run `npm install` in this folder.
3. Set up the database using the sibling `database/` folder.
4. From this folder, run `npm run prisma:generate` to generate the Prisma Client into this backend's `node_modules`.
5. Start the server with `npm start`.

The database schema and Prisma migrations are maintained in `../database/`.
