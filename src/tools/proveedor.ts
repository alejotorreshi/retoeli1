import { leerSolicitud } from "../application/leer-solicitud.ts";
import { argsLeerSolicitud } from "./argumentos.ts";
import { defineTool } from "./define-tool.ts";

export const leer_solicitud = defineTool({
  nombre: "leer_solicitud",
  description:
    "Lee la solicitud de un caso y devuelve país, cliente, formato pedido, plantilla, campos en el orden de la plantilla y soportes exigidos.",
  args: argsLeerSolicitud,
  ejecutar: leerSolicitud,
  presentar: (datos) => datos,
  resumir: (datos) =>
    `${datos.caso}: ${datos.formato}, ${datos.pais}, ${datos.campos.length} campos, ${datos.soportes.length} soportes exigidos`,
});
