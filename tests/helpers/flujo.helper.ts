import type {
  Flujo,
  Herramientas,
  ItemProyectado,
  RespuestaMapear,
} from "@tests/helpers/types/flujo.type.ts";
import type { ContextoHerramienta } from "@/tools/types/herramienta.type.ts";

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
