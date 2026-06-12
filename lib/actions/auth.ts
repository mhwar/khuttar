"use server";

import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/password";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { ar } from "@/lib/i18n/ar";
import type { ActionState } from "@/lib/forms";

const loginSchema = z.object({
  email: z.string().min(1).toLowerCase(),
  password: z.string().min(1),
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: ar.misc.invalidCredentials };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const valid =
    user &&
    user.status === "ACTIVE" &&
    (await verifyPassword(parsed.data.password, user.passwordHash));

  if (!valid) {
    await sleep(400);
    return { ok: false, error: ar.misc.invalidCredentials };
  }

  await createSession(user.id);
  redirect(user.role === "ADMIN" ? "/admin" : "/agent");
}

export async function logout() {
  const user = await getCurrentUser();
  if (user) await destroySession();
  redirect("/login");
}
