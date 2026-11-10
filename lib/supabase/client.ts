"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function createClient() {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error(
      "Configura NEXT_PUBLIC_SUPABASE_URL y una clave pública Supabase Publishable/anon. Nunca uses sb_secret_ ni service_role.",
    );
  }
  return createBrowserClient(config.url, config.anonKey);
}
