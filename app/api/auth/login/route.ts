// مسار دخول مباشر (Route Handler) بدل Server Action: يضبط كوكي الجلسة على
// استجابة التحويل مباشرةً — وهي الآلية التي أثبت التشخيص أنها تعمل خلف
// بروكسي Render (Server Actions كانت تفقد الكوكي عبر البروكسي).
import { NextResponse, type NextRequest } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

const SESSION_COOKIE = "khattar_session";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  // ابنِ الأصل العام من ترويسات البروكسي (Render ينهي TLS ويمرّر داخلياً عبر HTTP).
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "localhost:3000";
  const base = `${proto}://${host}`;

  let email = "";
  let password = "";
  try {
    const form = await request.formData();
    email = String(form.get("email") ?? "").trim().toLowerCase();
    password = String(form.get("password") ?? "");
  } catch {
    return NextResponse.redirect(`${base}/login?error=1`, 303);
  }

  const user = email ? await db.user.findUnique({ where: { email } }) : null;
  const valid =
    !!user &&
    user.status === "ACTIVE" &&
    (await verifyPassword(password, user.passwordHash));

  if (!user || !valid) {
    await new Promise((r) => setTimeout(r, 400)); // إبطاء محاولات التخمين
    return NextResponse.redirect(`${base}/login?error=1`, 303);
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await db.session.create({ data: { tokenHash, userId: user.id, expiresAt } });

  const dest = user.role === "ADMIN" ? "/admin" : "/agent";
  const response = NextResponse.redirect(`${base}${dest}`, 303);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return response;
}
