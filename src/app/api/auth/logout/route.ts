import { destroySession } from "@/lib/auth";
import { fail, json } from "@/lib/http";

export async function POST() {
  try {
    await destroySession();
    return json({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
