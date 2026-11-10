import Link from "next/link";

export default function Home() {
  return (
    <main className="landing">
      <h1>Campus Virtual 3D</h1>
      <p>
        Entra al campus, recorre los stands y descubre los proyectos de tus compañeros. Elige cómo
        quieres entrar:
      </p>

      <nav className="cards">
        <Link href="/estudiante" className="card">
          <h2>Estudiante</h2>
          <p>Regístrate o inicia sesión para entrar a la sala de tu docente y publicar tu proyecto.</p>
        </Link>
        <Link href="/observador" className="card">
          <h2>Observador</h2>
          <p>Visita el campus y consulta los proyectos (solo lectura).</p>
        </Link>
        <Link href="/docente" className="card">
          <h2>Docente</h2>
          <p>Panel para revisar proyectos y participación.</p>
        </Link>
      </nav>
    </main>
  );
}
