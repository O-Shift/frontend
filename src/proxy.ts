import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // /ingest is the PostHog reverse proxy (see next.config.ts). It has to be
    // excluded or the auth check redirects anonymous capture requests to
    // /login, which silently loses events while PostHog still looks connected.
    "/((?!ingest|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
