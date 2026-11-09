"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CampusScene from "@/components/scene/CampusScene";
import GalleryMap from "@/components/GalleryMap";
import ProjectModal from "@/components/ProjectModal";
import TouchControls from "@/components/TouchControls";
import { DEMO_PROJECTS } from "@/data/projects";
import { emptyInput, type InputState } from "@/lib/input";
import { CAN_LIKE, ROLE_LABEL, type Role } from "@/lib/roles";

const AVATAR_COLORS = ["#ff4d8d", "#ffb02e", "#3ddc97", "#5aa9ff", "#a78bfa"];

const KEY_TO_DIR: Record<string, "up" | "down" | "left" | "right"> = {
  w: "up",
  arrowup: "up",
  s: "down",
  arrowdown: "down",
  a: "left",
  arrowleft: "left",
  d: "right",
  arrowright: "right",
};

export default function CampusApp({ role }: { role: Role }) {
  // En v0.1 los proyectos son de prueba. Día 2: vendrán de Supabase.
  const projects = DEMO_PROJECTS;

  const input = useRef<InputState>(emptyInput());
  const [nearbyId, setNearbyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [playerPosition, setPlayerPosition] = useState<[number, number]>([0, 9]);
  const [plazaResetKey, setPlazaResetKey] = useState(0);
  const [lookResetKey, setLookResetKey] = useState(0);

  // Likes de demostración: solo viven en memoria (se pierden al recargar).
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Set<string>>(new Set());

  // El teclado necesita saber el estado actual sin reinstalar los listeners.
  const live = useRef({ nearbyId, selectedId });
  useEffect(() => {
    live.current = { nearbyId, selectedId };
  });

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [projects, selectedId],
  );
  const nearby = useMemo(
    () => projects.find((p) => p.id === nearbyId) ?? null,
    [projects, nearbyId],
  );

  const openProject = useCallback((id: string) => {
    input.current = emptyInput(); // al abrir un proyecto, el avatar se detiene
    setVisitedIds((previous) => new Set(previous).add(id));
    setSelectedId(id);
  }, []);

  const closeProject = useCallback(() => setSelectedId(null), []);
  const returnToPlaza = useCallback(() => {
    input.current = emptyInput();
    setSelectedId(null);
    setPlazaResetKey((key) => key + 1);
    setLookResetKey((key) => key + 1);
  }, []);
  const updatePlayerPosition = useCallback((x: number, z: number) => {
    setPlayerPosition([x, z]);
  }, []);

  const nearbyIndex = nearbyId ? projects.findIndex((project) => project.id === nearbyId) : -1;

  const like = useCallback(
    (id: string) => {
      if (!CAN_LIKE[role] || liked.has(id)) return; // un like por proyecto
      setLiked((prev) => new Set(prev).add(id));
      setLikes((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    },
    [role, liked],
  );

  // Teclado: WASD / flechas para moverse, E o Enter para abrir, Esc para cerrar.
  useEffect(() => {
    const pressed = new Set<string>();

    const recompute = () => {
      const k = input.current;
      if (live.current.selectedId) {
        k.kx = 0;
        k.kz = 0;
        return;
      }
      k.kx = (pressed.has("right") ? 1 : 0) - (pressed.has("left") ? 1 : 0);
      k.kz = (pressed.has("down") ? 1 : 0) - (pressed.has("up") ? 1 : 0);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const dir = KEY_TO_DIR[key];
      if (dir) {
        e.preventDefault();
        pressed.add(dir);
        recompute();
        return;
      }
      if (key === "e" || key === "enter") {
        const { nearbyId: n, selectedId: s } = live.current;
        if (!s && n) openProject(n);
      } else if (key === "escape") {
        closeProject();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const dir = KEY_TO_DIR[e.key.toLowerCase()];
      if (dir) {
        pressed.delete(dir);
        recompute();
      }
    };

    const onBlur = () => {
      pressed.clear();
      recompute();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [openProject, closeProject]);

  return (
    <main className="stage">
      <CampusScene
        projects={projects}
        input={input}
        nearbyId={nearbyId}
        avatarColor={avatarColor}
        resetKey={plazaResetKey}
        lookResetKey={lookResetKey}
        onNearbyChange={setNearbyId}
        onPositionChange={updatePlayerPosition}
        onSelect={openProject}
      />
      <div className="first-person-reticle" aria-hidden="true" />

      {/* Barra superior */}
      <header className="hud-top">
        <div className="hud-group">
          <Link href="/" className="btn ghost small">
            ← Inicio
          </Link>
          <span className="badge">{ROLE_LABEL[role]}</span>
        </div>

        <div className="hud-group swatches" aria-label="Color del avatar">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch ${avatarColor === c ? "active" : ""}`}
              style={{ background: c }}
              aria-label={`Color ${c}`}
              onClick={() => setAvatarColor(c)}
            />
          ))}
        </div>
      </header>

      <p className="hud-help">
        Arrastra para mirar · WASD o flechas para caminar · E o clic en una vitrina para explorar
      </p>

      <aside className="route-panel" aria-label="Progreso del recorrido">
        <div className="route-heading">
          <div>
            <span className="route-eyebrow">ARCHIVO DE MEMORIAS</span>
            <strong>
              {nearby ? `Vitrina ${nearbyIndex + 1} de ${projects.length}` : "Recorrido libre"}
            </strong>
          </div>
          <span className="route-count">
            {visitedIds.size}/{projects.length}
          </span>
        </div>
        <div
          className="route-progress"
          role="progressbar"
          aria-label="Vitrinas exploradas"
          aria-valuemin={0}
          aria-valuemax={projects.length}
          aria-valuenow={visitedIds.size}
        >
          <span
            style={{
              width: `${projects.length ? (visitedIds.size / projects.length) * 100 : 0}%`,
            }}
          />
        </div>
        <GalleryMap
          projects={projects}
          playerPosition={playerPosition}
          nearbyId={nearbyId}
          visitedIds={visitedIds}
        />
        <div className="map-legend" aria-label="Leyenda del mapa">
          <span>
            <i className="legend-player" /> Tú
          </span>
          <span>
            <i className="legend-stand" /> Vitrina
          </span>
          <span>
            <i className="legend-visited" /> Visitada
          </span>
        </div>
        <p className="camera-hint">Vista en primera persona · arrastra para girar la mirada</p>
        <button type="button" className="btn ghost small plaza-button" onClick={returnToPlaza}>
          Volver a la plaza
        </button>
        <button
          type="button"
          className="btn ghost small plaza-button"
          onClick={() => setLookResetKey((key) => key + 1)}
        >
          Recentrar mirada
        </button>
      </aside>

      {/* Aviso al acercarse a una vitrina */}
      {nearby && !selected && (
        <button className="hud-prompt" onClick={() => openProject(nearby.id)}>
          Explorar «{nearby.title}» <kbd>E</kbd>
        </button>
      )}

      <TouchControls
        input={input}
        canInteract={Boolean(nearby && !selected)}
        onInteract={() => {
          if (nearby && !selected) openProject(nearby.id);
        }}
      />

      {selected && (
        <ProjectModal
          project={selected}
          role={role}
          likes={likes[selected.id] ?? 0}
          hasLiked={liked.has(selected.id)}
          onLike={() => like(selected.id)}
          onClose={closeProject}
        />
      )}
    </main>
  );
}
