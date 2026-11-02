# Working in this repo (Base44 sandbox)

## Running it

`docker compose -f docker-compose.base44.yml up -d --build` brings up `db` (Postgres 16),
`migrate` (one-shot: `npm install`, `prisma migrate deploy`, admin seed), `web`
(Next.js dev server on host port 3000) and `worker` (polls Postgres for queued
generations). Source is bind-mounted; `web` uses `next dev` with WATCHPACK polling, so
edits hot-reload. `worker` runs through `tsx` and does not watch — restart it after
changing `worker/` or `src/lib/process-generation.ts`.

## Things that are not obvious

- Provider credentials (`GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON`,
  optional `LLM_API_KEY`) are optional at boot: the app, auth, library and admin screens
  all work without them. Only starting a generation fails, with a "not configured"
  message from `src/lib/provider/lyria.ts`.
- `prisma/migrations/0_init/migration.sql` was generated from `prisma/schema.prisma`
  with `prisma migrate diff --from-empty --to-schema-datamodel`. After editing the
  schema, add a new migration (`prisma migrate diff --from-migrations prisma/migrations
  --to-schema-datamodel prisma/schema.prisma --script`) rather than resetting the DB.
- Prisma prints an `openssl-1.1.x` warning on `node:22-bookworm-slim`; it is noise and
  migrations/queries work. Do not "fix" it by switching images.
- The `migrate` service is idempotent and safe to re-run: `docker compose -f
  docker-compose.base44.yml run --rm migrate` re-applies migrations and re-runs the seed.
- The seeded admin comes from `.env.base44-defaults` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`,
  default `admin@musicai.studio` / `changeme-admin`). Change it before any real deployment.
- Audio lives in the `storage` Docker volume (`STORAGE_DIR=/app/storage`) and is only
  served through the authenticated `/api/generations/[id]/audio` route.

## Verifying

- Web is up when `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` is 200
  and `/api/auth/me` answers.
- Container health: `docker compose -f docker-compose.base44.yml ps` — `web` probes
  `/api/auth/me`, `worker` probes `/tmp/musicai-worker-heartbeat` (worker writes it each loop).
- Typecheck runs in the container: `docker compose -f docker-compose.base44.yml exec -T web npx tsc --noEmit`.
