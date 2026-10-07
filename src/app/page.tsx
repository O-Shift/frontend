import { headers } from "next/headers";
import type { Metadata } from "next";
import DashboardHome from "@/components/dashboard/Home";
import LandingPage from "./landing/page";
import LandingLayout, { metadata as landingMetadata } from "./landing/layout";
import { SURFACE_HEADER, siteOrigins } from "@/lib/site-routing";

export async function generateMetadata(): Promise<Metadata> {
  const marketing = (await headers()).get(SURFACE_HEADER) === "marketing";
  return marketing
    ? {
        ...landingMetadata,
        alternates: { canonical: siteOrigins().marketing.origin },
      }
    : { title: "OShift Dashboard", robots: { index: false, follow: false } };
}

export default async function HomePage() {
  const marketing = (await headers()).get(SURFACE_HEADER) === "marketing";
  return marketing ? (
    <LandingLayout>
      <LandingPage />
    </LandingLayout>
  ) : (
    <DashboardHome />
  );
}
