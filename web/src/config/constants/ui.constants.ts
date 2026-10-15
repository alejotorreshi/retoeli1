import { CABECERA_HTTP, METODO_POST, TIPO_CONTENIDO_JSON } from "@/config/constants/llm.constants.ts";

export const ACCION_UI = {
  ENVIAR: "enviar",
  EVENTO: "evento",
  ERROR_HTTP: "error_http",
  ERROR_RED: "error_red",
  FIN_STREAM: "fin_stream",
} as const;

export const ACCIONES_QUE_DEVUELVEN_EL_BORRADOR: ReadonlySet<string> = new Set([
  ACCION_UI.ERROR_HTTP,
  ACCION_UI.ERROR_RED,
]);

export const ID_RAIZ = "root";

export const TECLA_ENVIAR = "Enter";

export const DISTANCIA_PEGADO_AL_FINAL = 96;

export const PEDIDO_CHAT = {
  method: METODO_POST,
  headers: { [CABECERA_HTTP.TIPO_CONTENIDO]: TIPO_CONTENIDO_JSON },
} as const;

export const TAMANO_ICONO = {
  CHICO: 16,
  GRANDE: 20,
} as const;

export const ICONO_SVG = {
  CAJA: "0 0 24 24",
  TRAZO: 2,
  CENTRO: 12,
  RADIO_CIRCULO: 10,
  RADIO_PUPILA: 3,
} as const;

export const CLASE_GLOBAL = {
  GIRAR: "girar",
  OCULTO: "sr-only",
  TRANSICION: "transicion",
} as const;
