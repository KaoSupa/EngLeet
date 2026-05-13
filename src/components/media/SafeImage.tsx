import Image from "next/image";

import { cn } from "@/lib/utils";

type SafeImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

const OPTIMIZED_REMOTE_HOSTS = new Set([
  "images.unsplash.com",
  "lh3.googleusercontent.com",
]);

function getSupabaseHost() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
}

function canUseNextImage(src: string) {
  if (src.startsWith("/")) {
    return true;
  }

  try {
    const hostname = new URL(src).hostname;
    const supabaseHost = getSupabaseHost();

    return (
      OPTIMIZED_REMOTE_HOSTS.has(hostname) ||
      (Boolean(supabaseHost) && hostname === supabaseHost)
    );
  } catch {
    return false;
  }
}

export default function SafeImage({
  src,
  alt,
  fill,
  priority,
  sizes,
  className,
}: SafeImageProps) {
  if (canUseNextImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        priority={priority}
        sizes={sizes}
        className={className}
      />
    );
  }

  return (
    // External admin-entered images should be migrated to Supabase Storage.
    // This fallback prevents unknown hosts from crashing Next Image rendering.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
