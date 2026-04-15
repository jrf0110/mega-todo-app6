# Mega Todo — Ultimate Cloudflare Dev Platform Todo App

A full-stack todo application built on Cloudflare infrastructure:

- **Frontend**: Vite 5 + React 18 + TypeScript + Tailwind CSS v4 → deployed to **Cloudflare Pages**
- **API**: Hono on **Cloudflare Workers** + **D1** (SQLite at the edge)

## Project Structure

```
/
  packages/
    frontend/   # Vite + React + TypeScript SPA
    api/        # Hono on Cloudflare Workers
  package.json  # root npm workspace
  tsconfig.json # root TypeScript config
```

## Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Wrangler CLI**: `npm install -g wrangler`
- A **Cloudflare account** (free tier works)

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd mega-todo
npm install
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

### 3. Create the D1 database

```bash
wrangler d1 create mega-todo-db
```

Copy the `database_id` from the output and update `packages/api/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "mega-todo-db"
database_id = "<your-database-id>"
```

### 4. Run migrations locally

```bash
wrangler d1 execute mega-todo-db --local --file packages/api/migrations/0001_init.sql
```

### 5. Configure environment

```bash
cp packages/frontend/.env.example packages/frontend/.env
```

Edit `packages/frontend/.env` if your API runs on a different port.

## Development

Run both the frontend and API in watch mode:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:8787

The Vite dev server proxies `/api/*` requests to the Wrangler dev server automatically.

## Build

```bash
npm run build
```

Outputs:
- `packages/frontend/dist/` — static assets for Cloudflare Pages
- API is bundled by Wrangler at deploy time

## Deploy

### First-time setup

1. **Create the D1 database** (if not done during local setup):

   ```bash
   wrangler d1 create mega-todo-db
   ```

   Update `packages/api/wrangler.toml` with the returned `database_id`.

2. **Create the Cloudflare Pages project** (once):

   ```bash
   wrangler pages project create mega-todo-frontend
   ```

### Run migrations in production

Apply the initial schema to the remote D1 database:

```bash
wrangler d1 execute mega-todo-db --file packages/api/migrations/0001_init.sql
```

For subsequent migrations, add the migration file and run:

```bash
wrangler d1 execute mega-todo-db --file packages/api/migrations/<migration-file>.sql
```

### Deploy everything manually

```bash
npm run deploy
```

This runs `wrangler deploy` for the Workers API first, then `wrangler pages deploy` for the frontend.

### Deploy via GitHub Actions (CI/CD)

The repository ships with two GitHub Actions workflows:

| Workflow | Trigger | Purpose |
|---|---|---|
| `.github/workflows/ci.yml` | Push / PR | Type check, lint, and build all packages |
| `.github/workflows/deploy.yml` | Push to `main` | Deploy API then frontend to Cloudflare |

#### Required GitHub Secrets

Set these in **Settings → Secrets and variables → Actions** for your repository:

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | A Cloudflare API token with Workers and Pages permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID (found in the dashboard URL or Overview page) |

To create a suitable API token, go to [Cloudflare Dashboard → My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens) and use the **Edit Cloudflare Workers** template, then add **Cloudflare Pages: Edit** permission.

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `VITE_API_URL` | `packages/frontend/.env` | Base URL of the API (dev only — prod uses same-origin) |
| `CLOUDFLARE_API_TOKEN` | GitHub secret / shell | Token for `wrangler deploy` in CI |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub secret / shell | Cloudflare account ID for `wrangler deploy` in CI |

## Code Quality

### Lint

```bash
npm run lint          # report lint errors
npm run lint:fix      # auto-fix lint errors
```

### Format

```bash
npm run format        # write Prettier formatting
npm run format:check  # check formatting without writing
```

### Type check

```bash
npm run typecheck
```

## API Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |

More routes are added in subsequent beads (todos CRUD, tags, etc.).

## Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 |
| Frontend bundler | Vite 5 |
| Styling | Tailwind CSS v4 |
| Frontend hosting | Cloudflare Pages |
| API framework | Hono |
| API runtime | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Language | TypeScript 5 |
| Linter | ESLint 9 (flat config) |
| Formatter | Prettier 3 |
| CI/CD | GitHub Actions |
