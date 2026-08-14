import type { NextConfig } from "next";

const backendUrl =
  process.env.API_BACKEND_URL ?? "http://localhost:8000";

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
  allowedDevOrigins: ['192.168.1.6', '192.168.1.9', '192.168.1.15', '192.168.1.3'],
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
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
