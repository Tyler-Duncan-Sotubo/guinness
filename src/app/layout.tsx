import type { Metadata, Viewport } from "next";
import { Roboto_Condensed } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NextAuthProvider } from "@/server/provider/session-provider";
import Providers from "@/server/provider/query-provider";
import { AppProvider } from "@/server/provider/app-provider";
import { Suspense } from "react";
import ScrollToTop from "@/components/navigation/ScrollToTop";

const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-condensed",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "Guinness Matchday – Event Registration & Experiences",
  description:
    "Register for Guinness Matchday events, explore epic football viewing experiences, and stay connected with the Guinness Football Fans community.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${robotoCondensed.variable} antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>
          <NextAuthProvider>
            <Providers>
              <AppProvider>
                {children} <ScrollToTop />
              </AppProvider>
            </Providers>
            <Toaster />
          </NextAuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
