import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function safeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-80);
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if ("error" in session) {
    return NextResponse.json(
      { ok: false, message: session.error },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = formData.get("folder") === "categories" ? "categories" : "products";

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, message: "Choose an image file to upload." },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { ok: false, message: "Use a JPG, PNG, WebP, or GIF image." },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, message: "Images must be 5 MB or smaller." },
      { status: 400 }
    );
  }

  const extension = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : "";
  const objectPath = `${folder}/${crypto.randomUUID()}-${safeName(
    file.name
  )}${extension && !safeName(file.name).endsWith(extension) ? extension : ""}`;

  const { error } = await session.supabase.storage
    .from(BUCKET)
    .upload(objectPath, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) {
    const missingBucket =
      error.message.toLowerCase().includes("bucket") ||
      error.message.toLowerCase().includes("not found");

    return NextResponse.json(
      {
        ok: false,
        message: missingBucket
          ? "The product-images bucket is not configured. Apply migration 0005_catalog_storage.sql."
          : error.message,
      },
      { status: 400 }
    );
  }

  const { data } = session.supabase.storage.from(BUCKET).getPublicUrl(objectPath);

  return NextResponse.json({ ok: true, url: data.publicUrl });
}
