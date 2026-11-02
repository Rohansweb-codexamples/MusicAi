import { writeFileSync } from "fs";
import { prisma } from "../src/lib/db";
import { runNextGeneration } from "../src/lib/process-generation";

const heartbeatFile = process.env.WORKER_HEARTBEAT_FILE;
const pollMs = Number(process.env.WORKER_POLL_MS || 3000);
let stopping = false;

function heartbeat() {
  if (!heartbeatFile) return;
  try {
    writeFileSync(heartbeatFile, String(Date.now()));
  } catch {
    // heartbeat is best effort
  }
}

async function main() {
  console.log("[worker] generation worker online");
  heartbeat();

  while (!stopping) {
    let worked = false;
    try {
      worked = await runNextGeneration();
    } catch (error) {
      console.error("[worker] loop error", error);
    }
    heartbeat();
    if (!worked) await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  await prisma.$disconnect();
  console.log("[worker] stopped");
}

process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});

main().catch(async (error) => {
  console.error("[worker] fatal", error);
  await prisma.$disconnect();
  process.exit(1);
});
