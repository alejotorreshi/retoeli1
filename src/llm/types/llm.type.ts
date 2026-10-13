import type { FIN_LLM, ROL_MENSAJE, TIPO_ERROR_LLM } from "@/config/constants/llm.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type FinLlm = ValorDe<typeof FIN_LLM>;

export type TipoErrorLlm = ValorDe<typeof TIPO_ERROR_LLM>;

export type LlamadaHerramienta = {
  readonly id: string;
  readonly nombre: string;
  readonly argumentos: string;
};

export type MensajeSistema = { readonly rol: typeof ROL_MENSAJE.SISTEMA; readonly contenido: string };

export type MensajeUsuario = { readonly rol: typeof ROL_MENSAJE.USUARIO; readonly contenido: string };

export type MensajeAsistente = {
  readonly rol: typeof ROL_MENSAJE.ASISTENTE;
  readonly contenido: string | null;
  readonly llamadas: readonly LlamadaHerramienta[];
  readonly razonamiento: string | null;
};

export type MensajeHerramienta = {
  readonly rol: typeof ROL_MENSAJE.HERRAMIENTA;
  readonly llamadaId: string;
  readonly contenido: string;
};

export type Mensaje = MensajeSistema | MensajeUsuario | MensajeAsistente | MensajeHerramienta;

export type DefinicionHerramienta = {
  readonly nombre: string;
  readonly descripcion: string;
  readonly parametros: Readonly<Record<string, unknown>>;
};

export type Uso = { readonly entrada: number; readonly salida: number; readonly cacheHit: number };

export type RespuestaLlm = {
  readonly texto: string | null;
  readonly llamadas: readonly LlamadaHerramienta[];
  readonly uso: Uso;
  readonly razonamiento: string | null;
  readonly fin: FinLlm;
  readonly proveedor: string;
  readonly modelo: string;
};

export type ErrorLlm = {
  readonly tipo: TipoErrorLlm;
  readonly reintentable: boolean;
  readonly estado: number | null;
  readonly reintentarTrasMs: number | null;
};

export type ResultadoEnvio =
  | { readonly ok: true; readonly respuesta: RespuestaLlm }
  | { readonly ok: false; readonly error: ErrorLlm };

export type FalloLlm = {
  readonly proveedor: string;
  readonly modelo: string;
  readonly duracionMs: number;
  readonly error: ErrorLlm;
};

export type ObservadorLlm = {
  fallo(fallo: FalloLlm): void;
  cambio(error: ErrorLlm): void;
};

export type OpcionesEnvio = {
  readonly signal: AbortSignal;
  readonly herramientasDesactivadas: boolean;
  readonly observador?: ObservadorLlm;
};

export type AdaptadorLlm = {
  readonly proveedor: string;
  readonly modelo: string;
  enviar(
    mensajes: readonly Mensaje[],
    herramientas: readonly DefinicionHerramienta[],
    opciones: OpcionesEnvio,
  ): Promise<ResultadoEnvio>;
};
