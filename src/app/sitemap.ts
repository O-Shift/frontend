import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { SURFACE_HEADER, siteOrigins } from "@/lib/site-routing";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return (await headers()).get(SURFACE_HEADER) === "marketing"
    ? [
        {
          url: siteOrigins().marketing.origin,
          changeFrequency: "monthly",
          priority: 1,
        },
      ]
    : [];
}
