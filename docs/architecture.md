# Global Bubble Waffle Registry Architecture

## System layers

- **Presentation**: Next.js App Router pages (`/`, `/map`, `/shops/[slug]`, `/submit`)
- **API layer**: Route handlers under `src/app/api/*`
- **Domain layer**: Validation schemas and repositories under `src/domain/*`
- **Infrastructure layer**: Supabase clients, auth guard, logging, env parsing under `src/lib/*`
- **Persistence**: Supabase Postgres via SQL migrations in `supabase/migrations`

## Agent-ready workflow

- **Create**: agents call `POST /api/shops` with admin auth.
- **Read**: agents call `GET /api/shops` with filters for crawl and verification batches.
- **Patch**: agents call `PATCH /api/shops/:id` for status + confidence + verification timestamps.
- **Intake queue**: public users submit unknown shops to `POST /api/submissions`, stored in `shop_submissions` for moderation.
- **Discovery ingestion**: agents call `POST /api/agent/discover`; records are stored in `agent_discoveries`, run metadata in `agent_runs`.
- **Verification ingestion**: agents call `POST /api/agent/verify`; canonical records in `shops` are updated and historical entries are written to `shop_verification_logs`.
- **Idempotency and throttling**: `x-idempotency-key`/`run_key` are supported, and request rate is controlled via database-backed run counting.

## Security model

- Public reads use anonymous Supabase key with RLS policy allowing select on `shops`.
- Mutating shop records requires:
  - `ADMIN_API_KEY` bearer token, or
  - Supabase user token with `app_metadata.role = "admin"`.
- Submission API is intentionally public but uses honeypot field + server-side validation.
- Agent APIs are admin-protected and write via service-role on the server.
- Agent tables (`agent_runs`, `agent_discoveries`, `shop_verification_logs`) are RLS-enabled and not publicly readable.
- `shop_media` is publicly readable for profile rendering.

## Scaling path

- Add a background worker (Edge Function or queue consumer) for:
  - resolving pending submissions,
  - periodic status verification checks,
  - confidence rescoring.
- Add geospatial index and PostGIS when advanced proximity search is needed.
- Add observability (structured logs already present) with log drain and traces.
