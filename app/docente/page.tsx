import Link from "next/link";
import { DEMO_PROJECTS } from "@/data/projects";

// v0.1: panel de ejemplo con datos de prueba.
// IMPORTANTE: todavía NO está protegido. En el Día 2 se protege con
// autenticación real y permisos verificados en el servidor.

export default function DocentePage() {
  return (
    <main className="panel-page">
      <header className="panel-header">
        <h1>Panel docente</h1>
        <Link href="/observador" className="btn">
          Ver el campus →
        </Link>
      </header>

      <p className="notice">
        ⚠️ Versión de prueba: esta página aún no tiene protección y muestra datos ficticios. La
        autenticación llega en el Día 2.
      </p>

      <section className="stats">
        <div className="stat">
          <strong>{DEMO_PROJECTS.length}</strong>
          <span>Proyectos</span>
        </div>
        <div className="stat">
          <strong>{new Set(DEMO_PROJECTS.map((p) => p.author)).size}</strong>
          <span>Estudiantes</span>
        </div>
        <div className="stat">
          <strong>0</strong>
          <span>Likes (aún sin base de datos)</span>
        </div>
      </section>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Stand</th>
              <th>Proyecto</th>
              <th>Autor</th>
              <th>Enlace</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_PROJECTS.map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td>{p.title}</td>
                <td>{p.author}</td>
                <td>
                  <a href={p.url} target="_blank" rel="noopener noreferrer">
                    Abrir ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
