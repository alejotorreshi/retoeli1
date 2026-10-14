import type { ACCION_UI } from "@web/config/constants/ui.constants.ts";
import type { ErrorResponse, SseEvent } from "@/http/types/api.type.ts";

export type ErrorVisible = {
  readonly codigo: string | null;
  readonly mensaje: string;
};

export type TextoAgente = {
  readonly clave: number;
  readonly texto: string;
};

export type TurnoConversacion = {
  readonly clave: number;
  readonly mensaje: string;
  readonly textos: readonly TextoAgente[];
  readonly error: ErrorVisible | null;
};

export type EstadoConversacion = {
  readonly sesionId: string | null;
  readonly turnos: readonly TurnoConversacion[];
  readonly enCurso: boolean;
};

export type AccionEnviar = {
  readonly tipo: typeof ACCION_UI.ENVIAR;
  readonly mensaje: string;
};

export type AccionEvento = {
  readonly tipo: typeof ACCION_UI.EVENTO;
  readonly evento: SseEvent;
};

export type AccionErrorHttp = {
  readonly tipo: typeof ACCION_UI.ERROR_HTTP;
  readonly status: number;
  readonly mensaje: ErrorResponse["mensaje"];
};

export type AccionErrorRed = {
  readonly tipo: typeof ACCION_UI.ERROR_RED;
};

export type AccionFinStream = {
  readonly tipo: typeof ACCION_UI.FIN_STREAM;
};

export type AccionUi = AccionEnviar | AccionEvento | AccionErrorHttp | AccionErrorRed | AccionFinStream;

export type Despachar = (accion: AccionUi) => void;
