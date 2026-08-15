import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Next 16 renamed the `middleware` file convention to `proxy`; `middleware.ts`
// still runs but is deprecated. Same function, same matcher semantics.
export async function proxy(request: NextRequest) {
  return updateSession(request);
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
    // `api/`: every request to the backend pass-through was paying a
    // `supabase.auth.getUser()` network round trip whose answer was then
    // discarded, since `/api/*` is a public path as far as this file is
    // concerned. That latency landed in front of every data fetch in the app.
    //
    // `ingest`: the PostHog reverse proxy (see next.config.ts). It has to be
    // excluded or the auth check redirects anonymous capture requests to
    // /login, which silently loses events while PostHog still looks connected.
    //
    // Static image extensions: nothing here needs a session.
    "/((?!_next/|api/|ingest|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
