import type { RUTAS_BORRADOR } from "@/config/constants/maestro.constants.ts";
import type { SeccionCondicional } from "@/domain/types/motor-plantillas.type.ts";

export type RutaBorrador = (typeof RUTAS_BORRADOR)[number];

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
  readonly hay_pendientes: SeccionCondicional;
};

export type DatosEnvioSimulado = {
  readonly caso: string;
  readonly cliente: string;
  readonly destinatario: string;
  readonly asunto: string;
  readonly fecha_ejecucion: string;
  readonly formulario: string;
  readonly formulario_en_portal: SeccionCondicional;
  readonly archivos: readonly { readonly archivo: string }[];
  readonly retenidos: readonly { readonly archivo: string }[];
  readonly bloqueos: readonly { readonly bloqueo: string }[];
};
