import { CABECERA_HTTP, METODO_POST, TIPO_CONTENIDO_JSON } from "@/config/constants/llm.constants.ts";

export const ACCION_UI = {
  ENVIAR: "enviar",
  EVENTO: "evento",
  ERROR_HTTP: "error_http",
  ERROR_RED: "error_red",
  FIN_STREAM: "fin_stream",
} as const;

export const ID_RAIZ = "root";

export const TECLA_ENVIAR = "Enter";

export const FILAS_COMPOSITOR = 3;

export const PEDIDO_CHAT = {
  method: METODO_POST,
  headers: { [CABECERA_HTTP.TIPO_CONTENIDO]: TIPO_CONTENIDO_JSON },
} as const;

export const ESTILO_TEXTO_PLANO = {
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
} as const;
