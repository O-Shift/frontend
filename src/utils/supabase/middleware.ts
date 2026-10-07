import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { entryPath, RETURNING_BROWSER_COOKIE } from "@/lib/site-routing";

const PUBLIC_PREFIXES = [
  "/landing",
  "/start",
  "/login",
  "/signup",
  "/forgot-password",
  "/update-password",
  "/auth",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return true;
  }
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Sends an unverifiable request to the login page, flagged so the failure is
 * visible in the URL rather than looking like an ordinary logout.
 */
function denyToLogin(request: NextRequest, pathname: string, reason: string) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("from", pathname);
  loginUrl.searchParams.set("error", reason);
  return NextResponse.redirect(loginUrl);
}

export async function updateSession(request: NextRequest) {
  // Reassigned by the cookie `setAll` handler below, which has to rebuild the
  // response so refreshed auth cookies ride along on it.
  let supabaseResponse = NextResponse.next({ request });

  const { pathname } = request.nextUrl;

  // `/api/*` is this app's own pass-through to FastAPI (`app/api/[...path]`).
  // Those requests already carry a Supabase access token in the Authorization
  // header and the backend verifies it itself, so the answer from `getUser()`
  // is never read here — but the call is a real network round trip to Supabase,
  // and it was being paid on every single API request, serially, ahead of the
  // request it was delaying. Bail before the client is even constructed. The
  // matcher in `proxy.ts` excludes `/api/` too; this is the second lock.
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return supabaseResponse;
  }
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml")
    return supabaseResponse;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without these we cannot build a Supabase client, and therefore cannot tell
  // an authenticated request from an anonymous one. Returning `next()` here
  // would hand every protected route to anybody who asks. Fail closed instead:
  // public routes still work (so /login and /auth/callback stay reachable and
  // the deployment is recoverable), everything else is refused and logged.
  if (!url || !anonKey) {
    const missing = [
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
    ]
      .filter(Boolean)
      .join(", ");
    const allowed = isPublicPath(pathname);
    console.error(
      `[auth] Supabase is not configured (missing: ${missing}). Sessions cannot ` +
        `be verified, so protected routes are being refused. ` +
        `${pathname} -> ${allowed ? "allowed (public route)" : "denied"}`,
    );
    if (allowed) {
      if (pathname === "/start") {
        const destination = request.nextUrl.clone();
        destination.pathname = entryPath(
          false,
          request.cookies.get(RETURNING_BROWSER_COOKIE)?.value === "1",
        );
        destination.search = "";
        return NextResponse.redirect(destination);
      }
      return supabaseResponse;
    }
    return denyToLogin(request, pathname, "auth_unavailable");
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // This marker chooses an entry form; it never grants access to protected routes.
  // Real Supabase session cookies remain host-only on the application subdomain.
  if (user) {
    supabaseResponse.cookies.set(RETURNING_BROWSER_COOKIE, "1", {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  const redirectWithCookies = (destination: URL) => {
    const response = NextResponse.redirect(destination);
    for (const cookie of supabaseResponse.cookies.getAll())
      response.cookies.set(cookie);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
  if (pathname === "/start") {
    const destination = request.nextUrl.clone();
    destination.pathname = entryPath(
      Boolean(user),
      request.cookies.get(RETURNING_BROWSER_COOKIE)?.value === "1",
    );
    destination.search = "";
    return redirectWithCookies(destination);
  }

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("from", pathname);
    return redirectWithCookies(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/workspaces";
    dest.search = "";
    return redirectWithCookies(dest);
  }

  return supabaseResponse;
}
