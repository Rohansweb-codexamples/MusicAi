# Music AI

Music AI is a full-song music creation studio. The default provider is **Google Lyria 3 Pro** (`lyria-3-pro-preview`), generating complete compositions with vocals, lyrics, verses, choruses, bridges, and instrumental arrangements.

## Google Lyria 3 Pro setup

This project uses the Google Cloud Vertex AI Lyria 3 REST endpoint. It does **not** use Replicate for the default generation path.

1. Create or select a Google Cloud project.
2. Enable the Vertex AI / Gemini Enterprise Agent Platform API for that project.
3. Create a service account and grant it the **Vertex AI User** role (`roles/aiplatform.user`).
4. Create a JSON key for that service account.
5. In the Base44 environment secrets panel, add:
   - `GOOGLE_CLOUD_PROJECT_ID` — your Google Cloud project ID.
   - `GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON` — the complete service-account JSON, pasted as one line.
6. Keep `MUSIC_PROVIDER=lyria` — this is already the default in `.env.base44-defaults`.
7. Redeploy/restart the app and worker after saving secrets.

Never commit the service-account JSON or private key to GitHub, and never put it in a `NEXT_PUBLIC_` variable.

The provider calls `POST https://aiplatform.googleapis.com/v1beta1/projects/PROJECT_ID/locations/global/interactions` using model `lyria-3-pro-preview`. The response contains generated MP3 audio and lyric text. Google documents full songs up to 184 seconds for this model.

## Optional lyrics writer

`LLM_API_KEY` is optional and only enables the separate AI lyrics-writing feature. Users can still enter their own lyrics and generate a vocal song without it.

## Deployment notes

The repository includes a Next.js web app **and a separate background worker** (`npm run worker`), PostgreSQL/Prisma persistence, and audio storage. Vercel can host the Next.js web/API layer, but it does not run this always-on worker or provide persistent local disk storage. For a Vercel deployment, use a managed PostgreSQL database and durable object storage, and run the worker on a separate always-on worker host. Keep the worker and web app on the same database and storage configuration.

The Base44 preview stack currently runs the web app, Postgres, and worker together through `docker-compose.base44.yml`. Do not deploy the whole Docker Compose stack as a Vercel project.

## Local development

- Node.js 20+
- PostgreSQL
- Set the secrets listed above in your server environment.
- `npm install`
- `npx prisma migrate deploy`
- `npm run dev` (web)
- `npm run worker` (worker, separate terminal)