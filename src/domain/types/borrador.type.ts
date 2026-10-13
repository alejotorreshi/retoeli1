import type { RUTAS_BORRADOR } from "@/config/constants/maestro.constants.ts";
import type { CampoPorConfirmar } from "@/domain/types/checklist.type.ts";
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
  readonly adjunta_formulario: SeccionCondicional;
  readonly soportes_adjuntos: readonly { readonly nombre: string; readonly archivo: string }[];
  readonly por_confirmar: readonly CampoPorConfirmar[];
  readonly hay_por_confirmar: SeccionCondicional;
  readonly pendientes: readonly { readonly texto: string }[];
  readonly hay_pendientes: SeccionCondicional;
  readonly firma_lista: SeccionCondicional;
  readonly firma_tras_confirmar: SeccionCondicional;
  readonly firma_bloqueada: SeccionCondicional;
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
