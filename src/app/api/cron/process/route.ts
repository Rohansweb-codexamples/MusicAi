import { json } from "@/lib/http";
import { runNextGeneration } from "@/lib/process-generation";

/** Vercel Cron entry point for deployments without a long-running worker. */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return json({ error: "Cron processing is disabled. Set CRON_SECRET to enable it." }, 503);
  }

  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return json({ error: "Unauthorized" }, 401);
  }

  const worked = await runNextGeneration();
  return json({ processed: worked ? 1 : 0 });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
