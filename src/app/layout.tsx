import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./light-overrides.css";
import AppShell from "@/components/AppShell";
import AnalyticsIdentity from "@/components/AnalyticsIdentity";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PinnedProvider } from "@/context/PinnedContext";
import { ToastProvider } from "@/components/ui/ToastProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "OShift",
  description: "Campaigns and Partnerships Dashboard",
  icons: { icon: "/logo.png" },
  referrer: "no-referrer",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-theme="dark" matches the :root defaults in globals.css, so the
    // server-rendered HTML is already correct for the common case and the
    // script above only has to act when the user has chosen light.
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
        <AnalyticsIdentity />
        <ThemeProvider>
          <PinnedProvider>
            <AppShell>{children}</AppShell>
            <ToastProvider />
          </PinnedProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
