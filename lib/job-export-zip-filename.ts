/** Safe single-segment name for ZIP entries (no path traversal). */
export function safeZipEntryName(name: string, fallback = "file.bin"): string {
  const trimmed = name.replace(/[/\\]/g, "_").replace(/\.\./g, "_").trim().slice(0, 120);
  return trimmed || fallback;
}
