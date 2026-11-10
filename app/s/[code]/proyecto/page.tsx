import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { submitProject } from "@/app/actions/projects";

type Props = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function ProjectEditorPage({ params, searchParams }: Props) {
  const { code } = await params;
  const query = await searchParams;
  if (!/^[a-z0-9-]{6,32}$/i.test(code)) redirect("/estudiante");
  if (!getSupabaseConfig()) {
    return <main className="panel-page"><h1>Supabase aún no está configurado</h1></main>;
  }

  const current = await getProfile();
  if (!current) redirect(`/auth?mode=register&room=${encodeURIComponent(code)}`);
  if (current.profile.role !== "student") redirect(`/s/${encodeURIComponent(code)}`);

  const supabase = await createClient();
  const { data: room, error: roomError } = await supabase.rpc("public_activity_by_code", {
    input_share_code: code,
  });
  if (roomError) throw new Error(`No se pudo consultar la sala: ${roomError.message}`);
  const activity = room?.[0];
  if (!activity) redirect("/estudiante");

  const { data: membership, error: membershipError } = await supabase
    .from("activity_participants")
    .select("id")
    .eq("activity_id", activity.id)
    .eq("student_id", current.user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (membershipError) throw new Error(`No se pudo verificar tu inscripción: ${membershipError.message}`);
  if (!membership) redirect(`/s/${encodeURIComponent(code)}?join=1`);

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("title, description, category, memory, challenge, learning, project_url, cover_image_url, status")
    .eq("activity_id", activity.id)
    .eq("student_id", current.user.id)
    .maybeSingle();
  if (projectError) throw new Error(`No se pudo cargar tu proyecto: ${projectError.message}`);

  return (
    <main className="panel-page">
      <header className="panel-header">
        <div>
          <Link className="auth-back" href={`/s/${encodeURIComponent(code)}`}>← Volver a la sala</Link>
          <h1>{project ? "Editar mi proyecto" : "Publicar mi proyecto"}</h1>
          <p className="muted">{activity.title}</p>
        </div>
      </header>
      {query.saved === "1" && <p className="success-message">Proyecto guardado correctamente.</p>}
      {query.error && <p className="auth-message" role="alert">{query.error}</p>}
      {project?.status === "hidden" ? (
        <p className="notice">El docente ocultó este proyecto. Ponte en contacto con él si necesitas cambios o quieres volver a publicarlo.</p>
      ) : (
      <form className="project-form" action={submitProject}>
        <input type="hidden" name="code" value={code} />
        <label>Título<input name="title" defaultValue={project?.title ?? ""} minLength={2} maxLength={120} required /></label>
        <label>Descripción<textarea name="description" defaultValue={project?.description ?? ""} minLength={10} maxLength={5000} required /></label>
        <label>Categoría<input name="category" defaultValue={project?.category ?? "Proyecto estudiantil"} maxLength={80} required /></label>
        <label>Enlace al proyecto<input name="projectUrl" type="url" defaultValue={project?.project_url ?? ""} placeholder="https://..." required /></label>
        <label>Enlace opcional de portada<input name="coverImageUrl" type="url" defaultValue={project?.cover_image_url ?? ""} placeholder="https://..." /></label>
        <label>La memoria detrás del proyecto<textarea name="memory" defaultValue={project?.memory ?? ""} maxLength={2000} /></label>
        <label>El reto<textarea name="challenge" defaultValue={project?.challenge ?? ""} maxLength={2000} /></label>
        <label>Lo que aprendí<textarea name="learning" defaultValue={project?.learning ?? ""} maxLength={2000} /></label>
        <label className="checkbox-label">
          <input type="checkbox" name="publish" defaultChecked={project?.status === "published"} />
          Publicar en el campus y ocupar un stand
        </label>
        <button className="btn primary" type="submit">Guardar proyecto</button>
      </form>
      )}
    </main>
  );
}
