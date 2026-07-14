import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "./light-overrides.css";
import "./profile.css";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "OShift",
  description: "Campaigns and Partnerships Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans`}>
        <ThemeProvider>
          <div className="app-window">
            <Sidebar />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
