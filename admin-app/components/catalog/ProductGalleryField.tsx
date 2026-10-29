"use client";

import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Plus,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { isValidImageUrl } from "@/lib/catalog";
import { uploadCatalogImage } from "./upload-image";

type ProductGalleryFieldProps = {
  defaultValue?: string[];
};

const MAX_IMAGES = 8;

export default function ProductGalleryField({
  defaultValue = [],
}: ProductGalleryFieldProps) {
  const [urls, setUrls] = useState(defaultValue.slice(0, MAX_IMAGES));
  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addUrl(value: string) {
    const url = value.trim();

    if (!url) return;

    if (!isValidImageUrl(url)) {
      setError("Enter a valid http(s) image URL.");
      return;
    }

    if (urls.includes(url)) {
      setError("That image is already in the gallery.");
      return;
    }

    if (urls.length >= MAX_IMAGES) {
      setError(`Galleries can contain up to ${MAX_IMAGES} images.`);
      return;
    }

    setUrls((current) => [...current, url]);
    setDraft("");
    setError(null);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;

    if (target < 0 || target >= urls.length) return;

    setUrls((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    setUploading(true);
    setError(null);
    const available = Math.max(0, MAX_IMAGES - urls.length);
    const selected = Array.from(files);
    const results = await Promise.all(
      selected
        .slice(0, available)
        .map((file) => uploadCatalogImage(file, "products"))
    );
    const added = results.flatMap((result) => (result.ok ? [result.url] : []));
    const failed = results.find((result) => !result.ok);

    if (added.length) {
      setUrls((current) => [...current, ...added].slice(0, MAX_IMAGES));
    }

    setError(
      selected.length > available
        ? `Galleries can contain up to ${MAX_IMAGES} images.`
        : failed && !failed.ok
          ? failed.error
          : null
    );
    setUploading(false);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Gallery</p>
          <p className="text-xs text-muted">
            Up to {MAX_IMAGES} images. The first image appears first.
          </p>
        </div>
        <span className="text-xs font-medium text-muted">
          {urls.length}/{MAX_IMAGES}
        </span>
      </div>

      <input type="hidden" name="gallery" value={urls.join("\n")} />

      {urls.length ? (
        <ul className="space-y-2">
          {urls.map((url, index) => (
            <li
              key={url}
              className="flex items-center gap-3 rounded-2xl border border-line bg-canvas p-2"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-panel">
                <Image
                  src={url}
                  alt=""
                  fill
                  unoptimized
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <p className="min-w-0 flex-1 truncate text-xs text-muted">
                {url}
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move image up"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-panel hover:text-ink disabled:opacity-30"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === urls.length - 1}
                  aria-label="Move image down"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-panel hover:text-ink disabled:opacity-30"
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setUrls((current) =>
                      current.filter((item) => item !== url)
                    )
                  }
                  aria-label="Remove image"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-danger-soft hover:text-danger"
                >
                  <X size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-line bg-canvas px-4 py-6 text-center text-xs text-muted">
          No gallery images yet.
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Add image URL</span>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addUrl(draft);
              }
            }}
            placeholder="Paste an image URL"
            className="h-10 w-full rounded-xl border border-line bg-canvas px-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-panel focus:ring-4 focus:ring-brand/10"
          />
        </label>
        <button
          type="button"
          onClick={() => addUrl(draft)}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-panel px-3 text-xs font-semibold shadow-sm transition hover:bg-canvas"
        >
          <Plus size={14} />
          Add
        </button>
        <label className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-panel px-3 text-xs font-semibold shadow-sm transition hover:bg-canvas">
          {uploading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          {uploading ? "Uploading" : "Upload"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              void handleFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
      {!urls.length ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
          <ImagePlus size={13} />
          Add at least one gallery image for a richer product page.
        </p>
      ) : null}
    </div>
  );
}
