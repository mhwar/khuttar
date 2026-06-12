// صفحة تشخيص مؤقتة: تكشف حالة الإنتاج في لقطة واحدة (تُحذف بعد حل المشكلة).
// لا تعرض أسراراً: بريد إداري مقنّع، ترويسات البروكسي، ووجود كوكي الجلسة.
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";

function mask(email: string) {
  const [user, domain] = email.split("@");
  const visible = user.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(user.length - 2, 1))}@${domain}`;
}

export async function GET(request: NextRequest) {
  const headers = request.headers;

  let admins: string[] = [];
  let dbError: string | null = null;
  try {
    const rows = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true, status: true },
    });
    admins = rows.map((r) => `${mask(r.email)} (${r.status})`);
  } catch (error) {
    dbError = error instanceof Error ? error.message.slice(0, 200) : "unknown";
  }

  const response = NextResponse.json(
    {
      time: new Date().toISOString(),
      adminAccounts: admins,
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
      hint: "افتح ?setcookie=1 ثم أعد تحميل الصفحة بدونها: إن صار testCookieReceived=true فالكوكيز تعمل عبر البروكسي",
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
