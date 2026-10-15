import {
  CABECERA_HTTP,
  ESTADO_LLM,
  METODO_POST,
  TIPO_CONTENIDO_JSON,
} from "@/config/constants/llm.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export const ACCION_UI = {
  ENVIAR: "enviar",
  EVENTO: "evento",
  ERROR_HTTP: "error_http",
  ERROR_RED: "error_red",
  FIN_STREAM: "fin_stream",
  CONFIG_RECIBIDA: "config_recibida",
  ACCESO_PEDIDO: "acceso_pedido",
  CAMBIAR_BORRADOR: "cambiar_borrador",
  ACEPTADO: "aceptado",
} as const;

export const ESTADO_ACCESO = {
  VERIFICANDO: "verificando",
  PEDIDO: "pedido",
  CONCEDIDO: "concedido",
} as const;

export const RESULTADO_API = {
  OK: "ok",
  ACCESO_VENCIDO: "acceso_vencido",
  RECHAZO: "rechazo",
  SIN_RED: "sin_red",
} as const;

export const ID_RAIZ = "root";

export const TECLA_ENVIAR = "Enter";

export const DISTANCIA_PEGADO_AL_FINAL = 96;

export const MARGEN_AVISO_CONTADOR = 200;

export const PEDIDO_JSON = {
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

export const TONO = {
  EXITO: "exito",
  ATENCION: "atencion",
  ERROR: "error",
} as const;

export const TONO_DEL_MODELO = {
  [ESTADO_LLM.DISPONIBLE]: TONO.EXITO,
  [ESTADO_LLM.SIN_CLAVE]: TONO.ERROR,
  [ESTADO_LLM.SALDO_AGOTADO]: TONO.ERROR,
  [ESTADO_LLM.NO_DISPONIBLE]: TONO.ATENCION,
  [ESTADO_LLM.TOPE_DIARIO]: TONO.ATENCION,
} as const satisfies Record<ValorDe<typeof ESTADO_LLM>, ValorDe<typeof TONO>>;

export const ESTADO_HERRAMIENTA = {
  EN_CURSO: "en_curso",
  CORRECTA: "correcta",
  ERROR: "error",
} as const;

export const MAXIMO_TARJETAS_ABIERTAS = 6;

export const SANGRIA_JSON = 2;

export const ESPERA_DESPERTAR_MS = 10_000;
