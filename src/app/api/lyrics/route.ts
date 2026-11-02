import { requireUser } from "@/lib/auth";
import { fail, json, readJson } from "@/lib/http";
import { writeLyrics } from "@/lib/lyrics";
import { lyricsSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = lyricsSchema.parse(await readJson(request));
    const lyrics = await writeLyrics(body);
    return json({ lyrics });
  } catch (error) {
    return fail(error);
  }
}
