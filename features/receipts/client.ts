import { RECEIPTS_BUCKET } from "@/lib/env";
import { toJpeg } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import type { ParsedReceipt } from "./extraction";

export { toJpeg };

/** Upload a prepared photo into the user's own folder. Returns its storage path. */
export async function uploadReceipt(image: Blob, userId: string): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.jpg`;
  const { error } = await createClient()
    .storage.from(RECEIPTS_BUCKET)
    .upload(path, image, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw new Error("Couldn't upload the photo. Check your connection and try again.");
  return path;
}

/** Best effort: an orphaned photo is harmless, so failures are ignored. */
export async function removeReceipt(path: string): Promise<void> {
  await createClient().storage.from(RECEIPTS_BUCKET).remove([path]);
}

export async function parseReceipt(
  path: string,
  signal?: AbortSignal,
): Promise<ParsedReceipt> {
  const response = await fetch("/api/receipts/parse", {
    signal,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? "We couldn't read that receipt. Try again.");
  }
  return body as ParsedReceipt;
}
