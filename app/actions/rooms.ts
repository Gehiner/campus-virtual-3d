"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function joinRoom(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9-]{6,32}$/.test(code)) {
    redirect(`/s/${encodeURIComponent(code)}?error=${encodeURIComponent("El código de sala no es válido.")}`);
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(`No se pudo validar la sesión: ${userError.message}`);
  if (!user) redirect(`/auth?mode=register&room=${encodeURIComponent(code)}`);

  const { error } = await supabase.rpc("enroll_in_activity", { input_share_code: code });
  if (error) {
    redirect(`/s/${encodeURIComponent(code)}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/s/${encodeURIComponent(code)}`);
}
