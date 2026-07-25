# COD Risk Scorer — Shopify App

A Shopify app for Pakistani ecommerce store owners that scores incoming
Cash-on-Delivery (COD) orders by customer delivery-success history, using a
cross-store shared (anonymized) phone risk database.

See [`COD_RISK_APP_INSTRUCTIONS.md`](./COD_RISK_APP_INSTRUCTIONS.md) for the full spec.

## Tech Stack

- **Backend**: NestJS (TypeScript) + TypeORM
- **Database**: PostgreSQL (hosted on Railway)
- **Auth**: Shopify OAuth session tokens (no JWT)
- **Encryption**: AES-256-GCM + SHA-256 HMAC (Node `crypto`)
- **Docs**: Swagger

## Getting Started

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# then fill in SHOPIFY_*, DB_*, ENCRYPTION_KEY, HASH_SECRET, SESSION_SECRET
# generate secrets with: openssl rand -hex 32

# Run in watch mode
npm run start:dev
```

- Health check: `GET /api/v1/health`
- API docs (non-prod): `/docs`

## Database Migrations

```bash
npm run migration:generate -- src/database/migrations/<Name>
npm run migration:run
npm run migration:revert
```

> Never use `synchronize: true` in production. All schema changes go through migrations.

## Build Progress

- [x] **Step 1** — Project setup (package.json, tsconfig, main.ts, app.module.ts)
- [x] **Step 2** — Core module (guards, filters, interceptors, encryption service)
- [x] **Step 3** — Database entities + initial migration (6 entities, DatabaseModule)
- [x] **Step 4** — Shared module (enums, exceptions, constants, DTOs, pipes, utils, wrappers)
- [x] **Step 5** — Feature modules (built in dependency order):
  - [x] store
  - [x] audit (success/failure logging with actor, IP, user-agent, requestId, duration)
  - [x] contributions (data-isolation: per-store outcomes, dedup, distinct-store count)
  - [x] risk (scorePhone + recordOutcome, idempotent, aggregated cross-store scoring)
  - [x] shopify-auth (OAuth install/callback, shared ShopifyService API client, webhook registration)
  - [x] onboarding (signal selection w/ plan-gating, terms acceptance, status/next-step)
  - [x] billing (appSubscriptionCreate w/ 14-day trial, return callback, subscription sync)
  - [x] orders (upsert/outcome persistence, dashboard list, mark/bulk RTO+delivered, masked phones)
  - [x] webhooks (HMAC-guarded: order-created, order-updated, order-cancelled, refund-created, app-uninstalled, subscription-updated)
  - [x] scan (Bulk Operations API: preview, confirm, rescan; signal matching incl. note keywords)
  - [x] reconciliation (6-hourly safety sync of recently-updated orders — catches missed webhooks)
- [x] **Step 6** — Outcome automation: orders/updated detects RTO (cancelled/refunded/tag/note signals) and DELIVERED (shipment delivered, or COD paid + fulfilled) automatically; risk level mirrored to a `codguard.risk_level` order metafield
- [x] **Step 7** — Dashboard overview stats (`GET /orders/stats`) + customer-intelligence phone lookup (`POST /risk/score`)
