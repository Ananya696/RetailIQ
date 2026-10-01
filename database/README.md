# RetailIQ Database

This folder contains the PostgreSQL/Prisma database contribution: schema, relationships, and migrations.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Run `npm install` in this folder.
3. Run `npm run migrate:status` to inspect migration state.
4. Use `npm run migrate:dev` during development or `npm run migrate:deploy` for an already-created database.
5. Run `npm run generate` after schema changes.

The Prisma Client is generated into `../backend/node_modules/.prisma/client` so the backend can import it through `@prisma/client`.
