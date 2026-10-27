import { headers } from "next/headers";

export async function getRequestOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin && origin !== "null") {
    return origin.replace(/\/$/, "");
  }

  const host = (
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    "localhost:3000"
  )
    .split(",")[0]
    .trim();
  const protocol = (
    headerStore.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https")
  )
    .split(",")[0]
    .trim();

  return `${protocol}://${host}`;
}
