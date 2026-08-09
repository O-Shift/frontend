import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./light-overrides.css";
import "./profile.css";
import AppShell from "@/components/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PinnedProvider } from "@/context/PinnedContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "OShift",
  description: "Campaigns and Partnerships Dashboard",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`} suppressHydrationWarning>
        <ThemeProvider>
          <PinnedProvider>
            <AppShell>{children}</AppShell>
          </PinnedProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
