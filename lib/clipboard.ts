"use client";

import { toast } from "sonner";

/** Copy text and confirm with a toast. Falls back gracefully when blocked. */
export async function copyText(text: string, confirmation: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(confirmation);
  } catch {
    toast.error("Couldn't copy. Select the text and copy it manually.");
  }
}
