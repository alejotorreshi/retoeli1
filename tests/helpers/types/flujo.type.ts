import type { crearHerramientas } from "@/tools/fabrica.ts";

export type Herramientas = Pick<ReturnType<typeof crearHerramientas>, "mapear_campos" | "generar_formulario">;

export type ItemProyectado = {
  readonly etiqueta: string;
  readonly estado: string;
  readonly ruta: string | null;
};

export type ItemRespuesta = {
  readonly etiqueta: string;
  readonly estado: string;
  readonly ruta: string | null;
};

export type RespuestaMapear = {
  readonly ok: boolean;
  readonly data?: {
    readonly llenos: readonly ItemRespuesta[];
    readonly faltantes: readonly ItemRespuesta[];
    readonly requiere_confirmacion: readonly ItemRespuesta[];
  };
};

export type RespuestaGenerar = {
  readonly ok: boolean;
  readonly data?: { readonly ruta: string; readonly formato: string; readonly aviso?: string };
  readonly error?: string;
  readonly codigo?: string;
  readonly parcial?: { readonly diferencias?: readonly string[] };
  readonly resumen?: string;
};

export type Flujo = {
  readonly mapeo: readonly ItemProyectado[];
  readonly crudo: string;
  readonly respuesta: RespuestaGenerar;
};
