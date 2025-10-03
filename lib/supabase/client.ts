"use client";
import { createClient } from "@supabase/supabase-js";
import { clientEnv } from "@/lib/env";

export const supabaseClient = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function uploadReceiptImage(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const { error } = await supabaseClient.storage
    .from("receipt-images")
    .upload(fileName, file, { cacheControl: "3600", upsert: true });
  if (error) throw error;

  const { data } = supabaseClient.storage.from("receipt-images").getPublicUrl(fileName);
  return data.publicUrl;
}
