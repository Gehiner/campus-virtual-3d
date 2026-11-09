// Estado de los controles. Se guarda en un "ref" (no en state) porque cambia
// muchas veces por segundo y no queremos volver a renderizar React cada vez.
// kx/kz = teclado, tx/tz = botones táctiles. Valores entre -1 y 1.

export type InputState = {
  kx: number;
  kz: number;
  tx: number;
  tz: number;
};

export const emptyInput = (): InputState => ({ kx: 0, kz: 0, tx: 0, tz: 0 });
