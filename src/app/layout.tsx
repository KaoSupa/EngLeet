import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import AppNavbar, {
  type AppNavbarUser,
} from "@/components/navigation/AppNavbar";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { getUserIdentity } from "@/lib/users/profile";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.engleet.com";

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
  return <RootLayoutContent>{children}</RootLayoutContent>;
}

async function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const navbarUser = await getNavbarUser();

  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppNavbar user={navbarUser} />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

async function getNavbarUser(): Promise<AppNavbarUser | null> {
  const { supabase, user } = await getAuthenticatedSession();

  if (!user) {
    return null;
  }

  const { identity } = await getUserIdentity(supabase, user.id);
  const displayName =
    identity?.displayName ?? identity?.username ?? user.email ?? "Learner";

  return {
    displayName,
    email: user.email,
    avatarUrl: identity?.avatarUrl ?? null,
    role: identity?.role ?? user.role ?? "user",
  };
}
