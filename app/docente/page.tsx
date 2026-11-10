import Link from "next/link";
import { redirect } from "next/navigation";
import {
  answerQuestion,
  moderateProject,
  removeStudentFromRoom,
} from "@/app/actions/administration";
import CopyRoomLink from "@/components/CopyRoomLink";
import ConfirmActionForm from "@/components/ConfirmActionForm";
import { getProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

type Props = {
  searchParams: Promise<{ room?: string; removed?: string; moderated?: string; answered?: string; error?: string }>;
};

export default async function DocentePage({ searchParams }: Props) {
  const query = await searchParams;
  if (!getSupabaseConfig()) {
    return <main className="panel-page"><h1>Configura Supabase para abrir el panel docente.</h1></main>;
  }
  const current = await getProfile();
  if (!current) redirect("/auth?mode=login");
  if (current.profile.role === "admin") redirect("/admin");
  if (current.profile.role !== "teacher") redirect("/");

  const supabase = await createClient();
  const { data: rooms, error: roomsError } = await supabase
    .from("activities")
    .select("id, title, share_code, is_active")
    .eq("teacher_id", current.user.id)
    .order("created_at", { ascending: false });
  if (roomsError) throw new Error(`No se pudieron cargar tus salas: ${roomsError.message}`);

  const selectedRoom = rooms?.find((room) => room.share_code === query.room) ?? rooms?.[0];
  if (!selectedRoom) {
    return (
      <main className="panel-page">
        <header className="panel-header"><h1>Panel docente</h1><form action="/auth/signout" method="post"><button className="btn ghost">Cerrar sesión</button></form></header>
        <p className="notice">Aún no tienes salas asignadas. Pide al administrador que te asigne una.</p>
      </main>
    );
  }

  const { data: participants, error: participantsError } = await supabase
    .from("activity_participants")
    .select("student_id, is_active, joined_at")
    .eq("activity_id", selectedRoom.id)
    .order("joined_at");
  if (participantsError) throw new Error(`No se pudo cargar la lista de estudiantes: ${participantsError.message}`);
  const participantIds = (participants ?? []).map((participant) => participant.student_id);
  const [{ data: students, error: studentsError }, { data: projects, error: projectsError }] = await Promise.all([
    participantIds.length
      ? supabase.from("profiles").select("id, full_name, email").in("id", participantIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("projects").select("id, title, status, student_id, stand_id").eq("activity_id", selectedRoom.id).order("created_at"),
  ]);
  if (studentsError) throw new Error(`No se pudo cargar los perfiles de estudiantes: ${studentsError.message}`);
  if (projectsError) throw new Error(`No se pudieron cargar los proyectos: ${projectsError.message}`);

  const projectIds = (projects ?? []).map((project) => project.id);
  const [{ data: likes, error: likesError }, { data: questions, error: questionsError }] = await Promise.all([
    projectIds.length
      ? supabase.from("project_likes").select("project_id, user_id, created_at").in("project_id", projectIds)
      : Promise.resolve({ data: [], error: null }),
    projectIds.length
      ? supabase.from("project_questions").select("id, project_id, author_id, content, created_at").in("project_id", projectIds).order("created_at")
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (likesError) throw new Error(`No se pudieron consultar los likes: ${likesError.message}`);
  if (questionsError) throw new Error(`No se pudieron consultar las preguntas: ${questionsError.message}`);
  const questionIds = (questions ?? []).map((question) => question.id);
  const { data: answers, error: answersError } = questionIds.length
    ? await supabase.from("project_answers").select("id, question_id, author_id, content, created_at").in("question_id", questionIds).order("created_at")
    : { data: [], error: null };
  if (answersError) throw new Error(`No se pudieron consultar las respuestas: ${answersError.message}`);
  const { data: teachersProfile, error: ownProfileError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", current.user.id)
    .single();
  if (ownProfileError) throw new Error(`No se pudo cargar el perfil docente: ${ownProfileError.message}`);

  const studentById = new Map((students ?? []).map((student) => [student.id, student]));
  const activeParticipants = (participants ?? []).filter((participant) => participant.is_active);

  return (
    <main className="panel-page">
      <header className="panel-header">
        <div><h1>Panel docente</h1><p className="muted">Hola, {teachersProfile.full_name}</p></div>
        <form action="/auth/signout" method="post"><button className="btn ghost" type="submit">Cerrar sesión</button></form>
      </header>
      {query.error && <p className="auth-message" role="alert">{query.error}</p>}
      {query.removed && <p className="success-message">Estudiante retirado; se eliminaron su proyecto y sus interacciones de esta sala. Su cuenta se conserva.</p>}
      {query.moderated && <p className="success-message">Visibilidad del proyecto actualizada.</p>}
      {query.answered && <p className="success-message">Respuesta publicada.</p>}
      <section className="room-list">
        <h2>Mis salas</h2>
        {rooms?.map((room) => (
          <article className="room-card" key={room.id}>
            <div><h3>{room.title}</h3><p className="muted">Código: {room.share_code}</p></div>
            <Link className="btn" href={`/docente?room=${encodeURIComponent(room.share_code)}`}>Administrar</Link>
            <Link className="btn" href={`/s/${encodeURIComponent(room.share_code)}`}>Vista docente</Link>
            <CopyRoomLink code={room.share_code} />
          </article>
        ))}
      </section>

      <section className="admin-section">
        <h2>{selectedRoom.title}</h2>
        <div className="stats">
          <div className="stat"><strong>{activeParticipants.length}</strong><span>Estudiantes activos</span></div>
          <div className="stat"><strong>{projects?.filter((project) => project.status === "published").length ?? 0}</strong><span>Proyectos publicados</span></div>
          <div className="stat"><strong>{likes?.length ?? 0}</strong><span>Likes registrados</span></div>
          <div className="stat"><strong>{questions?.length ?? 0}</strong><span>Preguntas / comentarios</span></div>
        </div>
      </section>

      <section className="admin-section">
        <h2>Estudiantes</h2>
        <div className="table-wrap">
          <table><thead><tr><th>Nombre</th><th>Correo</th><th>Inscrito</th><th>Acceso</th></tr></thead>
            <tbody>{activeParticipants.map((participant) => {
              const student = studentById.get(participant.student_id);
              return (
                <tr key={participant.student_id}>
                  <td>{student?.full_name ?? "Perfil no disponible"}</td><td>{student?.email ?? "—"}</td>
                  <td>{new Date(participant.joined_at).toLocaleDateString("es")}</td>
                  <td><ConfirmActionForm action={removeStudentFromRoom} message={`¿Retirar a ${student?.full_name ?? "este estudiante"} de la sala y borrar su proyecto, likes, preguntas y respuestas de esta sala? Su cuenta seguirá activa.`}>
                    <input type="hidden" name="activityId" value={selectedRoom.id} />
                    <input type="hidden" name="studentId" value={participant.student_id} />
                    <input type="hidden" name="code" value={selectedRoom.share_code} />
                    <button className="btn small" type="submit">Retirar y borrar datos de la sala</button>
                  </ConfirmActionForm></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2>Proyectos e interacciones</h2>
        <div className="teacher-projects">
          {(projects ?? []).map((project) => {
            const student = studentById.get(project.student_id);
            const projectLikes = (likes ?? []).filter((like) => like.project_id === project.id);
            const projectQuestions = (questions ?? []).filter((question) => question.project_id === project.id);
            return (
              <article className="teacher-project" key={project.id}>
                <header className="panel-header">
                  <div><h3>{project.title}</h3><p className="muted">{student?.full_name ?? "Estudiante"} · {student?.email ?? ""} · {project.status}</p></div>
                  <form action={moderateProject}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="code" value={selectedRoom.share_code} />
                    <input type="hidden" name="status" value={project.status === "hidden" ? "published" : "hidden"} />
                    <button className="btn small" type="submit">{project.status === "hidden" ? "Volver a publicar" : "Ocultar proyecto"}</button>
                  </form>
                </header>
                <p><strong>{projectLikes.length} likes:</strong> {projectLikes.length
                  ? projectLikes.map((like) => studentById.get(like.user_id)?.full_name ?? "Estudiante").join(", ")
                  : "Aún no tiene likes."}</p>
                <div className="question-list">
                  <strong>Preguntas y comentarios</strong>
                  {projectQuestions.length ? projectQuestions.map((question) => {
                    const author = studentById.get(question.author_id);
                    const questionAnswers = (answers ?? []).filter((answer) => answer.question_id === question.id);
                    return (
                      <div className="question-card" key={question.id}>
                        <p><strong>{author?.full_name ?? "Estudiante"}:</strong> {question.content}</p>
                        {questionAnswers.map((answer) => (
                          <p className="answer-item" key={answer.id}><strong>{answer.author_id === current.user.id ? "Tú" : studentById.get(answer.author_id)?.full_name ?? "Docente"}:</strong> {answer.content}</p>
                        ))}
                        {!questionAnswers.some((answer) => answer.author_id === current.user.id) && (
                          <form action={answerQuestion} className="inline-form">
                            <input type="hidden" name="questionId" value={question.id} />
                            <input type="hidden" name="code" value={selectedRoom.share_code} />
                            <input className="form-control" name="content" minLength={2} maxLength={2000} placeholder="Responder…" required />
                            <button className="btn small" type="submit">Responder</button>
                          </form>
                        )}
                      </div>
                    );
                  }) : <p className="muted">Sin preguntas todavía.</p>}
                </div>
              </article>
            );
          })}
          {!projects?.length && <p className="notice">Aún no hay proyectos en esta sala.</p>}
        </div>
      </section>
    </main>
  );
}
