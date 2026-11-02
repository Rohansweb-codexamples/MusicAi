import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

/**
 * Audio storage. Files live outside the web bundle under STORAGE_DIR (a Docker
 * volume in the sandbox) and are only ever served through an authenticated API
 * route that checks ownership — never through a public URL.
 *
 * For serverless hosting (Vercel), point this module at object storage: the
 * only functions that need replacing are putAudio/getAudio/removeAudio.
 */
const ROOT = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");

const KEY_PATTERN = /^audio\/[A-Za-z0-9_-]{1,64}\/[A-Za-z0-9_-]{1,64}\.[a-z0-9]{1,5}$/;

export function audioKey(userId: string, generationId: string, extension: string) {
  return `audio/${userId}/${generationId}.${extension}`;
}

function resolveKey(key: string) {
  if (!KEY_PATTERN.test(key)) throw new Error("Invalid audio key");
  return path.join(ROOT, key);
}

export async function putAudio(key: string, data: Buffer) {
  const target = resolveKey(key);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
}

export async function getAudio(key: string): Promise<Buffer | null> {
  try {
    return await readFile(resolveKey(key));
  } catch {
    return null;
  }
}

export async function removeAudio(key: string) {
  try {
    await unlink(resolveKey(key));
  } catch {
    // already gone
  }
}
