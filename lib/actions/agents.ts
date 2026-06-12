"use server";

import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/password";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { zEnum } from "@/lib/constants";
import {
  optionalText,
  parseForm,
  requiredEmail,
  requiredFloat,
  text,
  type ActionState,
} from "@/lib/forms";
import { generateReferralCode } from "@/lib/utils";

function revalidateAgents() {
  revalidatePath("/admin/agents");
  revalidatePath("/admin/applications");
  revalidatePath("/agent");
}

// ── Create agent account (from scratch or from an application) ──

const createAgentSchema = z.object({
  name: text(2),
  email: requiredEmail,
  password: z.string().min(8, "٨ أحرف على الأقل"),
  phone: text(9),
  companyName: optionalText,
  city: optionalText,
  commissionRate: requiredFloat(0, 100),
  platformFeeRate: requiredFloat(0, 100),
  applicationId: optionalText,
});

export async function createAgent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(createAgentSchema, formData);
  if (!parsed.success) return parsed.state;
  const { name, email, password, applicationId, ...profile } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return {
      ok: false,
      fieldErrors: { email: "البريد مستخدم مسبقاً" },
      error: "تحقق من الحقول المظللة",
    };
  }

  let referralCode = generateReferralCode(name);
  for (let i = 0; i < 5; i++) {
    const taken = await db.agentProfile.findUnique({ where: { referralCode } });
    if (!taken) break;
    referralCode = generateReferralCode(name);
  }

  await db.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        role: "AGENT",
        agentProfile: {
          create: { ...profile, referralCode, status: "APPROVED" },
        },
      },
    });
    if (applicationId) {
      await tx.agentApplication
        .update({ where: { id: applicationId }, data: { status: "APPROVED" } })
        .catch(() => undefined);
    }
  });

  revalidateAgents();
  return { ok: true };
}

// ── Update agent profile (rates / status / notes) ───────────────

const updateAgentSchema = z.object({
  id: text(),
  status: zEnum.agentStatus,
  commissionRate: requiredFloat(0, 100),
  platformFeeRate: requiredFloat(0, 100),
  companyName: optionalText,
  city: optionalText,
  phone: text(9),
  notes: optionalText,
});

export async function updateAgent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(updateAgentSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;

  await db.agentProfile.update({ where: { id }, data });
  revalidateAgents();
  revalidatePath(`/admin/agents/${id}`);
  return { ok: true };
}

export async function setAgentStatus(id: string, status: string) {
  await requireAdmin();
  if (!zEnum.agentStatus.safeParse(status).success) {
    return { ok: false, error: "حالة غير صالحة" };
  }
  await db.agentProfile.update({ where: { id }, data: { status } });
  revalidateAgents();
  revalidatePath(`/admin/agents/${id}`);
  return { ok: true };
}

// ── Manual ledger entries (payout / adjustment) ─────────────────

const ledgerSchema = z.object({
  agentId: text(),
  type: z.enum(["PAYOUT", "ADJUSTMENT"]),
  direction: z.enum(["CREDIT", "DEBIT"]).optional(),
  amount: z.string().transform((v, ctx) => {
    const n = Number(v?.trim());
    if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) {
      ctx.addIssue({ code: "custom", message: "أدخل مبلغاً صحيحاً موجباً" });
      return z.NEVER;
    }
    return n;
  }),
  note: optionalText,
});

export async function addLedgerEntry(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireAdmin();
  const parsed = parseForm(ledgerSchema, formData);
  if (!parsed.success) return parsed.state;
  const { agentId, type, direction, amount, note } = parsed.data;

  const agent = await db.agentProfile.findUnique({ where: { id: agentId } });
  if (!agent) return { ok: false, error: "الوكيل غير موجود" };

  // PAYOUT always debits the agent balance (platform paid the agent out).
  // ADJUSTMENT direction is explicit.
  const signed =
    type === "PAYOUT" ? -amount : direction === "DEBIT" ? -amount : amount;

  await db.ledgerEntry.create({
    data: { agentId, type, amount: signed, note, createdById: user.id },
  });

  revalidatePath(`/admin/agents/${agentId}`);
  revalidatePath("/agent/statement");
  return { ok: true };
}

// ── Public agent application + admin handling ──────────────────

const applicationSchema = z.object({
  name: text(2),
  email: requiredEmail,
  phone: text(9),
  companyName: optionalText,
  city: optionalText,
  message: optionalText,
});

export async function submitAgentApplication(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(applicationSchema, formData);
  if (!parsed.success) return parsed.state;

  await db.agentApplication.create({ data: parsed.data });
  revalidatePath("/admin/applications");
  return { ok: true };
}

export async function setApplicationStatus(id: string, status: string) {
  await requireAdmin();
  if (!["NEW", "APPROVED", "REJECTED"].includes(status)) {
    return { ok: false, error: "حالة غير صالحة" };
  }
  await db.agentApplication.update({ where: { id }, data: { status } });
  revalidatePath("/admin/applications");
  return { ok: true };
}
