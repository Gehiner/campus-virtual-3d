import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export default async function EstudiantePage() {
  if (!getSupabaseConfig()) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>Campus Virtual 3D</h1>
          <p>Para entrar como estudiante, configura primero las variables de Supabase en <code>.env.local</code>.</p>
          <Link className="btn" href="/">Volver al inicio</Link>
        </section>
      </main>
    );
  }

  const current = await getProfile();
  if (!current) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>Acceso de estudiante</h1>
          <p>Inicia sesión o crea una cuenta. Para unirte a una sala, abre el enlace que te compartió tu docente.</p>
          <Link className="btn primary" href="/auth?mode=register">Crear cuenta</Link>
          <Link className="btn" href="/auth?mode=login">Iniciar sesión</Link>
        </section>
      </main>
    );
  }

  if (current.profile.role === "teacher") redirect("/docente");
  if (current.profile.role === "admin") redirect("/admin");

  const supabase = await createClient();
  const { data: memberships, error: membershipError } = await supabase
    .from("activity_participants")
    .select("activity_id")
    .eq("student_id", current.user.id)
    .eq("is_active", true);
  if (membershipError) throw new Error(`No se pudieron cargar tus salas: ${membershipError.message}`);

  const activityIds = (memberships ?? []).map((membership) => membership.activity_id);
  const { data: activities, error: activityError } = activityIds.length
    ? await supabase.from("activities").select("id, title, share_code").in("id", activityIds)
    : { data: [], error: null };
  if (activityError) throw new Error(`No se pudieron consultar tus salas: ${activityError.message}`);

  const [{ data: myLikes, error: likesError }, { data: myQuestions, error: questionsError }] = await Promise.all([
    supabase.from("project_likes").select("project_id, created_at").eq("user_id", current.user.id).order("created_at", { ascending: false }),
    supabase.from("project_questions").select("id, project_id, content, created_at").eq("author_id", current.user.id).order("created_at", { ascending: false }),
  ]);
  if (likesError) throw new Error(`No se pudieron cargar tus likes: ${likesError.message}`);
  if (questionsError) throw new Error(`No se pudieron cargar tus preguntas: ${questionsError.message}`);
  const interactionProjectIds = [...new Set([
    ...(myLikes ?? []).map((item) => item.project_id),
    ...(myQuestions ?? []).map((item) => item.project_id),
  ])];
  const { data: interactionProjects, error: interactionProjectsError } = interactionProjectIds.length
    ? await supabase.from("projects").select("id, title, activity_id").in("id", interactionProjectIds)
    : { data: [], error: null };
  if (interactionProjectsError) throw new Error(`No se pudieron consultar los proyectos de tus interacciones: ${interactionProjectsError.message}`);
  const interactionActivityIds = [...new Set((interactionProjects ?? []).map((project) => project.activity_id))];
  const { data: interactionActivities, error: interactionActivitiesError } = interactionActivityIds.length
    ? await supabase.from("activities").select("id, title, share_code").in("id", interactionActivityIds)
    : { data: [], error: null };
  if (interactionActivitiesError) throw new Error(`No se pudieron consultar las salas de tus interacciones: ${interactionActivitiesError.message}`);
  const interactionProjectById = new Map((interactionProjects ?? []).map((project) => [project.id, project]));
  const interactionActivityById = new Map((interactionActivities ?? []).map((activity) => [activity.id, activity]));

  return (
    <main className="panel-page">
      <header className="panel-header">
        <div>
          <h1>Hola, {current.profile.full_name}</h1>
          <p className="muted">Tus salas y proyectos</p>
        </div>
        <form action="/auth/signout" method="post">
          <button className="btn ghost" type="submit">Cerrar sesión</button>
        </form>
      </header>
      <section className="room-list">
        <h2>Mis salas</h2>
        {activities?.length ? activities.map((activity) => (
          <article className="room-card" key={activity.id}>
            <div>
              <h3>{activity.title}</h3>
              <p className="muted">Enlace de la sala: /s/{activity.share_code}</p>
            </div>
            <Link className="btn" href={`/s/${encodeURIComponent(activity.share_code)}`}>Entrar al campus</Link>
            <Link className="btn primary" href={`/s/${encodeURIComponent(activity.share_code)}/proyecto`}>Publicar mi proyecto</Link>
          </article>
        )) : (
          <p className="notice">Aún no perteneces a ninguna sala. Pídele a tu docente el enlace de invitación.</p>
        )}
      </section>
      <section className="admin-section">
        <h2>Mis interacciones</h2>
        <div className="table-wrap">
          <table><thead><tr><th>Tipo</th><th>Proyecto</th><th>Sala</th><th>Detalle</th></tr></thead>
            <tbody>
              {(myLikes ?? []).map((like) => {
                const project = interactionProjectById.get(like.project_id);
                const activity = project ? interactionActivityById.get(project.activity_id) : null;
                return <tr key={`like-${like.project_id}`}><td>Like</td><td>{project?.title ?? "Proyecto no disponible"}</td><td>{activity?.title ?? "Sala"}</td><td>{new Date(like.created_at).toLocaleDateString("es")}</td></tr>;
              })}
              {(myQuestions ?? []).map((question) => {
                const project = interactionProjectById.get(question.project_id);
                const activity = project ? interactionActivityById.get(project.activity_id) : null;
                return <tr key={`question-${question.id}`}><td>Pregunta</td><td>{project?.title ?? "Proyecto no disponible"}</td><td>{activity?.title ?? "Sala"}</td><td>{question.content}</td></tr>;
              })}
              {!myLikes?.length && !myQuestions?.length && <tr><td colSpan={4}>Todavía no tienes interacciones.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
