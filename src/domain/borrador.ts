import { RUTA_MAESTRO, type RUTAS_BORRADOR } from "@/config/constants/maestro.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { TEXTO_BORRADOR, TEXTO_COMUN } from "@/config/strings.ts";
import type { Checklist, SoporteEvaluado } from "@/domain/checklist.ts";
import { leerRuta, type Maestro } from "@/domain/mapeo.ts";
import type { Solicitud } from "@/domain/tipos.ts";

export type RutaBorrador = (typeof RUTAS_BORRADOR)[number];

type SinCampos = Readonly<Record<string, never>>;

export type DatosBorradorCorreo = {
  readonly para: string;
  readonly asunto: string;
  readonly cliente: string;
  readonly razon_social: string;
  readonly firmante_nombre: string;
  readonly firmante_cargo: string;
  readonly formulario: string;
  readonly soportes_adjuntos: readonly { readonly tipo: string; readonly archivo: string }[];
  readonly pendientes: readonly { readonly texto: string }[];
  readonly hay_pendientes: readonly SinCampos[];
};

export function asuntoRespuesta(solicitud: Solicitud): string {
  return `${TEXTO_BORRADOR.prefijoRespuesta}${solicitud.asunto}`;
}

function leerDelMaestro(maestro: Maestro, ruta: RutaBorrador): string {
  return leerRuta(maestro, ruta) ?? TEXTO_COMUN.celdaVacia;
}

function adjuntos(soportes: readonly SoporteEvaluado[]): DatosBorradorCorreo["soportes_adjuntos"] {
  return soportes.flatMap((soporte) =>
    soporte.estado === ESTADO_SOPORTE.PRESENTE && soporte.archivo !== null
      ? [{ tipo: soporte.tipo, archivo: soporte.archivo }]
      : [],
  );
}

function pendientesDe(checklist: Checklist): readonly string[] {
  const ausentes = checklist.soportes.filter((soporte) => soporte.estado === ESTADO_SOPORTE.AUSENTE);
  const vencidos = checklist.soportes.filter((soporte) => soporte.estado === ESTADO_SOPORTE.VENCIDO);
  return [
    ...checklist.faltantes,
    ...ausentes.map((soporte) => soporte.tipo),
    ...vencidos.map((soporte) => TEXTO_BORRADOR.pendienteVencido(soporte.tipo)),
  ];
}

export function construirDatosBorrador(
  solicitud: Solicitud,
  maestro: Maestro,
  checklist: Checklist,
  nombreFormulario: string,
): DatosBorradorCorreo {
  const pendientes = pendientesDe(checklist);
  return {
    para: solicitud.de,
    asunto: asuntoRespuesta(solicitud),
    cliente: solicitud.cliente,
    razon_social: leerDelMaestro(maestro, RUTA_MAESTRO.RAZON_SOCIAL),
    firmante_nombre: leerDelMaestro(maestro, RUTA_MAESTRO.CONTACTO_FINANCIERO_NOMBRE),
    firmante_cargo: leerDelMaestro(maestro, RUTA_MAESTRO.CONTACTO_FINANCIERO_CARGO),
    formulario: nombreFormulario,
    soportes_adjuntos: adjuntos(checklist.soportes),
    pendientes: pendientes.map((texto) => ({ texto })),
    hay_pendientes: pendientes.length === 0 ? [] : [{}],
  };
}

export type DatosEnvioSimulado = {
  readonly caso: string;
  readonly cliente: string;
  readonly destinatario: string;
  readonly asunto: string;
  readonly fecha_ejecucion: string;
  readonly archivos: readonly { readonly archivo: string }[];
  readonly retenidos: readonly { readonly archivo: string }[];
  readonly bloqueos: readonly { readonly bloqueo: string }[];
};

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
  archivos: readonly string[],
): DatosEnvioSimulado {
  const vencidos = archivosVencidos(checklist);
  return {
    caso,
    cliente: solicitud.cliente,
    destinatario: solicitud.de,
    asunto: asuntoRespuesta(solicitud),
    fecha_ejecucion: checklist.fecha_ejecucion,
    archivos: archivos.filter((archivo) => !vencidos.has(archivo)).map((archivo) => ({ archivo })),
    retenidos: archivos.filter((archivo) => vencidos.has(archivo)).map((archivo) => ({ archivo })),
    bloqueos: checklist.bloqueos.map((bloqueo) => ({ bloqueo })),
  };
}
