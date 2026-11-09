"use client";

import dynamic from "next/dynamic";

// Three.js necesita el navegador (WebGL), así que el campus se carga solo en el
// cliente (ssr: false). Mientras tanto mostramos un mensaje de carga.
const CampusApp = dynamic(() => import("@/components/CampusApp"), {
  ssr: false,
  loading: () => <div className="loading">Cargando campus…</div>,
});

export default CampusApp;
