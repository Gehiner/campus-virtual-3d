"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const createRoomSchema = z.object({
  title: z.string().trim().min(2).max(120),
  teacherId: z.union([z.literal(""), z.string().uuid()]),
});

export async function createRoom(formData: FormData) {
  const parsed = createRoomSchema.safeParse({
    title: formData.get("title"),
    teacherId: formData.get("teacherId") ?? "",
  });
  if (!parsed.success) redirect(`/admin?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Datos inválidos")}`);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`No se pudo validar la sesión: ${authError.message}`);
  if (!user) redirect("/auth");

  const { data, error } = await supabase.rpc("create_activity", {
    input_title: parsed.data.title,
    input_teacher_id: parsed.data.teacherId || null,
  });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  const room = data?.[0];
  if (!room) throw new Error("Supabase no devolvió la sala creada.");
  revalidatePath("/admin");
  redirect(`/admin?created=${encodeURIComponent(room.share_code)}`);
}

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["student", "teacher"]),
});

export async function assignUserRole(formData: FormData) {
  const parsed = roleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) redirect(`/admin?error=${encodeURIComponent("Selecciona un perfil y rol válidos.")}`);

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`No se pudo validar la sesión: ${authError.message}`);
  if (!user) redirect("/auth");

  const { error } = await supabase.rpc("admin_set_user_role", {
    input_user_id: parsed.data.userId,
    input_role: parsed.data.role,
  });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin");
  redirect("/admin?updated=1");
}

export async function assignRoomTeacher(formData: FormData) {
  const activityId = String(formData.get("activityId") ?? "");
  const teacherId = String(formData.get("teacherId") ?? "");
  if (!z.string().uuid().safeParse(activityId).success
    || (teacherId && !z.string().uuid().safeParse(teacherId).success)) {
    redirect(`/admin?error=${encodeURIComponent("La sala o el docente no son válidos.")}`);
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_assign_activity_teacher", {
    input_activity_id: activityId,
    input_teacher_id: teacherId || null,
  });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin");
  redirect("/admin?updated=1");
}

export async function setRoomActive(formData: FormData) {
  const activityId = String(formData.get("activityId") ?? "");
  const isActive = String(formData.get("isActive") ?? "");
  if (!z.string().uuid().safeParse(activityId).success || !["true", "false"].includes(isActive)) {
    redirect(`/admin?error=${encodeURIComponent("La sala o el estado no son válidos.")}`);
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`No se pudo validar la sesión: ${authError.message}`);
  if (!user) redirect("/auth");

  const { error } = await supabase
    .from("activities")
    .update({ is_active: isActive === "true" })
    .eq("id", activityId);
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin");
  redirect(`/admin?${isActive === "true" ? "activated=1" : "deactivated=1"}`);
}

export async function updateProfileName(formData: FormData) {
  const parsed = z.object({
    userId: z.string().uuid(),
    fullName: z.string().trim().min(2).max(120),
  }).safeParse({
    userId: formData.get("userId"),
    fullName: formData.get("fullName"),
  });
  if (!parsed.success) redirect(`/admin?error=${encodeURIComponent("El nombre debe tener entre 2 y 120 caracteres.")}`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_profile_name", {
    input_user_id: parsed.data.userId,
    input_full_name: parsed.data.fullName,
  });
  if (error) redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin");
  redirect("/admin?updated=1");
}

export async function removeStudentFromRoom(formData: FormData) {
  const activityId = String(formData.get("activityId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  const code = String(formData.get("code") ?? "");
  if (!z.string().uuid().safeParse(activityId).success || !z.string().uuid().safeParse(studentId).success) {
    throw new Error("La sala o el estudiante no son válidos.");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("teacher_remove_student", {
    input_activity_id: activityId,
    input_student_id: studentId,
  });
  if (error) redirect(`/docente?room=${encodeURIComponent(code)}&error=${encodeURIComponent(error.message)}`);
  revalidatePath("/docente");
  redirect(`/docente?room=${encodeURIComponent(code)}&removed=1`);
}

export async function moderateProject(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "");
  const code = String(formData.get("code") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!z.string().uuid().safeParse(projectId).success || !["published", "hidden"].includes(status)) {
    throw new Error("El estado o el proyecto no son válidos.");
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("teacher_set_project_status", {
    input_project_id: projectId,
    input_status: status,
  });
  if (error) throw new Error(`No se pudo moderar el proyecto: ${error.message}`);
  revalidatePath("/docente");
  redirect(`/docente?room=${encodeURIComponent(code)}&moderated=1`);
}

export async function answerQuestion(formData: FormData) {
  const questionId = String(formData.get("questionId") ?? "");
  const code = String(formData.get("code") ?? "");
  const content = z.string().trim().min(2).max(2000).safeParse(formData.get("content"));
  if (!z.string().uuid().safeParse(questionId).success || !content.success) {
    throw new Error("La respuesta debe tener entre 2 y 2000 caracteres.");
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error(`No se pudo validar la sesión: ${authError.message}`);
  if (!user) redirect("/auth");
  const { error } = await supabase.from("project_answers").insert({
    question_id: questionId,
    author_id: user.id,
    content: content.data,
  });
  if (error) throw new Error(`No se pudo guardar la respuesta: ${error.message}`);
  revalidatePath("/docente");
  redirect(`/docente?room=${encodeURIComponent(code)}&answered=1`);
}
