/**
 * Downscale/compress an image in the browser before upload.
 *
 * Vercel serverless functions reject request bodies larger than ~4.5 MB (HTTP
 * 413), and phone photos routinely exceed that. Resizing to a sane max
 * dimension and re-encoding as JPEG keeps uploads well under the limit and is
 * also friendlier to the Gemini image API.
 *
 * Falls back to the original file if the browser can't decode it (e.g. some
 * HEIC cases) so the caller still has something to send.
 */
export async function downscaleImage(
  file: File,
  { maxDim = 1600, quality = 0.85 }: { maxDim?: number; quality?: number } = {}
): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file; // can't decode — let the server/limit deal with it
  }

  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  // Even at scale 1 we re-encode to JPEG to drop EXIF bulk / PNG weight.
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  return blob ?? file;
}

/** Downscale and return a File (preserving a sensible name/type). */
export async function downscaleToFile(
  file: File,
  opts?: { maxDim?: number; quality?: number }
): Promise<File> {
  const blob = await downscaleImage(file, opts);
  if (blob === file) return file;
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
