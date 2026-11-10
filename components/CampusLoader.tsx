"use client";

import dynamic from "next/dynamic";
import type { Project } from "@/data/projects";
import type { Role } from "@/lib/roles";

// Three.js necesita el navegador (WebGL), así que el campus se carga solo en el
// cliente (ssr: false). Mientras tanto mostramos un mensaje de carga.
const CampusApp = dynamic(() => import("@/components/CampusApp"), {
  ssr: false,
  loading: () => <div className="loading">Cargando campus…</div>,
});

export default function CampusLoader({
  role,
  projects,
  activityCode,
}: {
  role: Role;
  projects?: Project[];
  activityCode?: string;
}) {
  return <CampusApp role={role} projects={projects} activityCode={activityCode} />;
}
