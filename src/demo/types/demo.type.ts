export type OpcionesDemo = {
  readonly directorio: string;
  escribir(linea: string): void;
  observar?(herramienta: string, respuesta: string): void;
};

export type ResultadoDemo = { readonly fallido: boolean };
