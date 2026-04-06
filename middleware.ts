import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/pricing", "/features"];
const kioskRoutes = /^\/kiosk\//;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for public routes, kiosk, and API webhooks
  if (
    publicRoutes.includes(pathname) ||
    kioskRoutes.test(pathname) ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/kiosk")
  ) {
    return NextResponse.next();
  }

  const { user, supabaseResponse } = await updateSession(request);

  // Redirect unauthenticated users to login
  if (!user && !publicRoutes.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Super admin route protection
  if (pathname.startsWith("/super-admin")) {
    // Role check will be done at the page level since JWT claims
    // aren't directly accessible in middleware without parsing
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|sounds|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
