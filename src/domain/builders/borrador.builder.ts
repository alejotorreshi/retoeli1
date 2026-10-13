import { FORMATO } from "@/config/constants/forms.constants.ts";
import { RUTA_MAESTRO } from "@/config/constants/maestro.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { TEXTO_BORRADOR, TEXTO_COMUN, TEXTO_SOPORTE } from "@/config/strings.ts";
import { motivosDeBloqueo } from "@/domain/builders/checklist.builder.ts";
import { seccionSi } from "@/domain/engines/motor-plantillas.engine.ts";
import { leerRuta } from "@/domain/selectors/maestro.selector.ts";
import type { DatosBorradorCorreo, DatosEnvioSimulado, RutaBorrador } from "@/domain/types/borrador.type.ts";
import type { Checklist } from "@/domain/types/checklist.type.ts";
import type { Maestro } from "@/domain/types/maestro.type.ts";
import type { Formato, Solicitud } from "@/domain/types/solicitud.type.ts";
import type { SoporteEvaluado } from "@/domain/types/soportes.type.ts";

function asuntoRespuesta(solicitud: Solicitud): string {
  return `${TEXTO_BORRADOR.prefijoRespuesta}${solicitud.asunto}`;
}

function leerDelMaestro(maestro: Maestro, ruta: RutaBorrador): string {
  return leerRuta(maestro, ruta) ?? TEXTO_COMUN.celdaVacia;
}

function adjuntos(soportes: readonly SoporteEvaluado[]): DatosBorradorCorreo["soportes_adjuntos"] {
  return soportes.flatMap((soporte) =>
    soporte.estado === ESTADO_SOPORTE.PRESENTE && soporte.archivo !== null
      ? [{ nombre: TEXTO_SOPORTE.nombre(soporte.tipo), archivo: soporte.archivo }]
      : [],
  );
}

function adjuntaFormulario(formato: Formato): boolean {
  return formato !== FORMATO.PORTAL;
}

function archivosAlCliente(
  solicitud: Solicitud,
  checklist: Checklist,
  formulario: string,
): ReadonlySet<string> {
  const soportes = adjuntos(checklist.soportes).map((adjunto) => adjunto.archivo);
  return new Set(adjuntaFormulario(solicitud.formato) ? [formulario, ...soportes] : soportes);
}

function soportesPendientesDe(checklist: Checklist): readonly string[] {
  const ausentes = checklist.soportes.filter((soporte) => soporte.estado === ESTADO_SOPORTE.AUSENTE);
  const vencidos = checklist.soportes.filter((soporte) => soporte.estado === ESTADO_SOPORTE.VENCIDO);
  return [
    ...ausentes.map((soporte) => TEXTO_SOPORTE.nombre(soporte.tipo)),
    ...vencidos.map((soporte) => TEXTO_BORRADOR.pendienteVencido(TEXTO_SOPORTE.nombre(soporte.tipo))),
  ];
}

export function construirDatosBorrador(
  solicitud: Solicitud,
  maestro: Maestro,
  checklist: Checklist,
  nombreFormulario: string,
): DatosBorradorCorreo {
  const soportesPendientes = soportesPendientesDe(checklist);
  const hayPorConfirmar = checklist.requiere_confirmacion.length > 0;
  const hayCamposSinDato = checklist.faltantes.length > 0;
  const hayPreguntas = hayPorConfirmar || hayCamposSinDato;
  return {
    para: solicitud.de,
    asunto: asuntoRespuesta(solicitud),
    cliente: solicitud.cliente,
    razon_social: leerDelMaestro(maestro, RUTA_MAESTRO.RAZON_SOCIAL),
    firmante_nombre: leerDelMaestro(maestro, RUTA_MAESTRO.CONTACTO_FINANCIERO_NOMBRE),
    firmante_cargo: leerDelMaestro(maestro, RUTA_MAESTRO.CONTACTO_FINANCIERO_CARGO),
    formulario: nombreFormulario,
    adjunta_formulario: seccionSi(adjuntaFormulario(solicitud.formato)),
    soportes_adjuntos: adjuntos(checklist.soportes),
    por_confirmar: checklist.requiere_confirmacion.map(({ etiqueta, nota }) => ({ etiqueta, nota })),
    hay_por_confirmar: seccionSi(hayPorConfirmar),
    campos_sin_dato: checklist.faltantes.map((etiqueta) => ({ etiqueta })),
    hay_campos_sin_dato: seccionSi(hayCamposSinDato),
    soportes_pendientes: soportesPendientes.map((texto) => ({ texto })),
    hay_soportes_pendientes: seccionSi(soportesPendientes.length > 0),
    firma_lista: seccionSi(checklist.listo_para_firma && !hayPreguntas),
    firma_tras_confirmar: seccionSi(checklist.listo_para_firma && hayPreguntas),
    firma_bloqueada: seccionSi(!checklist.listo_para_firma),
  };
}

function archivosVencidos(checklist: Checklist): ReadonlySet<string> {
  return new Set(
    checklist.soportes.flatMap((soporte) =>
      soporte.estado === ESTADO_SOPORTE.VENCIDO && soporte.archivo !== null ? [soporte.archivo] : [],
    ),
  );
}

export function construirDatosEnvio(
  caso: string,
  solicitud: Solicitud,
  checklist: Checklist,
  formulario: string,
  listado: readonly string[],
): DatosEnvioSimulado {
  const alCliente = archivosAlCliente(solicitud, checklist, formulario);
  const vencidos = archivosVencidos(checklist);
  return {
    caso,
    cliente: solicitud.cliente,
    destinatario: solicitud.de,
    asunto: asuntoRespuesta(solicitud),
    fecha_ejecucion: checklist.fecha_ejecucion,
    formulario,
    formulario_en_portal: seccionSi(!adjuntaFormulario(solicitud.formato)),
    archivos: listado.filter((archivo) => alCliente.has(archivo)).map((archivo) => ({ archivo })),
    retenidos: listado.filter((archivo) => vencidos.has(archivo)).map((archivo) => ({ archivo })),
    bloqueos: motivosDeBloqueo(checklist.soportes).map((bloqueo) => ({ bloqueo })),
  };
}
