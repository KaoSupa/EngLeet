import type { NextConfig } from "next";

function getSupabaseStorageHostname() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "nwffjpicmflcugmgiede.supabase.co";
  }
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: getSupabaseStorageHostname(),
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
