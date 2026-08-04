import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isValidToken = token && token.userId && token.email;

  // Redirect unauthenticated users away from protected routes
  if (
    !isValidToken &&
    (pathname.startsWith("/super-admin") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/staff") ||
      pathname.startsWith("/verification"))
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Redirect authenticated users away from auth pages or home
  if (
    isValidToken &&
    (pathname === "/" || pathname.startsWith("/auth")) &&
    !pathname.startsWith("/super-admin") &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/staff") &&
    !pathname.startsWith("/verification")
  ) {
    const redirectUrl = token.isVerified
      ? token.role === "SUPER_ADMIN"
        ? "/super-admin"
        : token.role === "ADMIN"
        ? "/admin"
        : "/staff"
      : "/verification";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Prevent verified users from accessing verification page
  if (token?.isVerified && pathname.startsWith("/verification")) {
    const redirectUrl =
      token.role === "SUPER_ADMIN"
        ? "/super-admin"
        : token.role === "ADMIN"
        ? "/admin"
        : "/staff";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Prevent unverified users from accessing app and admin routes
  if (
    isValidToken &&
    !token.isVerified &&
    (pathname.startsWith("/super-admin") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/staff"))
  ) {
    return NextResponse.redirect(new URL("/verification", request.url));
  }

  // Role-based access control for verified users
  if (isValidToken && token?.isVerified) {
    // SUPER_ADMIN can only access /admin, redirect from /app
    if (
      token.role === "SUPER_ADMIN" &&
      (pathname.startsWith("/admin") || pathname.startsWith("/staff"))
    ) {
      return NextResponse.redirect(new URL("/super-admin", request.url));
    }
    if (
      token.role === "ADMIN" &&
      (pathname.startsWith("/super-admin") || pathname.startsWith("/staff"))
    ) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (
      token.role === "STAFF" &&
      (pathname.startsWith("/super-admin") || pathname.startsWith("/admin"))
    ) {
      return NextResponse.redirect(new URL("/staff", request.url));
    }

  }

  return NextResponse.next();
}
