"use client";
import { createClient } from "@supabase/supabase-js";
import { clientEnv } from "@/lib/env";

export const supabaseClient = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
