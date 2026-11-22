// Fotos reales de bolsas (sin impresión) para el simulador.
// rect = zona imprimible dentro de la foto, en píxeles de la imagen original.
export type PhotoMockup = {
  src: string;
  w: number;
  h: number;
  rect: [number, number, number, number];
  /** cuánto "toma" la tinta (cristal deja ver un poco el fondo) */
  inkOpacity: number;
};

// Vacío hasta tener mockups propios (renders 3D o fotos de bolsas lisas propias).
// Formato de cada entrada: "modelo-color": { src, w, h, rect: [x, y, ancho, alto], inkOpacity }
export const photoMockups: Record<string, PhotoMockup> = {};

export const photoFor = (model: string, color: string) => photoMockups[`${model}-${color}`] ?? null;
