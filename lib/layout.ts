// Distribución de las vitrinas: dos por tramo, a ambos lados del pasillo central.

export const STAND_COLS = 2;
export const STAND_SPACING_X = 11;
export const STAND_SPACING_Z = 8;
export const STAND_START_Z = -8;

// Colisiones sencillas: todo son círculos en el plano (x, z).
export const STAND_RADIUS = 2.2;
export const PLAYER_RADIUS = 0.5;
export const MONUMENT = { x: 0, z: 18, radius: 1.4 };

// A qué distancia del stand aparece el aviso "Ver proyecto".
export const INTERACT_DISTANCE = 4.6;

export function standPosition(index: number): {
  position: [number, number, number];
  rotation: number;
} {
  const row = Math.floor(index / STAND_COLS);
  const col = index % STAND_COLS;
  const x = col === 0 ? -STAND_SPACING_X / 2 : STAND_SPACING_X / 2;
  const z = STAND_START_Z - row * STAND_SPACING_Z;
  return {
    position: [x, 0, z],
    rotation: col === 0 ? Math.PI / 2 : -Math.PI / 2,
  };
}

export function galleryBounds(count: number) {
  const rows = Math.max(1, Math.ceil(count / STAND_COLS));
  const backZ = STAND_START_Z - (rows - 1) * STAND_SPACING_Z - 6;

  return {
    halfWidth: 13,
    frontZ: 11,
    backZ,
    length: 11 - backZ,
    centerZ: (11 + backZ) / 2,
  };
}

// Límites por donde puede caminar el avatar.
export function worldBounds(count: number) {
  const gallery = galleryBounds(count);
  return {
    minX: -gallery.halfWidth + 0.9,
    maxX: gallery.halfWidth - 0.9,
    minZ: gallery.backZ + 0.9,
    maxZ: 18,
  };
}
