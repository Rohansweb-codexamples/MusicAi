import { createSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { fail, json, readJson } from "@/lib/http";
import { clientKey, throttle } from "@/lib/throttle";
import { registerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    if (!throttle(clientKey(request, "register"), 10, 10 * 60 * 1000)) {
      throw new AppError(429, "Too many sign-up attempts. Please try again in a few minutes.");
    }

    const body = registerSchema.parse(await readJson(request));

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      throw new AppError(409, "An account with that email already exists. Try signing in.");
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash: await hashPassword(body.password),
      },
      select: { id: true, email: true, name: true, role: true },
    });

    await createSession(user.id);
    return json({ user }, 201);
  } catch (error) {
    return fail(error);
  }
}
