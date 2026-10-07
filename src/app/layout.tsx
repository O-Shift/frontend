import type { Metadata } from "next";
import { headers } from "next/headers";
import { SURFACE_HEADER } from "@/lib/site-routing";
import { Inter } from "next/font/google";
import "./globals.css";
import "./light-overrides.css";
import AppShell from "@/components/AppShell";
import AnalyticsIdentity from "@/components/AnalyticsIdentity";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PinnedProvider } from "@/context/PinnedContext";
import { ToastProvider } from "@/components/ui/ToastProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

/**
 * Origin used to resolve the relative URLs in `metadata` (currently `og:image`).
 * It has to be the stable production origin rather than `VERCEL_URL`: that value
 * is unique per deployment, so a preview build would bake a one-off hostname into
 * tags that social crawlers then cache and keep serving.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.orangeshift.net";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "OShift",
  description: "Campaigns and Partnerships Dashboard",
  icons: { icon: "/logo.png" },
  referrer: "no-referrer",
  // `openGraph` deliberately omits `title`/`description`/`url`. Every field set
  // here is inherited by every route, so a literal value would override the copy
  // of each child segment — and an inherited `url` would make /login claim to be
  // the site root. Left unset, Next fills og:title/og:description from the page's
  // own `title`/`description`, which is what we want on the auth screens that
  // unauthenticated crawlers actually land on.
  openGraph: {
    type: "website",
    siteName: "OShift",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "OShift — competitive intelligence, continuously",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
  },
};

/**
 * Applies the saved theme while the browser is still parsing <head>, before the
 * first paint. This is what lets ThemeProvider render its children immediately:
 * it used to return null until a mount effect had run, which meant the server
 * sent an empty <body> and the user stared at a blank white page until the JS
 * bundle downloaded, parsed, and hydrated — on every hard navigation, and ahead
 * of any skeleton or loading state that might otherwise have filled the gap.
 *
 * Resolution must match ThemeProvider's effect exactly (saved value, else the
 * OS preference) or the two would disagree and the theme would visibly switch
 * once React took over.
 */
const THEME_INIT = `(function(){try{var t=localStorage.getItem("oshift-theme");if(!t)t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const marketing = (await headers()).get(SURFACE_HEADER) === "marketing";
  return (
    // data-theme="dark" matches the :root defaults in globals.css, so the
    // server-rendered HTML is already correct for the common case and the
    // script above only has to act when the user has chosen light.
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
        {!marketing && <AnalyticsIdentity />}
        <ThemeProvider>
          {marketing ? (
            children
          ) : (
            <PinnedProvider>
              <AppShell>{children}</AppShell>
            </PinnedProvider>
          )}
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
