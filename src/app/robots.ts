import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { SURFACE_HEADER, siteOrigins } from "@/lib/site-routing";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const marketing = (await headers()).get(SURFACE_HEADER) === "marketing";
  return marketing
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: ["/api/", "/auth/", "/login", "/signup", "/start"],
        },
        sitemap: `${siteOrigins().marketing.origin}/sitemap.xml`,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
