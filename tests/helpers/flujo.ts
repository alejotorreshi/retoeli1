import type { ContextoHerramienta } from "../../src/tools/define-tool.ts";
import type { crearHerramientas } from "../../src/tools/fabrica.ts";

export type Herramientas = Pick<ReturnType<typeof crearHerramientas>, "mapear_campos" | "generar_formulario">;

export type ItemProyectado = {
  readonly etiqueta: string;
  readonly estado: string;
  readonly ruta: string | null;
};

type ItemRespuesta = { readonly etiqueta: string; readonly estado: string; readonly ruta: string | null };

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

export function proyectarMapeo(respuesta: RespuestaMapear): ItemProyectado[] {
  if (respuesta.ok !== true || respuesta.data === undefined) throw new Error("mapear_campos falló");
  const { llenos, faltantes, requiere_confirmacion } = respuesta.data;
  return [...llenos, ...faltantes, ...requiere_confirmacion].map(({ etiqueta, estado, ruta }) => ({
    etiqueta,
    estado,
    ruta,
  }));
}

export async function mapearProyectado(
  herramientas: Herramientas,
  ctx: ContextoHerramienta,
  caso: string,
): Promise<ItemProyectado[]> {
  const crudo = await herramientas.mapear_campos.execute({ caso, campos: [] }, ctx);
  return proyectarMapeo(JSON.parse(crudo));
}

export async function generarCaso(
  herramientas: Herramientas,
  ctx: ContextoHerramienta,
  caso: string,
): Promise<Flujo> {
  const mapeo = await mapearProyectado(herramientas, ctx, caso);
  const crudo = await herramientas.generar_formulario.execute({ caso, mapeo }, ctx);
  return { mapeo, crudo, respuesta: JSON.parse(crudo) };
}
