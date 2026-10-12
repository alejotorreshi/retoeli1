import { armarPaquete } from "../application/armar-paquete.ts";
import { generarFormulario } from "../application/generar-formulario.ts";
import { leerSolicitud } from "../application/leer-solicitud.ts";
import { mapearCamposCaso } from "../application/mapear-campos.ts";
import { simularEnvio } from "../application/simular-envio.ts";
import {
  argsArmarPaquete,
  argsGenerarFormulario,
  argsLeerSolicitud,
  argsMapearCampos,
  argsSimularEnvio,
} from "./argumentos.ts";
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

  const generar_formulario = defineTool(
    {
      nombre: "generar_formulario",
      description:
        "Genera el formulario del caso en el formato pedido releyendo cada valor del maestro, y su mapeo lleva solo las etiquetas, estados y rutas que devolvió proveedor_mapear_campos.",
      args: argsGenerarFormulario,
      ejecutar: generarFormulario,
      presentar: ({ ruta, formato, aviso }) =>
        aviso === null ? { ruta, formato } : { ruta, formato, aviso },
      resumir: ({ caso, formato, conteo, aviso }) => {
        const cuenta = `(${conteo.lleno} llenos, ${conteo.faltante} faltantes, ${conteo.requiere_confirmacion} por confirmar)`;
        return aviso === null
          ? `${caso}: formulario ${formato} generado ${cuenta}`
          : `${caso}: valores para ${formato} generados, ${aviso} ${cuenta}`;
      },
    },
    opciones,
  );

  const armar_paquete = defineTool(
    {
      nombre: "armar_paquete",
      description:
        "Arma el paquete para firma de un caso ya generado con el formulario, las copias de los soportes exigidos y el checklist, e indica si queda listo para firma y por qué.",
      args: argsArmarPaquete,
      ejecutar: armarPaquete,
      presentar: ({ ruta, listo_para_firma, bloqueos, checklist, archivos }) => ({
        ruta,
        listo_para_firma,
        bloqueos,
        checklist,
        archivos,
      }),
      resumir: ({ caso, listo_para_firma, bloqueos }) =>
        listo_para_firma ? `${caso}: LISTO` : `${caso}: BLOQUEADO (${bloqueos.join("; ")})`,
    },
    opciones,
  );

  const simular_envio = defineTool(
    {
      nombre: "simular_envio",
      description:
        "Registra un envío simulado del paquete armado de un caso escribiendo solo ENVIO-SIMULADO.md con los bloqueos vigentes, sin enviar ningún correo real, y exige la confirmación explícita de la analista.",
      args: argsSimularEnvio,
      ejecutar: simularEnvio,
      presentar: ({ ruta, bloqueos }) => ({ ruta, bloqueos }),
      resumir: ({ caso, bloqueos }) =>
        bloqueos.length === 0
          ? `${caso}: envío simulado registrado sin bloqueos`
          : `${caso}: envío simulado registrado con bloqueos (${bloqueos.join("; ")})`,
    },
    opciones,
  );

  return { leer_solicitud, mapear_campos, generar_formulario, armar_paquete, simular_envio };
}
