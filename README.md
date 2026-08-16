# Ledgerly

Ledgerly is a full-stack invoice and expense workspace for freelancers and small businesses. The current implementation contains a React web app, a NestJS REST API and PostgreSQL persistence through Prisma.

## Architecture

- `apps/web`: React 19, TypeScript and Vite frontend
- `apps/api`: NestJS API with Prisma
- PostgreSQL 17: local database supplied by Docker Compose
- `/api/v1`: versioned API base path
- `/docs`: local Swagger/OpenAPI explorer

Ledgerly is under active development. Authentication, company isolation and the remaining financial domains are not production-ready yet. Use only fictional local data.

## Prerequisites

- Node.js 22 or later
- npm 10 or later
- Docker Desktop or another Docker Compose-compatible runtime

## First-time setup

Install dependencies:

```bash
npm run install:all
```

Create local environment files from the safe templates:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Start the isolated local PostgreSQL service and wait until it is healthy:

```bash
docker compose up -d postgres
docker compose ps
```

Generate the Prisma client, apply migrations and add fictional demo customers:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Run the API and web app in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

Open `http://localhost:5173`. The API runs at `http://localhost:3000/api/v1` and Swagger at `http://localhost:3000/docs`.

## Environment variables

API variables are documented in `apps/api/.env.example`:

- `DATABASE_URL`: local PostgreSQL connection string
- `PORT`: API port
- `WEB_ORIGIN`: exact browser origin allowed by CORS

The frontend reads `VITE_API_URL` from `apps/web/.env.example`. Vite variables are public browser configuration and must never contain secrets.

Real `.env` files are ignored by Git. Production credentials must be supplied by the deployment platform’s secret manager, never committed.

## Useful commands

```bash
npm run check       # frontend lint/build and backend lint/test/build
npm run db:generate # regenerate Prisma client
npm run db:migrate  # create/apply a development migration
npm run db:seed     # idempotently add fictional development records
```

Run backend e2e tests only while a configured test/development database is available:

```bash
npm run test:e2e --prefix apps/api
```

## Database lifecycle

Prisma migrations live in `apps/api/prisma/migrations`. Review generated SQL before committing it. The seed script is additive and safe to rerun; it never deletes existing records.

To stop local services without deleting their data:

```bash
docker compose stop
```

Deleting the Docker volume permanently removes the local development database and is intentionally not included as a copy-paste command.

## Troubleshooting

- If port 5432 is occupied, stop the other PostgreSQL instance or deliberately change both the Compose mapping and `DATABASE_URL`.
- If the API reports `DATABASE_URL is not configured`, create `apps/api/.env` from its example and run API commands from the documented root scripts.
- If the browser cannot reach the API, confirm `VITE_API_URL`, `WEB_ORIGIN`, and both development servers’ ports match.
- After changing the Prisma schema, run `npm run db:generate` and then create/apply the appropriate migration.

## Quality and safety

GitHub Actions runs deterministic installs, Prisma generation, frontend lint/build and backend lint/test/build. Validation errors are rejected by the API, CORS uses one configured origin, and committed examples contain development-only credentials and fictional data.
