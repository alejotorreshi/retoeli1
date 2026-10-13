import { armarPaquete } from "@/application/use-cases/armar-paquete.use-case.ts";
import { generarFormulario } from "@/application/use-cases/generar-formulario.use-case.ts";
import { leerSolicitud } from "@/application/use-cases/leer-solicitud.use-case.ts";
import { mapearCampos } from "@/application/use-cases/mapear-campos.use-case.ts";
import { simularEnvio } from "@/application/use-cases/simular-envio.use-case.ts";
import { HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import { DESCRIPCION_HERRAMIENTA, RESUMEN_HERRAMIENTA } from "@/config/strings.ts";
import { definirHerramienta } from "@/tools/definir-herramienta.factory.ts";
import {
  argsArmarPaquete,
  argsGenerarFormulario,
  argsLeerSolicitud,
  argsMapearCampos,
  argsSimularEnvio,
} from "@/tools/schemas/argumentos.schema.ts";
import type { OpcionesEntorno } from "@/tools/types/entorno.type.ts";

export function crearHerramientas(opciones: OpcionesEntorno = {}) {
  const leer_solicitud = definirHerramienta(
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

  const mapear_campos = definirHerramienta(
    {
      nombre: HERRAMIENTA.MAPEAR_CAMPOS,
      description: DESCRIPCION_HERRAMIENTA[HERRAMIENTA.MAPEAR_CAMPOS],
      args: argsMapearCampos,
      ejecutar: mapearCampos,
      presentar: (datos) => datos,
      resumir: ({ caso, conteo }) => RESUMEN_HERRAMIENTA.mapeo(caso, conteo),
    },
    opciones,
  );

  const generar_formulario = definirHerramienta(
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

  const armar_paquete = definirHerramienta(
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

  const simular_envio = definirHerramienta(
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
