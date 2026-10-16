import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";

export const PLAZO_DESPERTAR_MS = 180_000;

export const TIMEOUT_SONDEO_SALUD_MS = 30_000;

export const PAUSA_SONDEO_MS = 5_000;

export const TIMEOUT_TURNO_GUION_MS = 240_000;

export const MS_POR_SEGUNDO = 1_000;

export const OPCION_CLI = {
  URL: "url",
  GUION: "guion",
} as const;

export const TIPO_OPCION_CLI = {
  TEXTO: "string",
  BOOLEANO: "boolean",
} as const;

export const CASO_GUION_PRD = "ec-corp-andina";

export const TIPO_BLOQUEO_GUION = "certificado_cumplimiento_tributario";

export const TURNO_GUION = {
  PROCESAR: 1,
  CONFIRMAR: 2,
} as const;

export const HERRAMIENTAS_TURNO_PROCESAR = [
  NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD],
  NOMBRE_VISIBLE[HERRAMIENTA.MAPEAR_CAMPOS],
  NOMBRE_VISIBLE[HERRAMIENTA.GENERAR_FORMULARIO],
  NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE],
] as const;

export const HERRAMIENTA_ENVIO_GUION = NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO];
