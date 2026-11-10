"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const projectSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(5000),
  category: z.string().trim().min(2).max(80),
  memory: z.string().trim().max(2000),
  challenge: z.string().trim().max(2000),
  learning: z.string().trim().max(2000),
  projectUrl: z.string().url().refine((value) => /^https?:\/\//i.test(value), "Usa un enlace http o https"),
  coverImageUrl: z.union([z.literal(""), z.string().url().refine((value) => /^https?:\/\//i.test(value))]),
  publish: z.boolean(),
});

export async function submitProject(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim().toLowerCase();
  if (!/^[a-z0-9-]{6,32}$/.test(code)) throw new Error("El código de sala no es válido.");

  const input = projectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    memory: formData.get("memory") ?? "",
    challenge: formData.get("challenge") ?? "",
    learning: formData.get("learning") ?? "",
    projectUrl: formData.get("projectUrl"),
    coverImageUrl: formData.get("coverImageUrl") ?? "",
    publish: formData.get("publish") === "on",
  });
  if (!input.success) {
    const firstError = input.error.issues[0]?.message ?? "Revisa los datos del proyecto.";
    redirect(`/s/${encodeURIComponent(code)}/proyecto?error=${encodeURIComponent(firstError)}`);
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw new Error(`No se pudo validar la sesión: ${userError.message}`);
  if (!user) redirect(`/auth?mode=register&room=${encodeURIComponent(code)}`);

  const { data: room, error: roomError } = await supabase.rpc("public_activity_by_code", {
    input_share_code: code,
  });
  if (roomError) throw new Error(`No se pudo consultar la sala: ${roomError.message}`);
  const activityId = room?.[0]?.id;
  if (!activityId) redirect(`/s/${encodeURIComponent(code)}`);

  const { error } = await supabase.rpc("submit_project", {
    input_activity_id: activityId,
    input_title: input.data.title,
    input_description: input.data.description,
    input_category: input.data.category,
    input_memory: input.data.memory,
    input_challenge: input.data.challenge,
    input_learning: input.data.learning,
    input_cover_image_url: input.data.coverImageUrl || null,
    input_project_url: input.data.projectUrl,
    input_publish: input.data.publish,
  });
  if (error) {
    redirect(`/s/${encodeURIComponent(code)}/proyecto?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/s/${code}`);
  redirect(`/s/${encodeURIComponent(code)}/proyecto?saved=1`);
}
