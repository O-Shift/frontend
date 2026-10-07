import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import {
  hostDestination,
  isMarketingSurface,
  SURFACE_HEADER,
  siteOrigins,
} from "@/lib/site-routing";

// Next 16 renamed the `middleware` file convention to `proxy`; `middleware.ts`
// still runs but is deprecated. Same function, same matcher semantics.
export async function proxy(request: NextRequest) {
  // Next's development server normalizes nextUrl to localhost. The actual Host
  // also matters in production when several domains share this deployment.
  const incomingHost = request.headers.get("host");
  if (incomingHost) {
    const authority = new URL(`${request.nextUrl.protocol}//${incomingHost}`);
    request.nextUrl.hostname = authority.hostname;
    request.nextUrl.port = authority.port;
  }
  const origins = siteOrigins();
  if (request.nextUrl.host === origins.app.host)
    request.nextUrl.protocol = origins.app.protocol;
  const destination = hostDestination(request.nextUrl, origins);
  if (destination) return NextResponse.redirect(destination);
  const marketing = isMarketingSurface(request.nextUrl, origins);
  // Always overwrite the incoming value so clients cannot bypass the app shell/auth guard.
  request.headers.set(SURFACE_HEADER, marketing ? "marketing" : "app");
  if (marketing) return NextResponse.next({ request });
  const response = await updateSession(request);
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: [
    // Four exclusions, each for its own reason:
    //
    // `_next` as a whole, not just `_next/static|image`: the dev HMR socket
    // lives at `_next/webpack-hmr`, and running it through updateSession
    // answers the WebSocket upgrade with a 307 to /login, which the browser
    // reports as ERR_INVALID_HTTP_RESPONSE and which kills HMR.
    //
    // `api/` now participates only in host routing. updateSession immediately
    // passes it through without a Supabase lookup, preserving streaming latency.
    //
    // `ingest`: the PostHog reverse proxy (see next.config.ts). It has to be
    // excluded or the auth check redirects anonymous capture requests to
    // /login, which silently loses events while PostHog still looks connected.
    //
    // Static image and self-hosted font extensions: nothing here needs a session.
    "/((?!_next/|ingest|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf|woff|woff2)$).*)",
  ],
};
