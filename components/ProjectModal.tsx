"use client";

import type { Project } from "@/data/projects";
import type { Role } from "@/lib/roles";
import { CAN_LIKE } from "@/lib/roles";

type Props = {
  project: Project;
  role: Role;
  likes: number;
  hasLiked: boolean;
  onLike: () => void;
  onClose: () => void;
};

// Solo permitimos enlaces http/https. Cuando los proyectos vengan de la base
// de datos, esto evita enlaces tipo "javascript:..." maliciosos.
function safeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export default function ProjectModal({ project, role, likes, hasLiked, onLike, onClose }: Props) {
  const href = safeUrl(project.url);
  const canLike = CAN_LIKE[role];

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-cover"
          role="img"
          aria-label={`Portada de ${project.title}`}
          style={
            project.coverUrl
              ? { backgroundImage: `url(${project.coverUrl})` }
              : { background: `linear-gradient(135deg, ${project.color}, #0a1426)` }
          }
        >
          <span className="cover-index">ARCHIVO DE MEMORIAS</span>
          <strong>{project.title}</strong>
          <span>{project.category}</span>
        </div>
        <div className="modal-body">
          <span className="memory-category">{project.category}</span>
          <h2>{project.title}</h2>
          <p className="muted">Por {project.author}</p>
          <p className="memory-intro">{project.memory}</p>
          <p>{project.description}</p>

          <dl className="memory-details">
            <div>
              <dt>El reto</dt>
              <dd>{project.challenge}</dd>
            </div>
            <div>
              <dt>Lo que dejó</dt>
              <dd>{project.learning}</dd>
            </div>
          </dl>

          <div className="modal-actions">
            {href ? (
              <a className="btn primary" href={href} target="_blank" rel="noopener noreferrer">
                Abrir proyecto ↗
              </a>
            ) : (
              <span className="muted">Este proyecto no tiene un enlace válido.</span>
            )}

            {canLike ? (
              <button className="btn" onClick={onLike} disabled={hasLiked}>
                {hasLiked ? "♥ Ya diste like" : "♡ Me gusta"} · {likes}
              </button>
            ) : (
              <span className="muted">♥ {likes} · solo lectura</span>
            )}

            <button className="btn ghost" onClick={onClose}>
              Cerrar (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
