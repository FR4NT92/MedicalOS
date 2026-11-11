import { auth } from "./auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/api/auth");
  const isLoginRoute = req.nextUrl.pathname === "/login";
  const isPublicVerifyRoute = req.nextUrl.pathname.startsWith("/verify");

  if (isAuthRoute || isPublicVerifyRoute) return;

  if (isLoginRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
    return;
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
})

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
}
