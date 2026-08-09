import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '192.168.1.2',
    '192.168.1.3',
    '192.168.1.6',
    '192.168.1.9',
    '192.168.1.15',
  ],
  turbopack: {
    root: __dirname,
  },
  // `/api/*` is proxied by src/app/api/[...path]/route.ts, not by a rewrite.
  // A rewrite buffers text/event-stream and truncates it, which broke agent
  // chat; the route handler forwards the response body stream untouched.
};

export default nextConfig;
