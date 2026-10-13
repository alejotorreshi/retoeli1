import { armarPaquete } from "@/application/armar-paquete.ts";
import { generarFormulario } from "@/application/generar-formulario.ts";
import { leerSolicitud } from "@/application/leer-solicitud.ts";
import { mapearCamposCaso } from "@/application/mapear-campos.ts";
import { simularEnvio } from "@/application/simular-envio.ts";
import { HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import { DESCRIPCION_HERRAMIENTA, RESUMEN_HERRAMIENTA } from "@/config/strings.ts";
import {
  argsArmarPaquete,
  argsGenerarFormulario,
  argsLeerSolicitud,
  argsMapearCampos,
  argsSimularEnvio,
} from "@/tools/argumentos.ts";
import { defineTool } from "@/tools/define-tool.ts";
import type { OpcionesEntorno } from "@/tools/wiring.ts";

export type OpcionesHerramientas = OpcionesEntorno;

export function crearHerramientas(opciones: OpcionesHerramientas = {}) {
  const leer_solicitud = defineTool(
    {
      nombre: HERRAMIENTA.LEER_SOLICITUD,
      description: DESCRIPCION_HERRAMIENTA[HERRAMIENTA.LEER_SOLICITUD],
      args: argsLeerSolicitud,
      ejecutar: leerSolicitud,
      presentar: (datos) => datos,
      resumir: (datos) =>
        RESUMEN_HERRAMIENTA.solicitud(
          datos.caso,
          datos.formato,
          datos.pais,
          datos.campos.length,
          datos.soportes.length,
        ),
    },
    opciones,
  );

  const mapear_campos = defineTool(
    {
      nombre: HERRAMIENTA.MAPEAR_CAMPOS,
      description: DESCRIPCION_HERRAMIENTA[HERRAMIENTA.MAPEAR_CAMPOS],
      args: argsMapearCampos,
      ejecutar: mapearCamposCaso,
      presentar: (datos) => datos,
      resumir: ({ caso, conteo }) => RESUMEN_HERRAMIENTA.mapeo(caso, conteo),
    },
    opciones,
  );

  const generar_formulario = defineTool(
    {
      nombre: HERRAMIENTA.GENERAR_FORMULARIO,
      description: DESCRIPCION_HERRAMIENTA[HERRAMIENTA.GENERAR_FORMULARIO],
      args: argsGenerarFormulario,
      ejecutar: generarFormulario,
      presentar: ({ ruta, formato, aviso }) =>
        aviso === null ? { ruta, formato } : { ruta, formato, aviso },
      resumir: ({ caso, formato, conteo, aviso }) =>
        aviso === null
          ? RESUMEN_HERRAMIENTA.formularioGenerado(caso, formato, conteo)
          : RESUMEN_HERRAMIENTA.valoresGenerados(caso, formato, aviso, conteo),
    },
    opciones,
  );

  const armar_paquete = defineTool(
    {
      nombre: HERRAMIENTA.ARMAR_PAQUETE,
      description: DESCRIPCION_HERRAMIENTA[HERRAMIENTA.ARMAR_PAQUETE],
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
        listo_para_firma
          ? RESUMEN_HERRAMIENTA.paqueteListo(caso)
          : RESUMEN_HERRAMIENTA.paqueteBloqueado(caso, bloqueos),
    },
    opciones,
  );

  const simular_envio = defineTool(
    {
      nombre: HERRAMIENTA.SIMULAR_ENVIO,
      description: DESCRIPCION_HERRAMIENTA[HERRAMIENTA.SIMULAR_ENVIO],
      args: argsSimularEnvio,
      ejecutar: simularEnvio,
      presentar: ({ ruta, bloqueos }) => ({ ruta, bloqueos }),
      resumir: ({ caso, bloqueos }) =>
        bloqueos.length === 0
          ? RESUMEN_HERRAMIENTA.envioSinBloqueos(caso)
          : RESUMEN_HERRAMIENTA.envioConBloqueos(caso, bloqueos),
    },
    opciones,
  );

  return { leer_solicitud, mapear_campos, generar_formulario, armar_paquete, simular_envio };
}
