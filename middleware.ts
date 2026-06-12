import { NextResponse, type NextRequest } from "next/server";

// UX-only redirect: checks cookie *presence*. Real authorization happens in
// the admin/agent layouts and inside every server action (lib/auth.ts).
export function middleware(request: NextRequest) {
  const hasSession = request.cookies.has("khattar_session");
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/agent/:path*"],
};
