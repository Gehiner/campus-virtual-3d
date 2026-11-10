import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import { getSupabaseConfigIssue } from "@/lib/supabase/config";

type Props = {
  searchParams: Promise<{ mode?: string; room?: string; error?: string }>;
};

export default async function AuthPage({ searchParams }: Props) {
  const params = await searchParams;
  const mode = params.mode === "register" || params.mode === "recover" || params.mode === "reset"
    ? params.mode
    : "login";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="auth-back">← Campus Virtual 3D</Link>
        <h1>
          {mode === "register" ? "Crear cuenta de estudiante"
            : mode === "recover" ? "Recuperar contraseña"
              : mode === "reset" ? "Crear nueva contraseña"
                : "Iniciar sesión"}
        </h1>
        <p>
          {mode === "register"
            ? "Regístrate con tu nombre, correo y contraseña para publicar tu proyecto."
            : mode === "recover"
              ? "Te enviaremos un enlace para crear una contraseña nueva."
              : mode === "reset"
                ? "Elige una contraseña segura para volver a entrar."
                : "Ingresa para volver a tus salas y proyectos."}
        </p>
        {params.room && <p className="auth-room">Te unirás a la sala al confirmar tu cuenta.</p>}
        {getSupabaseConfigIssue() ? (
          <div className="notice">
            {getSupabaseConfigIssue() === "unsafe-key"
              ? "La clave configurada es secreta o no es una clave pública válida. Usa la clave Publishable (sb_publishable_…) o la anon pública antigua. Nunca uses sb_secret_ ni service_role en el navegador."
              : <>Supabase aún no está configurado. Copia <code>.env.example</code> a <code>.env.local</code>, completa la URL y la clave pública de tu proyecto, y reinicia el servidor.</>}
          </div>
        ) : (
          <AuthForm mode={mode} room={params.room ?? ""} errorMessage={params.error} />
        )}
        {mode === "login" && <div className="auth-switch"><Link href="/auth?mode=recover">Olvidé mi contraseña</Link></div>}
        {(mode === "login" || mode === "register") && (
          <div className="auth-switch">
            {mode === "register" ? (
              <>¿Ya tienes cuenta? <Link href={`/auth?mode=login${params.room ? `&room=${encodeURIComponent(params.room)}` : ""}`}>Inicia sesión</Link></>
            ) : (
              <>¿Primera vez? <Link href={`/auth?mode=register${params.room ? `&room=${encodeURIComponent(params.room)}` : ""}`}>Crea tu cuenta</Link></>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
