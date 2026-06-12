"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, requireAdmin, requireApprovedAgent } from "@/lib/auth";
import { zEnum } from "@/lib/constants";
import {
  checkbox,
  optionalInt,
  optionalText,
  parseForm,
  text,
  type ActionState,
} from "@/lib/forms";
import { slugify } from "@/lib/utils";

const programSchema = z
  .object({
    id: optionalText,
    title: text(2),
    category: zEnum.programCategory,
    slug: optionalText,
    summary: optionalText,
    description: optionalText,
    coverImage: optionalText,
    basePrice: optionalInt,
    status: zEnum.programStatus,
    visibility: zEnum.programVisibility,
    featured: checkbox,
    destinationId: optionalText,
    // TOUR
    tourType: optionalText,
    durationDays: optionalInt,
    inclusions: optionalText,
    exclusions: optionalText,
    // STUDY
    studyKind: optionalText,
    institute: optionalText,
    studyCity: optionalText,
    durationWeeks: optionalInt,
    tuitionMin: optionalInt,
    tuitionMax: optionalInt,
    requirements: optionalText,
    servicesIncluded: optionalText,
  })
  .superRefine((data, ctx) => {
    if (data.category === "TOUR") {
      if (!data.tourType || !zEnum.tourType.safeParse(data.tourType).success) {
        ctx.addIssue({ code: "custom", path: ["tourType"], message: "حدد نوع الجولة" });
      }
    }
    if (data.category === "STUDY") {
      if (!data.studyKind || !zEnum.studyKind.safeParse(data.studyKind).success) {
        ctx.addIssue({ code: "custom", path: ["studyKind"], message: "حدد نوع البرنامج الدراسي" });
      }
    }
  });

async function uniqueProgramSlug(base: string, excludeId?: string) {
  let slug = base;
  for (let i = 0; i < 10; i++) {
    const existing = await db.program.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

function revalidatePrograms() {
  revalidatePath("/admin/programs");
  revalidatePath("/agent/programs");
  revalidatePath("/programs");
  revalidatePath("/study");
  revalidatePath("/");
}

// Admin saves platform programs (or edits any program); agents save their own.
export async function saveProgram(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "غير مصرح" };

  const isAdmin = user.role === "ADMIN";
  let agentProfileId: string | null = null;
  if (!isAdmin) {
    const { profile } = await requireApprovedAgent();
    agentProfileId = profile.id;
  }

  const parsed = parseForm(programSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, slug: slugInput, featured, ...data } = parsed.data;

  // Tour/study cross-cleanup so a category switch never leaves stale fields.
  const cleaned = {
    ...data,
    ...(data.category === "TOUR"
      ? {
          studyKind: null,
          institute: null,
          studyCity: null,
          durationWeeks: null,
          tuitionMin: null,
          tuitionMax: null,
          requirements: null,
          servicesIncluded: null,
        }
      : {
          tourType: null,
          durationDays: null,
          inclusions: null,
          exclusions: null,
        }),
  };

  if (id) {
    const existing = await db.program.findUnique({ where: { id } });
    if (!existing) return { ok: false, error: "البرنامج غير موجود" };
    if (!isAdmin && existing.ownerAgentId !== agentProfileId) {
      return { ok: false, error: "غير مصرح" };
    }
    const slug = slugInput
      ? await uniqueProgramSlug(slugify(slugInput), id)
      : undefined;
    await db.program.update({
      where: { id },
      data: {
        ...cleaned,
        ...(slug ? { slug } : {}),
        // Agents cannot self-feature or self-approve.
        ...(isAdmin ? { featured } : {}),
      },
    });
  } else {
    const slug = await uniqueProgramSlug(slugify(slugInput ?? data.title));
    await db.program.create({
      data: {
        ...cleaned,
        slug,
        featured: isAdmin ? featured : false,
        ownerAgentId: agentProfileId,
        // Platform programs are auto-approved; agent programs need moderation.
        isApproved: isAdmin,
      },
    });
  }
  revalidatePrograms();
  return { ok: true };
}

export async function deleteProgram(id: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "غير مصرح" };
  const program = await db.program.findUnique({ where: { id } });
  if (!program) return { ok: false, error: "غير موجود" };
  if (user.role !== "ADMIN") {
    const { profile } = await requireApprovedAgent();
    if (program.ownerAgentId !== profile.id) return { ok: false, error: "غير مصرح" };
  }
  await db.program.delete({ where: { id } });
  revalidatePrograms();
  return { ok: true };
}

export async function setProgramApproval(id: string, approved: boolean) {
  await requireAdmin();
  await db.program.update({ where: { id }, data: { isApproved: approved } });
  revalidatePrograms();
  return { ok: true };
}
