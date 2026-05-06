import { readFile } from "fs/promises";
import { join } from "path";

function serverOrigin(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Load image bytes for a job photo (local public file, Vercel Blob URL, or same-origin URL).
 */
export async function getPhotoImageBytes(photo: {
  url: string | null;
  storageKey: string | null;
}): Promise<Uint8Array | null> {
  if (photo.url?.startsWith("http://") || photo.url?.startsWith("https://")) {
    const res = await fetch(photo.url, { cache: "no-store" });
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  }

  if (photo.url?.startsWith("/")) {
    const rel = photo.url.replace(/^\//, "");
    const path = join(process.cwd(), "public", rel);
    try {
      const buf = await readFile(path);
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    } catch {
      const res = await fetch(`${serverOrigin()}${photo.url}`, { cache: "no-store" });
      if (!res.ok) return null;
      return new Uint8Array(await res.arrayBuffer());
    }
  }

  if (photo.storageKey?.startsWith("uploads/")) {
    const path = join(process.cwd(), "public", photo.storageKey);
    try {
      const buf = await readFile(path);
      return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
    } catch {
      return null;
    }
  }

  return null;
}
