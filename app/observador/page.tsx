import Link from "next/link";

export default async function ObservadorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link href="/" className="auth-back">← Campus Virtual 3D</Link>
        <h1>Entrar como observador</h1>
        <p>Escribe el código de la sala para recorrer los proyectos en modo de solo lectura.</p>
        {query.error && <p className="auth-message" role="alert">El código de sala no es válido.</p>}
        <form className="auth-form" action="/observador/entrar">
          <label>
            Código de sala
            <input className="form-control" name="code" pattern="[a-zA-Z0-9-]{6,32}" minLength={6} maxLength={32} required />
          </label>
          <button type="submit" className="btn primary">Ver sala</button>
        </form>
      </section>
    </main>
  );
}
