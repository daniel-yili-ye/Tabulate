import { createClient } from "@supabase/supabase-js";
import { clientEnv, serverEnv } from "@/lib/env";

export const supabaseServer = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY || clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function saveBillData(billData: any) {
  const { data, error } = await supabaseServer.from("bills").insert([billData]).select("id");
  if (error) throw error;
  return data?.[0]?.id as string | undefined;
}

export async function getBillData(id: string) {
  const { data, error } = await supabaseServer.from("bills").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}
