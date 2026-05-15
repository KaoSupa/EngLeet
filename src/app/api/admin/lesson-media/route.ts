import { NextResponse } from "next/server";

import {
  assertRateLimit,
  getRateLimitIdentity,
  RateLimitError,
} from "@/lib/api/rate-limit";
import { getApiAdmin } from "@/lib/auth/api";
import { createServiceClient } from "@/lib/supabase/service";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function safeExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]{2,5}$/.test(extension)) {
    return extension;
  }

  return file.type.split("/")[1] ?? "bin";
}

export async function POST(request: Request) {
  const { response, user } = await getApiAdmin();
  if (response || !user) {
    return response;
  }

  try {
    await assertRateLimit({
      key: getRateLimitIdentity({
        prefix: "admin-lesson-media",
        userId: user.id,
      }),
      limit: 30,
      windowMs: 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }

    return NextResponse.json(
      { error: "Unable to validate request limit" },
      { status: 500 },
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WEBP, and GIF images are allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image must be 5MB or smaller" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const path = `lessons/${user.id}/${crypto.randomUUID()}.${safeExtension(file)}`;
  const { error } = await supabase.storage
    .from("lesson-media")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("lesson-media").getPublicUrl(path);

  return NextResponse.json({
    data: {
      path,
      url: data.publicUrl,
    },
  });
}
