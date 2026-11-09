// Los tres tipos de acceso del campus.
// OJO: en esta versión (v0.1) el rol viene de la URL. Eso NO es seguridad.
// En el Día 2 los permisos reales se verificarán en el servidor (Supabase + RLS).

export type Role = "estudiante" | "observador" | "docente";

export const ROLE_LABEL: Record<Role, string> = {
  estudiante: "Estudiante",
  observador: "Observador",
  docente: "Docente",
};

// Qué puede hacer cada rol dentro del campus.
export const CAN_LIKE: Record<Role, boolean> = {
  estudiante: true,
  observador: false,
  docente: false,
};
