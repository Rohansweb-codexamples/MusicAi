import { createSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { fail, json, readJson } from "@/lib/http";
import { clientKey, throttle } from "@/lib/throttle";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await readJson(request));

    if (!throttle(clientKey(request, `login:${body.email}`), 10, 10 * 60 * 1000)) {
      throw new AppError(429, "Too many sign-in attempts. Please wait a few minutes.");
    }

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    const valid = user ? await verifyPassword(body.password, user.passwordHash) : false;

    if (!user || !valid) {
      throw new AppError(401, "That email and password combination doesn't match an account.");
    }

    await createSession(user.id);
    return json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    return fail(error);
  }
}
