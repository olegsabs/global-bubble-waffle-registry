# Global Bubble Waffle Registry

Production-ready, AI-native registry platform for bubble waffle shops worldwide.

## Stack

- Next.js (App Router) + TypeScript
- TailwindCSS
- Leaflet map integration
- Supabase Postgres/Auth
- Vercel deployment target

## Features implemented

- Canonical `shops` database model with required enums/fields/indexes.
- Public listing API: `GET /api/shops`.
- Admin mutation APIs:
  - `POST /api/shops`
  - `PATCH /api/shops/:id`
- Slug generation with collision retries.
- Public map UI with filters and marker popups.
- Shop profile page by slug.
- Public submission form + moderation queue (`shop_submissions`).
- Agent ingestion pipeline tables:
  - `agent_runs`
  - `agent_discoveries`
  - `shop_verification_logs`
  - `shop_media`
- Agent APIs:
  - `POST /api/agent/discover`
  - `POST /api/agent/verify`
  - `GET /api/agent/promote`
- Structured logging and environment validation.

## Project structure

- `src/app/*`: web routes and API handlers
- `src/components/*`: UI/map/form components
- `src/domain/*`: business schemas + repositories
- `src/lib/*`: env/auth/http/logging/supabase client setup
- `supabase/migrations/*`: SQL schema migrations
- `docs/architecture.md`: architecture and agent integration model

## Environment variables

Copy `.env.example` to `.env.local` and fill values:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_API_KEY`
- `AGENT_RATE_LIMIT_PER_MINUTE` (optional, default `60`)
- `AGENT_PROMOTION_BATCH_SIZE` (optional, default `100`)
- `AGENT_PROMOTION_MIN_CONFIDENCE` (optional, default `0.7`)
- `CRON_SECRET` (required for secure Vercel cron execution)
- `NEXT_PUBLIC_MAP_TILE_URL` (optional)

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Run Supabase migration (via Supabase CLI linked project):

```bash
supabase db push
```

3. (Optional) Seed sample data:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

4. Start development server:

```bash
npm run dev
```

## API usage

### `GET /api/shops`

Query params:

- `country`
- `city`
- `status` (`active | closed | unknown`)
- `search`
- `limit` (max 1000)
- `offset`

### `POST /api/shops` (admin)

Auth: `Authorization: Bearer <ADMIN_API_KEY or Supabase admin JWT>`

Example payload:

```json
{
  "name": "Pearl Bubble Waffle",
  "country": "Japan",
  "city": "Tokyo",
  "address": "1-2-3 Shibuya",
  "latitude": 35.6598,
  "longitude": 139.7006,
  "instagram_url": "https://instagram.com/pearlwaffle",
  "website_url": "https://pearlwaffle.example.com",
  "status": "active",
  "format": "kiosk",
  "created_source": "agent",
  "verification_confidence": 0.85
}
```

### `PATCH /api/shops/:id` (admin)

Auth: same as POST endpoint.

Example payload:

```json
{
  "status": "closed",
  "last_verified_at": "2026-02-15T10:30:00Z",
  "verification_confidence": 0.9
}
```

### `POST /api/submissions`

Public endpoint for moderation queue.

### `POST /api/agent/discover` (admin)

Auth: `Authorization: Bearer <ADMIN_API_KEY or Supabase admin JWT>`

Optional idempotency:

- `x-idempotency-key: discovery-run-<unique-id>`

Example payload:

```json
{
  "run_key": "discovery-run-2026-02-15-miami",
  "source": "instagram",
  "notes": "nightly city scan",
  "records": [
    {
      "external_ref": "ig:17894123456789012",
      "source_url": "https://instagram.com/example",
      "name": "Bubble Waffle Test Miami",
      "country": "USA",
      "city": "Miami",
      "address": "123 Test Street",
      "latitude": 25.7617,
      "longitude": -80.1918,
      "instagram_url": "https://instagram.com/bubblewaffle",
      "website_url": null,
      "format": "kiosk",
      "status": "unknown",
      "confidence": 0.72,
      "raw_payload": {
        "platform": "instagram"
      }
    }
  ]
}
```

### `POST /api/agent/verify` (admin)

Auth: `Authorization: Bearer <ADMIN_API_KEY or Supabase admin JWT>`

Optional idempotency:

- `x-idempotency-key: verify-run-<unique-id>`

Example payload:

```json
{
  "run_key": "verify-run-2026-02-15-miami",
  "source": "monitoring-agent",
  "checks": [
    {
      "shop_id": "00000000-0000-0000-0000-000000000000",
      "status": "active",
      "verification_confidence": 0.91,
      "last_verified_at": "2026-02-15T10:30:00Z",
      "reason": "Recent social activity detected",
      "evidence": {
        "posts_last_30_days": 4
      }
    }
  ]
}
```

### `GET /api/agent/promote` (admin or cron)

Auth:

- `Authorization: Bearer <ADMIN_API_KEY or Supabase admin JWT>`
- or `Authorization: Bearer <CRON_SECRET>` for scheduled runs

Query params:

- `limit` (default `100`, max `500`)
- `min_confidence` (default `0.7`)
- `dry_run` (`true|false`, default `false`)
- `source` (default `promotion-agent`)
- `run_key` (optional idempotency key)

## Deployment (Vercel)

1. Push repository to Git provider.
2. Import project into Vercel.
3. Set all env vars in Vercel project settings.
4. Set `CRON_SECRET` and keep it private. Vercel cron will call `/api/agent/promote` every 30 minutes.
5. Deploy.
6. Confirm API and map pages:
   - `/api/shops`
   - `/map`
   - `/submit`

## Operational notes

- Route handlers run in Node.js runtime.
- RLS enabled; public reads allowed only for `shops`.
- Service role key is used server-side for writes.
- `ADMIN_API_KEY` is recommended for agent workflows where JWT lifecycle is not practical.

## Next improvements

1. Add moderation dashboard for `shop_submissions` approval workflow.
2. Add cron/queue worker for automated discovery and reverification.
3. Add PostGIS + geospatial search endpoints.
4. Add integration tests (API + page smoke tests).
