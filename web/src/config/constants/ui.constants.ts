import { TIPO_ARCHIVO_CASO } from "@/config/constants/files.constants.ts";
import { METODO_POST } from "@/config/constants/http.constants.ts";
import { CABECERA_HTTP, ESTADO_LLM, TIPO_CONTENIDO_JSON } from "@/config/constants/llm.constants.ts";
import { HERRAMIENTA } from "@/config/constants/tools.constants.ts";
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
  HIDRATAR: "hidratar",
  SESION_EXPIRADA: "sesion_expirada",
  SESION_NO_CARGADA: "sesion_no_cargada",
  DETENER: "detener",
  RECARGAR: "recargar",
  NUEVA_SESION: "nueva_sesion",
} as const;

export const ACCION_AVISO = {
  RECARGAR: "recargar",
  NUEVA_SESION: "nueva_sesion",
} as const;

export const REINTENTO_OCUPADA_MS = 1_000;

export const TOKENS_POR_MILES = 1_000;

export const AVISO_SESION = {
  EXPIRADA: "expirada",
  NO_CARGADA: "no_cargada",
} as const;

export const CLAVE_SESION_LOCAL = "registro-proveedor.sesion-id";

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
  APP: "app",
  COLUMNAS: "columnas",
  VISTA_CHAT: "vista-chat",
  CHAT: "chat",
  VISTA_CASOS: "vista-casos",
  PESTANAS: "pestanas",
  PESTANA: "pestana",
  PUNTO_CAMBIOS: "punto-cambios",
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

export const ESTADO_FIRMA = {
  LISTO: "listo",
  NO_LISTO: "no_listo",
  SIN_ARMAR: "sin_armar",
} as const;

export const SEPARADOR_RUTA = "/";

export const CASO_DEMO_PRD = "ec-corp-andina";

export const SEPARADOR_LISTA_CASOS = ", ";

export const ETAPA = {
  LEIDO: "leido",
  MAPEADO: "mapeado",
  GENERADO: "generado",
  PAQUETE: "paquete",
  CONFIRMACION: "confirmacion",
  ENVIO: "envio",
} as const;

export const ORDEN_ETAPAS = [
  ETAPA.LEIDO,
  ETAPA.MAPEADO,
  ETAPA.GENERADO,
  ETAPA.PAQUETE,
  ETAPA.CONFIRMACION,
  ETAPA.ENVIO,
] as const satisfies readonly ValorDe<typeof ETAPA>[];

export const ETAPA_DE_HERRAMIENTA = {
  [HERRAMIENTA.LEER_SOLICITUD]: ETAPA.LEIDO,
  [HERRAMIENTA.MAPEAR_CAMPOS]: ETAPA.MAPEADO,
  [HERRAMIENTA.GENERAR_FORMULARIO]: ETAPA.GENERADO,
  [HERRAMIENTA.ARMAR_PAQUETE]: ETAPA.PAQUETE,
  [HERRAMIENTA.SIMULAR_ENVIO]: ETAPA.ENVIO,
} as const satisfies Record<ValorDe<typeof HERRAMIENTA>, ValorDe<typeof ETAPA>>;

export const ETAPAS_QUE_REINICIA_EL_PAQUETE = [
  ETAPA.CONFIRMACION,
  ETAPA.ENVIO,
] as const satisfies readonly ValorDe<typeof ETAPA>[];

export const ESTADO_ETAPA = {
  PENDIENTE: "pendiente",
  EN_CURSO: "en_curso",
  HECHA: "hecha",
  ERROR: "error",
  ESPERANDO: "esperando",
  CANCELADA: "cancelada",
} as const;

export const SEPARADOR_FIRMA = "|";

export const ESTADO_TARJETA_CONFIRMACION = {
  ABIERTA: "abierta",
  REGISTRADA: "registrada",
  CANCELADA: "cancelada",
  REEMPLAZADA: "reemplazada",
} as const;

export const SEPARADOR_ANUNCIOS = ". ";

export const PUNTO_DE_QUIEBRE_PX = {
  MEDIO: 640,
  ANCHO: 1024,
} as const;

export const CONSULTA_DE_ANCHO = {
  MEDIO: `(min-width: ${PUNTO_DE_QUIEBRE_PX.MEDIO}px)`,
  ANCHO: `(min-width: ${PUNTO_DE_QUIEBRE_PX.ANCHO}px)`,
} as const;

export const DISENO = {
  ANCHO: "ancho",
  MEDIO: "medio",
  ANGOSTO: "angosto",
} as const;

export const PESTANA = {
  CHAT: "chat",
  CASOS: "casos",
} as const;

export const ORDEN_PESTANAS = [PESTANA.CHAT, PESTANA.CASOS] as const satisfies readonly ValorDe<
  typeof PESTANA
>[];

export const TECLA_PESTANA = {
  ANTERIOR: "ArrowLeft",
  SIGUIENTE: "ArrowRight",
  PRIMERA: "Home",
  ULTIMA: "End",
} as const;

export const EVENTO_CAMBIO_DE_MEDIOS = "change";

export const EVENTO_ABORTO = "abort";

export const SUFIJO_ID = {
  PESTANA: "-pestana-",
  VISTA: "-vista-",
} as const;

export const ESTADO_LISTA_ARCHIVOS = {
  CARGANDO: "cargando",
  ERROR: "error",
  LISTA: "lista",
} as const;

export const ESPERA_LIBERAR_DESCARGA_MS = 1_000;

export const ESTADO_VISTA_PREVIA = {
  CARGANDO: "cargando",
  ERROR: "error",
  LISTA: "lista",
} as const;

export const ARCHIVOS_ESPERADOS_POR_ETAPA = [
  [ETAPA.GENERADO, [TIPO_ARCHIVO_CASO.FORMULARIO, TIPO_ARCHIVO_CASO.VALORES_PORTAL]],
  [ETAPA.PAQUETE, [TIPO_ARCHIVO_CASO.CHECKLIST]],
  [ETAPA.ENVIO, [TIPO_ARCHIVO_CASO.ENVIO_SIMULADO]],
] as const satisfies readonly (readonly [
  ValorDe<typeof ETAPA>,
  readonly ValorDe<typeof TIPO_ARCHIVO_CASO>[],
])[];
