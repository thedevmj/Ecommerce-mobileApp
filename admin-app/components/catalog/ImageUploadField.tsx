"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useId, useState } from "react";
import { isValidImageUrl } from "@/lib/catalog";
import { uploadCatalogImage } from "./upload-image";

type ImageUploadFieldProps = {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string | null;
  folder: "products" | "categories";
};

export default function ImageUploadField({
  name,
  label,
  hint,
  defaultValue,
  folder,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = url && isValidImageUrl(url) ? url : "";

  async function handleFile(file: File | undefined) {
    if (!file) return;

    setUploading(true);
    setError(null);

    const result = await uploadCatalogImage(file, folder);

    if (result.ok) {
      setUrl(result.url);
    } else {
      setError(result.error);
    }

    setUploading(false);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
        {url ? (
          <button
            type="button"
            onClick={() => setUrl("")}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted transition hover:text-danger"
          >
            <X size={13} />
            Clear
          </button>
        ) : null}
      </div>

      <div className="flex gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-line bg-canvas">
          {preview ? (
            <Image
              src={preview}
              alt=""
              fill
              unoptimized
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-muted">
              <ImagePlus size={20} />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            id={inputId}
            name={name}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://... or upload a file"
            className="h-10 w-full rounded-xl border border-line bg-canvas px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10"
          />
          <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-line bg-panel px-3 text-xs font-semibold shadow-sm transition hover:bg-canvas">
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ImagePlus size={14} />
            )}
            {uploading ? "Uploading" : "Upload image"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => {
                void handleFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {hint ? <p className="mt-1.5 text-xs leading-5 text-muted">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
