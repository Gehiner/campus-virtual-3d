import Link from "next/link";
import { redirect } from "next/navigation";
import {
  assignRoomTeacher,
  assignUserRole,
  createRoom,
  setRoomActive,
  updateProfileName,
} from "@/app/actions/administration";
import CopyRoomLink from "@/components/CopyRoomLink";
import ConfirmActionForm from "@/components/ConfirmActionForm";
import { getProfile } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

type Props = { searchParams: Promise<{ error?: string; created?: string; updated?: string; deactivated?: string; activated?: string }> };

export default async function AdminPage({ searchParams }: Props) {
  const query = await searchParams;
  if (!getSupabaseConfig()) {
    return <main className="panel-page"><h1>Configura Supabase antes de administrar el campus.</h1></main>;
  }
  const current = await getProfile();
  if (!current) redirect("/auth");
  if (current.profile.role !== "admin") redirect("/");

  const supabase = await createClient();
  const [{ data: profiles, error: profilesError }, { data: activities, error: activitiesError }] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, role").order("created_at"),
    supabase.from("activities").select("id, title, share_code, teacher_id, is_active").order("created_at", { ascending: false }),
  ]);
  if (profilesError) throw new Error(`No se pudieron cargar los perfiles: ${profilesError.message}`);
  if (activitiesError) throw new Error(`No se pudieron cargar las salas: ${activitiesError.message}`);

  const teacherOptions = profiles?.filter((profile) => profile.role === "teacher") ?? [];
  return (
    <main className="panel-page">
      <header className="panel-header">
        <div><h1>Administración del campus</h1><p className="muted">Crea salas y asigna docentes.</p></div>
        <form action="/auth/signout" method="post"><button className="btn ghost" type="submit">Cerrar sesión</button></form>
      </header>
      {query.error && <p className="auth-message" role="alert">{query.error}</p>}
      {query.created && <p className="success-message">Sala creada: <CopyRoomLink code={query.created} /></p>}
      {query.updated && <p className="success-message">Rol actualizado.</p>}
      {query.deactivated && <p className="success-message">Sala desactivada. Sus datos se conservaron.</p>}
      {query.activated && <p className="success-message">Sala reactivada.</p>}

      <section className="admin-section">
        <h2>Crear sala</h2>
        <p className="muted">Cada sala tiene un enlace compartible y ocho stands iniciales.</p>
        <form className="project-form" action={createRoom}>
          <label>Nombre de la sala<input name="title" minLength={2} maxLength={120} required /></label>
          <label>Docente asignado
            <select className="form-control" name="teacherId" defaultValue="">
              <option value="">Asignar después</option>
              {teacherOptions.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name} · {teacher.email}</option>)}
            </select>
          </label>
          <button className="btn primary" type="submit">Crear sala</button>
        </form>
      </section>

      <section className="admin-section">
        <h2>Salas</h2>
        {activities?.length ? activities.map((activity) => {
          const teacher = profiles?.find((profile) => profile.id === activity.teacher_id);
          return (
            <article className="room-card" key={activity.id}>
              <div><h3>{activity.title} {!activity.is_active && <span className="badge">Inactiva</span>}</h3><p className="muted">Docente: {teacher?.full_name ?? "Sin asignar"} · Código: {activity.share_code}</p></div>
              {activity.is_active && <Link className="btn" href={`/s/${encodeURIComponent(activity.share_code)}`}>Abrir sala</Link>}
              <CopyRoomLink code={activity.share_code} />
              <ConfirmActionForm
                action={setRoomActive}
                className="inline-form"
                message={activity.is_active
                  ? `¿Desactivar "${activity.title}"? Los estudiantes ya no podrán entrar, pero se conservarán sus proyectos y datos.`
                  : `¿Reactivar "${activity.title}"? Los estudiantes volverán a poder entrar.`}
              >
                <input type="hidden" name="activityId" value={activity.id} />
                <input type="hidden" name="isActive" value={String(!activity.is_active)} />
                <button className="btn small" type="submit">{activity.is_active ? "Desactivar sala" : "Reactivar sala"}</button>
              </ConfirmActionForm>
              <form action={assignRoomTeacher} className="inline-form">
                <input type="hidden" name="activityId" value={activity.id} />
                <select className="form-control" name="teacherId" defaultValue={activity.teacher_id ?? ""}>
                  <option value="">Sin asignar</option>
                  {teacherOptions.map((option) => <option key={option.id} value={option.id}>{option.full_name}</option>)}
                </select>
                <button className="btn small" type="submit">Asignar</button>
              </form>
            </article>
          );
        }) : <p className="notice">Todavía no hay salas. Crea la primera para empezar.</p>}
      </section>

      <section className="admin-section">
        <h2>Usuarios y roles</h2>
        <p className="muted">Los estudiantes se registran desde el enlace de la sala. Asigna aquí el rol docente.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acción</th></tr></thead>
            <tbody>
              {profiles?.map((profile) => (
                <tr key={profile.id}>
                  <td>
                    <form action={updateProfileName} className="inline-form">
                      <input type="hidden" name="userId" value={profile.id} />
                      <input className="form-control" name="fullName" defaultValue={profile.full_name} minLength={2} maxLength={120} required />
                      <button className="btn small" type="submit">Guardar nombre</button>
                    </form>
                  </td><td>{profile.email}</td><td>{profile.role}</td>
                  <td>
                    {profile.role === "admin" ? "Administrador" : (
                      <form action={assignUserRole} className="inline-form">
                        <input type="hidden" name="userId" value={profile.id} />
                        <select className="form-control" name="role" defaultValue={profile.role}>
                          <option value="student">Estudiante</option><option value="teacher">Docente</option>
                        </select>
                        <button className="btn small" type="submit">Guardar</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
