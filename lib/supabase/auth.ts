import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError?.name === "AuthSessionMissingError") return null;
  if (userError) throw new Error(`No se pudo validar la sesión: ${userError.message}`);
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();
  if (error) throw new Error(`No se pudo cargar el perfil: ${error.message}`);
  return { user, profile };
}

export async function requireRole(roles: string[]) {
  const current = await getProfile();
  if (!current) redirect("/auth");
  if (!roles.includes(current.profile.role)) redirect("/");
  return current;
}
