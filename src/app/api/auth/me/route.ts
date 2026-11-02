import { getSessionUser } from "@/lib/auth";
import { fail, json } from "@/lib/http";

export async function GET() {
  try {
    const user = await getSessionUser();
    return json({ user });
  } catch (error) {
    return fail(error);
  }
}
