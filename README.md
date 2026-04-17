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

Create the Cloudflare Pages project (once):

```bash
wrangler pages project create mega-todo-frontend
```

### Deploy everything

```bash
npm run deploy
```

This runs `wrangler deploy` for the Workers API first, then `wrangler pages deploy` for the frontend.

### Run migrations in production

```bash
wrangler d1 execute mega-todo-db --file packages/api/migrations/0001_init.sql
```

## Environment Variables

| Variable | Location | Description |
|---|---|---|
| `VITE_API_URL` | `packages/frontend/.env` | Base URL of the API (dev only — prod uses same-origin) |

## CI/CD

GitHub Actions workflows are located in `.github/workflows/`.

### `ci.yml` — Continuous Integration
Runs on every pull request and push to `main`:
- Typechecks both packages (`tsc --noEmit`)
- Builds both packages

### `deploy.yml` — Deployment
Runs on push to `main`:
1. **deploy-api** — deploys the Hono Workers API via `wrangler deploy`
2. **deploy-frontend** — builds the React app and deploys to Cloudflare Pages via `wrangler pages deploy dist`

Required GitHub repository secrets:
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token with Workers and Pages deploy permissions
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID

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
