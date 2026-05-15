import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import AppNavbar from "@/components/navigation/AppNavbar";
import { getSiteUrl } from "@/lib/config/site";

const siteUrl = getSiteUrl();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Engleet",
    template: "%s | Engleet",
  },
  description:
    "Gamified English learning for lessons, vocabulary, quizzes, and daily progress.",
  openGraph: {
    title: "Engleet",
    description:
      "Gamified English learning for lessons, vocabulary, quizzes, and daily progress.",
    url: siteUrl,
    siteName: "Engleet",
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Engleet",
    description:
      "Gamified English learning for lessons, vocabulary, quizzes, and daily progress.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppNavbar />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
