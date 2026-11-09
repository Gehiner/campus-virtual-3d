"use client";

import type { MutableRefObject } from "react";
import type { InputState } from "@/lib/input";

type PadProps = {
  label: string;
  aria: string;
  dx: number;
  dz: number;
  input: MutableRefObject<InputState>;
  className: string;
};

function Pad({ label, aria, dx, dz, input, className }: PadProps) {
  // Cada botón controla solo su eje, así se pueden combinar dos para ir en diagonal.
  const set = (on: boolean) => {
    if (dx !== 0) input.current.tx = on ? dx : 0;
    if (dz !== 0) input.current.tz = on ? dz : 0;
  };

  return (
    <button
      type="button"
      aria-label={aria}
      className={`pad ${className}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        set(true);
      }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}

// Se muestra solo en pantallas táctiles (ver globals.css).
export default function TouchControls({
  input,
  canInteract,
  onInteract,
}: {
  input: MutableRefObject<InputState>;
  canInteract: boolean;
  onInteract: () => void;
}) {
  return (
    <div className="touch-controls">
      <Pad label="▲" aria="Avanzar" dx={0} dz={-1} input={input} className="up" />
      <Pad label="◀" aria="Izquierda" dx={-1} dz={0} input={input} className="left" />
      <Pad label="▶" aria="Derecha" dx={1} dz={0} input={input} className="right" />
      <Pad label="▼" aria="Retroceder" dx={0} dz={1} input={input} className="down" />
      {canInteract && (
        <button type="button" className="pad interact-pad" onClick={onInteract}>
          Ver
        </button>
      )}
    </div>
  );
}
