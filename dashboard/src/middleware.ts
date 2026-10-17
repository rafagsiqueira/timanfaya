import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, safeEqual, sessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/login") return NextResponse.next();
  const cookie = req.cookies.get(COOKIE)?.value ?? "";
  let ok = false;
  try { ok = safeEqual(cookie, await sessionToken()); } catch { /* misconfigured env: fail closed */ }
  if (ok) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
