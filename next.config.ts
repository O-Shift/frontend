import type { NextConfig } from "next";

const backendUrl =
  process.env.API_BACKEND_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.6', '192.168.1.9', '192.168.1.15', '192.168.1.3'],
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
