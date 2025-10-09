import { createClient } from "@supabase/supabase-js";
import { clientEnv, serverEnv } from "@/lib/env";

export const supabaseServer = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY || clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function saveTabData(tabData: any, slug: string) {
  const { data, error } = await supabaseServer.from("tabs").insert([{...tabData, slug}]).select("id");
  if (error) throw error;
  return data?.[0]?.id as string | undefined;
}

export async function getTabData(slug: string) {
  const { data, error } = await supabaseServer.from("tabs").select("*").eq("slug", slug).single();
  console.log("data", data);
  if (error) throw error;
  return data;
}
