export type Respuesta = { readonly herramienta: string; readonly respuesta: string };

export type Corrida = {
  readonly lineas: string[];
  readonly respuestas: Respuesta[];
  readonly fallido: boolean;
};

export type OpcionesCorrida = { readonly despues?: () => Promise<void> };
