import type { Checklist, SoporteEvaluado } from "./checklist.ts";
import { TEXTO_CELDA_VACIA } from "./checklist.ts";
import { leerRuta, type Maestro } from "./mapeo.ts";
import type { Solicitud } from "./tipos.ts";

export const RUTAS_BORRADOR = [
  "razon_social",
  "contacto_financiero.nombre",
  "contacto_financiero.cargo",
] as const;

export type RutaBorrador = (typeof RUTAS_BORRADOR)[number];

export const PREFIJO_RESPUESTA = "RE: ";
export const TEXTO_PENDIENTE_VENCIDO = "vencido, enviaremos la versión actualizada";

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
  return `${PREFIJO_RESPUESTA}${solicitud.asunto}`;
}

function leerDelMaestro(maestro: Maestro, ruta: RutaBorrador): string {
  return leerRuta(maestro, ruta) ?? TEXTO_CELDA_VACIA;
}

function adjuntos(soportes: readonly SoporteEvaluado[]): DatosBorradorCorreo["soportes_adjuntos"] {
  return soportes.flatMap((soporte) =>
    soporte.estado === "presente" && soporte.archivo !== null
      ? [{ tipo: soporte.tipo, archivo: soporte.archivo }]
      : [],
  );
}

function pendientesDe(checklist: Checklist): readonly string[] {
  const ausentes = checklist.soportes.filter((soporte) => soporte.estado === "ausente");
  const vencidos = checklist.soportes.filter((soporte) => soporte.estado === "vencido");
  return [
    ...checklist.faltantes,
    ...ausentes.map((soporte) => soporte.tipo),
    ...vencidos.map((soporte) => `${soporte.tipo} (${TEXTO_PENDIENTE_VENCIDO})`),
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
    razon_social: leerDelMaestro(maestro, "razon_social"),
    firmante_nombre: leerDelMaestro(maestro, "contacto_financiero.nombre"),
    firmante_cargo: leerDelMaestro(maestro, "contacto_financiero.cargo"),
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
  readonly bloqueos: readonly { readonly bloqueo: string }[];
};

export function construirDatosEnvio(
  caso: string,
  solicitud: Solicitud,
  checklist: Checklist,
  archivos: readonly string[],
): DatosEnvioSimulado {
  return {
    caso,
    cliente: solicitud.cliente,
    destinatario: solicitud.de,
    asunto: asuntoRespuesta(solicitud),
    fecha_ejecucion: checklist.fecha_ejecucion,
    archivos: archivos.map((archivo) => ({ archivo })),
    bloqueos: checklist.bloqueos.map((bloqueo) => ({ bloqueo })),
  };
}
