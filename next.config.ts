import type { NextConfig } from "next";

// PostHog is served from our own origin under /ingest so that ad blockers and
// browser tracking protection cannot drop analytics requests — otherwise the
// blocked users disappear from funnels and every drop-off number is wrong.
const posthogHost = (
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"
).replace(/\/$/, "");
const posthogAssetsHost = posthogHost.replace(
  ".i.posthog.com",
  "-assets.i.posthog.com",
);

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.1.2',
    '192.168.1.3',
    '192.168.1.6',
    '192.168.1.9',
    '192.168.1.15',
  ],
  // PostHog's capture endpoints end in a slash (e.g. /e/); letting Next.js
  // redirect to strip it breaks event capture.
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      // Rewrites are matched top-down, so the two asset paths have to come
      // before the /ingest catch-all.
      {
        source: "/ingest/static/:path*",
        destination: `${posthogAssetsHost}/static/:path*`,
      },
      {
        // Remote config (/array/{token}/config.js) needs the asset host, which
        // keeps its cache-control headers.
        source: "/ingest/array/:path*",
        destination: `${posthogAssetsHost}/array/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${posthogHost}/:path*`,
      },
    ];
  },
  // `/api/*` is proxied by src/app/api/[...path]/route.ts, not by a rewrite.
  // A rewrite buffers text/event-stream and truncates it, which broke agent
  // chat; the route handler forwards the response body stream untouched.
};

export default nextConfig;
