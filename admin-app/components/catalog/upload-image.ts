export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadCatalogImage(
  file: File,
  folder: "products" | "categories"
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  try {
    const response = await fetch("/api/catalog/upload", {
      method: "POST",
      body: formData,
    });

    const result = (await response.json()) as {
      ok?: boolean;
      url?: string;
      message?: string;
    };

    if (!response.ok || !result.ok || !result.url) {
      return {
        ok: false,
        error: result.message ?? "The image could not be uploaded.",
      };
    }

    return { ok: true, url: result.url };
  } catch {
    return { ok: false, error: "The upload failed. Check your connection." };
  }
}
