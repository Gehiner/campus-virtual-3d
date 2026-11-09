"use client";

import type { Project } from "@/data/projects";
import { galleryBounds, standPosition } from "@/lib/layout";

type Props = {
  projects: Project[];
  playerPosition: [number, number];
  nearbyId: string | null;
  visitedIds: Set<string>;
};

export default function GalleryMap({ projects, playerPosition, nearbyId, visitedIds }: Props) {
  const bounds = galleryBounds(projects.length);
  const playerX = 80 + (playerPosition[0] / bounds.halfWidth) * 55;
  const playerY = 16 + ((playerPosition[1] - bounds.backZ) / bounds.length) * 76;

  return (
    <svg
      className="gallery-map"
      viewBox="0 0 160 110"
      role="img"
      aria-label={`Mapa de la galería. Has explorado ${visitedIds.size} de ${projects.length} vitrinas.`}
    >
      <rect x="14" y="9" width="132" height="92" rx="8" className="map-room" />
      <path d="M80 100v-8" className="map-entry" />
      <path d="M80 17v76" className="map-route" />
      <text x="80" y="106" textAnchor="middle" className="map-label">
        PLAZA
      </text>

      {projects.map((project, index) => {
        const { position } = standPosition(index);
        const x = 80 + (position[0] / bounds.halfWidth) * 55;
        const y = 16 + ((position[2] - bounds.backZ) / bounds.length) * 76;
        const visited = visitedIds.has(project.id);
        const nearby = nearbyId === project.id;

        return (
          <g key={project.id}>
            <circle
              cx={x}
              cy={y}
              r={nearby ? 4.2 : 3.2}
              fill={visited ? "#3ddc97" : project.color}
              className={nearby ? "map-stand nearby" : "map-stand"}
            >
              <title>
                {project.title}
                {visited ? " · explorado" : ""}
              </title>
            </circle>
          </g>
        );
      })}
      <circle
        cx={Math.max(19, Math.min(141, playerX))}
        cy={Math.max(14, Math.min(96, playerY))}
        r="3.5"
        className="map-player"
      >
        <title>Tu posición</title>
      </circle>
    </svg>
  );
}
