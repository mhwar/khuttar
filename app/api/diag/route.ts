// صفحة تشخيص مؤقتة: تكشف حالة الإنتاج في لقطة واحدة (تُحذف بعد حل المشكلة).
// لا تعرض أي سر: البريد مقنّع، وكلمة المرور تُفحَص كنتيجة منطقية (صح/خطأ) فقط.
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

function mask(email: string) {
  const [user, domain] = email.split("@");
  const visible = user.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(user.length - 2, 1))}@${domain}`;
}

export async function GET(request: NextRequest) {
  const headers = request.headers;

  let admins: string[] = [];
  let dbError: string | null = null;
  let envEmailMatchesAdmin: boolean | null = null;
  let envPasswordMatchesStored: boolean | null = null;
  let envEmailMasked: string | null = null;

  try {
    const rows = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true, status: true, passwordHash: true },
    });
    admins = rows.map((r) => `${mask(r.email)} (${r.status})`);

    // يقارن قيم Render (SEED_ADMIN_*) بما هو مخزَّن فعلاً في القاعدة.
    const envEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const envPassword = process.env.SEED_ADMIN_PASSWORD;
    if (envEmail) {
      envEmailMasked = mask(envEmail);
      const match = rows.find((r) => r.email.toLowerCase() === envEmail);
      envEmailMatchesAdmin = !!match;
      if (match && envPassword) {
        envPasswordMatchesStored = await verifyPassword(
          envPassword,
          match.passwordHash,
        );
      }
    }
  } catch (error) {
    dbError = error instanceof Error ? error.message.slice(0, 200) : "unknown";
  }

  const response = NextResponse.json(
    {
      time: new Date().toISOString(),
      adminAccounts: admins,
      // مفتاح الحسم: هل بيانات Render تطابق المخزَّن؟
      envEmailMasked,
      envEmailMatchesAdmin, // false = البريد في Render ليس حساب إدارة
      envPasswordMatchesStored, // false = كلمة المرور المخزَّنة لا تطابق Render → فعّل SEED_ADMIN_RESET=1
      dbError,
      proxyHeaders: {
        host: headers.get("host"),
        xForwardedHost: headers.get("x-forwarded-host"),
        xForwardedProto: headers.get("x-forwarded-proto"),
      },
      hostsMatch:
        !headers.get("x-forwarded-host") ||
        headers.get("x-forwarded-host") === headers.get("host"),
      sessionCookieReceived: request.cookies.has("khattar_session"),
      testCookieReceived: request.cookies.has("diag_test"),
      hint: "افتح ?setcookie=1 ثم أعد التحميل بدونها: إن صار testCookieReceived=true فالكوكيز تعمل",
    },
    { status: 200 },
  );

  if (request.nextUrl.searchParams.get("setcookie") === "1") {
    response.cookies.set("diag_test", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 600,
    });
  }
  return response;
}
