import { leerSolicitud } from "../application/leer-solicitud.ts";
import { mapearCamposCaso } from "../application/mapear-campos.ts";
import { argsLeerSolicitud, argsMapearCampos } from "./argumentos.ts";
import { defineTool } from "./define-tool.ts";
import type { OpcionesEntorno } from "./wiring.ts";

export type OpcionesHerramientas = OpcionesEntorno;

export function crearHerramientas(opciones: OpcionesHerramientas = {}) {
  const leer_solicitud = defineTool(
    {
      nombre: "leer_solicitud",
      description:
        "Lee la solicitud de un caso y devuelve país, cliente, formato pedido, plantilla, campos en el orden de la plantilla y soportes exigidos.",
      args: argsLeerSolicitud,
      ejecutar: leerSolicitud,
      presentar: (datos) => datos,
      resumir: (datos) =>
        `${datos.caso}: ${datos.formato}, ${datos.pais}, ${datos.campos.length} campos, ${datos.soportes.length} soportes exigidos`,
    },
    opciones,
  );

  const mapear_campos = defineTool(
    {
      nombre: "mapear_campos",
      description:
        "Mapea las etiquetas de la plantilla de un caso contra el maestro y devuelve cada campo con su estado, ruta, regla, confianza y valor enmascarado.",
      args: argsMapearCampos,
      ejecutar: mapearCamposCaso,
      presentar: (datos) => datos,
      resumir: ({ caso, conteo }) =>
        `${caso}: ${conteo.lleno} llenos, ${conteo.faltante} faltantes, ${conteo.requiere_confirmacion} por confirmar`,
    },
    opciones,
  );

  return { leer_solicitud, mapear_campos };
}
