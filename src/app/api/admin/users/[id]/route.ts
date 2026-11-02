import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { fail, json, readJson } from "@/lib/http";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({ role: z.enum(["USER", "ADMIN"]) });

export async function PATCH(request: Request, { params }: Params) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    const body = bodySchema.parse(await readJson(request));

    if (id === admin.id) {
      throw new AppError(400, "You can't change your own role.");
    }

    const user = await prisma.user.update({ where: { id }, data: { role: body.role } });
    return json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    return fail(error);
  }
}
