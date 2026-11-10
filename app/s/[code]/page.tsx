import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CampusLoader from "@/components/CampusLoader";
import { joinRoom } from "@/app/actions/rooms";
import { getProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Project } from "@/data/projects";

type Props = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ view?: string; join?: string; error?: string }>;
};

const PROJECT_COLORS = ["#ff4d8d", "#ffb02e", "#2dd4ff", "#7c5cff", "#3ddc97", "#5aa9ff", "#ff7a45", "#e45cff"];

export default async function RoomPage({ params, searchParams }: Props) {
  const { code } = await params;
  const query = await searchParams;
  if (!/^[a-z0-9-]{6,32}$/i.test(code)) notFound();

  if (!getSupabaseConfig()) {
    return <main className="panel-page"><h1>Campus aún no configurado</h1><p>Configura las variables de Supabase para abrir esta sala.</p></main>;
  }

  const supabase = await createClient();
  const { data: rooms, error: roomError } = await supabase.rpc("public_activity_by_code", {
    input_share_code: code,
  });
  if (roomError) throw new Error(`No se pudo consultar la sala: ${roomError.message}`);
  const room = rooms?.[0];
  if (!room) notFound();

  if (query.view === "1") {
    const projects = await loadProjects(code);
    return <CampusLoader role="observador" projects={projects} activityCode={code} />;
  }

  const current = await getProfile();
  if (!current) {
    return (
      <RoomLanding code={code} title={room.title} error={query.error}
        registerHref={`/auth?mode=register&room=${encodeURIComponent(code)}`}
        loginHref={`/auth?mode=login&room=${encodeURIComponent(code)}`} />
    );
  }

  if (current.profile.role === "admin" || current.profile.role === "teacher") {
    if (current.profile.role === "teacher" && room.id !== (await getAssignedRoomId(code, current.user.id))) {
      redirect("/docente");
    }
    return <CampusLoader role="docente" projects={await loadProjects(code)} activityCode={code} />;
  }

  const { data: participant, error: participantError } = await supabase
    .from("activity_participants")
    .select("is_active")
    .eq("activity_id", room.id)
    .eq("student_id", current.user.id)
    .maybeSingle();
  if (participantError) throw new Error(`No se pudo verificar tu acceso a la sala: ${participantError.message}`);
  if (!participant?.is_active || query.join === "1") {
    return (
      <RoomLanding code={code} title={room.title} error={query.error}
        onJoin={joinRoom} registered />
    );
  }

  return <CampusLoader role="estudiante" projects={await loadProjects(code)} activityCode={code} />;
}

async function loadProjects(code: string): Promise<Project[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_projects_by_code", { input_share_code: code });
  if (error) throw new Error(`No se pudieron cargar los proyectos: ${error.message}`);
  const rows: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    memory: string;
    challenge: string;
    learning: string;
    cover_image_url: string | null;
    project_url: string;
    author_name: string;
    stand_code: string | null;
  }> = data ?? [];
  return rows.map((project, index) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    author: project.author_name,
    url: project.project_url,
    color: PROJECT_COLORS[index % PROJECT_COLORS.length],
    category: project.category,
    memory: project.memory,
    challenge: project.challenge,
    learning: project.learning,
    coverUrl: project.cover_image_url ?? undefined,
  }));
}

async function getAssignedRoomId(code: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("id")
    .eq("share_code", code)
    .eq("teacher_id", userId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo verificar el docente de la sala: ${error.message}`);
  return data?.id ?? null;
}

function RoomLanding({
  code,
  title,
  error,
  registerHref,
  loginHref,
  onJoin,
  registered = false,
}: {
  code: string;
  title: string;
  error?: string;
  registerHref?: string;
  loginHref?: string;
  onJoin?: (formData: FormData) => Promise<void>;
  registered?: boolean;
}) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="auth-back">← Campus Virtual 3D</Link>
        <span className="badge">SALA DE PROYECTOS</span>
        <h1>{title}</h1>
        <p>Entra para explorar los proyectos de esta sala.</p>
        {error && <p className="auth-message" role="alert">{error}</p>}
        {registered && onJoin ? (
          <form action={onJoin}>
            <input type="hidden" name="code" value={code} />
            <button type="submit" className="btn primary">Unirme a la sala</button>
          </form>
        ) : (
          <div className="auth-form">
            <Link className="btn primary" href={registerHref ?? "#"}>Crear cuenta de estudiante</Link>
            <Link className="btn" href={loginHref ?? "#"}>Ya tengo cuenta</Link>
          </div>
        )}
        <Link className="auth-switch" href={`/s/${encodeURIComponent(code)}?view=1`}>Entrar como observador (solo lectura)</Link>
      </section>
    </main>
  );
}
