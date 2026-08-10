import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // `_next` as a whole is excluded, not just `_next/static|image`: the dev
    // HMR socket lives at `_next/webpack-hmr`, and running it through
    // updateSession answers the WebSocket upgrade with a 307 to /login, which
    // the browser reports as ERR_INVALID_HTTP_RESPONSE and which kills HMR.
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
