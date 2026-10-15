import {
  ACCION_AVISO,
  CASO_DEMO_PRD,
  ESTADO_ETAPA,
  ESTADO_FIRMA,
  ESTADO_HERRAMIENTA,
  ESTADO_TARJETA_CONFIRMACION,
  ETAPA,
  PESTANA,
  SEPARADOR_LISTA_CASOS,
} from "@web/config/constants/ui.constants.ts";
import type {
  AccionDeAviso,
  AccionDeTarjeta,
  EstadoCampoUi,
  EstadoEtapa,
  EstadoFirma,
  EstadoHerramienta,
  EstadoModelo,
  EstadoTarjetaConfirmacion,
  Etapa,
  FormatoVisible,
  ResumenLlamadas,
  TipoArchivoUi,
} from "@web/types/chat.type.ts";
import type { EstadoModeloConAviso, PartesAvisoModelo, Pestana } from "@web/types/ui.type.ts";
import { TIPO_ACCION } from "@/config/constants/confirmation.constants.ts";
import { ARCHIVOS_SALIDA, TIPO_ARCHIVO_CASO } from "@/config/constants/files.constants.ts";
import { FORMATO } from "@/config/constants/forms.constants.ts";
import { VIGENCIA_ACCESO_HORAS_POR_DEFECTO } from "@/config/constants/http.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { HERRAMIENTA, HERRAMIENTA_POR_NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

const TITULO_APP = "Registro como proveedor";
const SUBTITULO_APP = "Periferia IT Group";
const SEPARADOR = "·";
const SIN_DATO = "—";
const COMANDO_DEMO = "bun run demo.ts";

export const TEXTO_APP = {
  titulo: TITULO_APP,
  subtitulo: SUBTITULO_APP,
  separador: SEPARADOR,
  tituloDocumento: `${TITULO_APP} ${SEPARADOR} ${SUBTITULO_APP}`,
  fechaEjecucion: (fecha: string | null) => `Fecha de ejecución ${fecha ?? SIN_DATO}`,
  cargando: "Cargando el agente…",
} as const;

export const TEXTO_ACCESO = {
  titulo: "Acceso al agente",
  ayuda: `Escribe el código de acceso que está en el README. Lo pedimos una vez; el acceso dura ${VIGENCIA_ACCESO_HORAS_POR_DEFECTO} horas en este navegador.`,
  etiqueta: "Código de acceso",
  mostrar: "Mostrar código",
  ocultar: "Ocultar código",
  entrar: "Entrar al agente",
  verificando: "Verificando…",
  vencido: "Tu acceso venció. Escribe el código de nuevo para seguir.",
} as const;

export const TEXTO_CHAT = {
  lineaDeTiempo: "Conversación con el agente",
  vacioTitulo: "¿Qué caso procesamos?",
  vacioCuerpo:
    'Pide un caso por su nombre, por ejemplo "procesa el caso co-industrias-delta", o usa una acción rápida. El agente lee la solicitud, mapea cada campo contra el maestro, genera el formulario y arma el paquete para firma. No registra ningún envío sin tu confirmación.',
  pensando: "Pensando…",
  cargandoConversacion: "Cargando la conversación…",
  pensandoEn: (gerundio: string, caso: string | null) =>
    caso === null ? `${gerundio}…` : `${gerundio} ${SEPARADOR} ${caso}…`,
  despertando: "El servidor puede estar despertando; la primera respuesta tarda hasta un minuto.",
  respuestaLista: "Respuesta lista",
  irAlFinal: "Ir al final",
  autorUsuaria: "Tú: ",
  autorAgente: "Agente: ",
  etiquetaMensaje: "Mensaje para el agente",
  placeholder: "Escribe una instrucción, por ejemplo: procesa el caso ec-corp-andina",
  ayuda: `Enter para enviar ${SEPARADOR} Shift+Enter para nueva línea`,
  enviar: "Enviar mensaje",
  detener: "Detener respuesta",
  contador: (caracteres: number, maximo: number) => `${caracteres}/${maximo}`,
  uso: (usados: number, tope: number) => `Uso de la sesión: ${usados} k de ${tope} k tokens`,
} as const;

export const TEXTO_ERROR = {
  sinConexion: "No hay conexión con el servidor. Revisa tu red y vuelve a intentarlo.",
  streamCortado:
    "Se perdió la conexión con el servidor durante la respuesta. Recarga la conversación para ver lo que alcanzó a hacer, o vuelve a enviar el mensaje.",
} as const;

const ACCION_DEL_AVISO = {
  [ACCION_AVISO.RECARGAR]: "Recargar conversación",
  [ACCION_AVISO.NUEVA_SESION]: "Empezar sesión nueva",
} as const satisfies Record<AccionDeAviso, string>;

export const TEXTO_AVISO = {
  accion: (accion: AccionDeAviso) => ACCION_DEL_AVISO[accion],
} as const;

export const TEXTO_NUEVA_SESION = {
  abrir: "Nueva sesión",
  titulo: "¿Empezar una sesión nueva?",
  cuerpo:
    "La conversación actual sale de esta pantalla y las confirmaciones pendientes se descartan. Los archivos generados siguen en el servidor mientras no se reinicie.",
  seguir: "Seguir en esta sesión",
  empezar: ACCION_DEL_AVISO[ACCION_AVISO.NUEVA_SESION],
} as const;

function avisoSinComando(texto: string): PartesAvisoModelo {
  return { texto, comando: null, cierre: "" };
}

const ETIQUETA_DEL_MODELO = {
  [ESTADO_LLM.DISPONIBLE]: "Disponible",
  [ESTADO_LLM.SIN_CLAVE]: "Sin clave",
  [ESTADO_LLM.SALDO_AGOTADO]: "Sin saldo",
  [ESTADO_LLM.NO_DISPONIBLE]: "No disponible",
  [ESTADO_LLM.TOPE_DIARIO]: "Tope diario",
} as const satisfies Record<EstadoModelo, string>;

const AVISO_DEL_MODELO = {
  [ESTADO_LLM.SIN_CLAVE]: () => ({
    texto:
      "El modelo no está configurado en este servidor: falta la clave del proveedor. El chat no puede procesar mensajes; para ver el flujo sin modelo, corre ",
    comando: COMANDO_DEMO,
    cierre: " en local.",
  }),
  [ESTADO_LLM.SALDO_AGOTADO]: () =>
    avisoSinComando(
      "El proveedor del modelo se quedó sin saldo. Los mensajes van a fallar hasta que se recargue la cuenta.",
    ),
  [ESTADO_LLM.NO_DISPONIBLE]: () =>
    avisoSinComando(
      "El proveedor del modelo no respondió en el último intento. Puedes volver a intentarlo en unos minutos; la sesión sigue abierta.",
    ),
  [ESTADO_LLM.TOPE_DIARIO]: (zona: string | null) =>
    avisoSinComando(
      `Se alcanzó el tope diario de uso del modelo. El chat vuelve a estar disponible después de la medianoche (${zona ?? SIN_DATO}).`,
    ),
} as const satisfies Record<EstadoModeloConAviso, (zona: string | null) => PartesAvisoModelo>;

export const TEXTO_MODELO = {
  estado: (modelo: string, estado: EstadoModelo) => `${modelo} ${SEPARADOR} ${ETIQUETA_DEL_MODELO[estado]}`,
  aviso: (estado: EstadoModeloConAviso, zona: string | null): PartesAvisoModelo =>
    AVISO_DEL_MODELO[estado](zona),
} as const;

const ETIQUETA_DE_HERRAMIENTA = {
  [HERRAMIENTA.LEER_SOLICITUD]: "Leer solicitud",
  [HERRAMIENTA.MAPEAR_CAMPOS]: "Mapear campos",
  [HERRAMIENTA.GENERAR_FORMULARIO]: "Generar formulario",
  [HERRAMIENTA.ARMAR_PAQUETE]: "Armar paquete",
  [HERRAMIENTA.SIMULAR_ENVIO]: "Simular envío",
} as const satisfies Record<ValorDe<typeof HERRAMIENTA>, string>;

const GERUNDIO_DE_HERRAMIENTA = {
  [HERRAMIENTA.LEER_SOLICITUD]: "Leyendo la solicitud",
  [HERRAMIENTA.MAPEAR_CAMPOS]: "Mapeando campos",
  [HERRAMIENTA.GENERAR_FORMULARIO]: "Generando el formulario",
  [HERRAMIENTA.ARMAR_PAQUETE]: "Armando el paquete",
  [HERRAMIENTA.SIMULAR_ENVIO]: "Registrando el envío simulado",
} as const satisfies Record<ValorDe<typeof HERRAMIENTA>, string>;

const ESTADO_DE_HERRAMIENTA = {
  [ESTADO_HERRAMIENTA.EN_CURSO]: "En curso",
  [ESTADO_HERRAMIENTA.CORRECTA]: "Correcta",
  [ESTADO_HERRAMIENTA.ERROR]: "Error",
} as const satisfies Record<EstadoHerramienta, string>;

function etiquetaDeHerramienta(nombre: string): string {
  const herramienta = HERRAMIENTA_POR_NOMBRE_VISIBLE.get(nombre);
  return herramienta === undefined ? nombre : ETIQUETA_DE_HERRAMIENTA[herramienta];
}

function gerundioDeHerramienta(nombre: string): string {
  const herramienta = HERRAMIENTA_POR_NOMBRE_VISIBLE.get(nombre);
  return herramienta === undefined ? `Ejecutando ${nombre}` : GERUNDIO_DE_HERRAMIENTA[herramienta];
}

function llamadas(total: number): string {
  return total === 1 ? `${total} llamada a herramienta` : `${total} llamadas a herramientas`;
}

function correctas(cantidad: number): string {
  return cantidad === 1 ? `${cantidad} correcta` : `${cantidad} correctas`;
}

export const TEXTO_HERRAMIENTA = {
  etiqueta: etiquetaDeHerramienta,
  gerundio: gerundioDeHerramienta,
  estado: (estado: EstadoHerramienta) => ESTADO_DE_HERRAMIENTA[estado],
  grupo: ({ total, correctas: buenas, conError }: ResumenLlamadas) =>
    total === 1
      ? llamadas(total)
      : `${llamadas(total)} ${SEPARADOR} ${correctas(buenas)} ${SEPARADOR} ${conError} con error`,
  herramienta: "Herramienta",
  argumentos: "Argumentos",
  resultado: "Resultado",
  sinResultado: SIN_DATO,
  codigo: (codigo: string) => `Código: ${codigo}`,
  anuncio: (nombre: string, caso: string | null) =>
    caso === null
      ? `Ejecutando ${etiquetaDeHerramienta(nombre)}`
      : `Ejecutando ${etiquetaDeHerramienta(nombre)} de ${caso}`,
} as const;

const FORMATO_VISIBLE = {
  [FORMATO.XLSX]: "XLSX",
  [FORMATO.PDF]: "PDF",
  [FORMATO.PORTAL]: "Portal",
} as const satisfies Record<FormatoVisible, string>;

const CONTADOR_DE_ESTADO = {
  [ESTADO_CAMPO.LLENO]: "Llenos",
  [ESTADO_CAMPO.FALTANTE]: "Faltantes",
  [ESTADO_CAMPO.REQUIERE_CONFIRMACION]: "Por confirmar",
} as const satisfies Record<EstadoCampoUi, string>;

const FIRMA = {
  [ESTADO_FIRMA.LISTO]: "Listo para firma",
  [ESTADO_FIRMA.NO_LISTO]: "No listo para firma",
  [ESTADO_FIRMA.SIN_ARMAR]: "Paquete sin armar",
} as const satisfies Record<EstadoFirma, string>;

export const TEXTO_RESULTADO = {
  sinDato: SIN_DATO,
  formato: (formato: FormatoVisible | null) => (formato === null ? SIN_DATO : FORMATO_VISIBLE[formato]),
  pais: (pais: string | null) => pais ?? SIN_DATO,
  cantidad: (cantidad: number | null) => (cantidad === null ? SIN_DATO : String(cantidad)),
  contador: (estado: EstadoCampoUi) => CONTADOR_DE_ESTADO[estado],
  firma: (estado: EstadoFirma) => FIRMA[estado],
  bloqueos: "Bloqueos",
  sinBloqueos: "Sin bloqueos",
  ruta: "Ruta de salida",
  portal: "Formato no soportado: se generaron los valores para cargar a mano en el portal.",
  etiqueta: (caso: string) => `Resultado de ${caso}`,
} as const;

export const TEXTO_ACCIONES = {
  grupo: "Acciones rápidas",
  demo: `Demo §11: ${CASO_DEMO_PRD}`,
  mensajeDemo: `Procesa el caso "${CASO_DEMO_PRD}". Dime qué campos quedaron llenos, cuáles faltan, si el paquete está listo para firma y qué soportes debo actualizar. No envíes nada todavía.`,
  todos: (cantidad: number) => (cantidad === 0 ? "Procesar los casos" : `Procesar los ${cantidad} casos`),
  mensajeTodos: (casos: readonly string[]) =>
    `Procesa estos casos: ${casos.join(SEPARADOR_LISTA_CASOS)}. Dime el estado de cada uno. No envíes nada todavía.`,
  listar: "¿Qué casos hay?",
  mensajeListar: "¿Qué casos hay disponibles?",
} as const;

const ETIQUETA_DE_ETAPA = {
  [ETAPA.LEIDO]: "Leído",
  [ETAPA.MAPEADO]: "Mapeado",
  [ETAPA.GENERADO]: "Generado",
  [ETAPA.PAQUETE]: "Paquete",
  [ETAPA.CONFIRMACION]: "Confirmación",
  [ETAPA.ENVIO]: "Envío",
} as const satisfies Record<Etapa, string>;

const ESTADO_DE_ETAPA = {
  [ESTADO_ETAPA.PENDIENTE]: "pendiente",
  [ESTADO_ETAPA.EN_CURSO]: "en curso",
  [ESTADO_ETAPA.HECHA]: "hecho",
  [ESTADO_ETAPA.ERROR]: "con error",
  [ESTADO_ETAPA.ESPERANDO]: "esperando confirmación",
  [ESTADO_ETAPA.CANCELADA]: "cancelado",
} as const satisfies Record<EstadoEtapa, string>;

export const TEXTO_PROGRESO = {
  etapa: (etapa: Etapa) => ETIQUETA_DE_ETAPA[etapa],
  aria: (etapa: Etapa, estado: EstadoEtapa) => `${ETIQUETA_DE_ETAPA[etapa]}: ${ESTADO_DE_ETAPA[estado]}`,
  lista: (caso: string) => `Avance de ${caso}`,
} as const;

export const TEXTO_PANEL = {
  titulo: "Casos de esta sesión",
  vacio: "Todavía no se procesó ningún caso. Aquí verás el avance de cada caso y sus archivos.",
  pie: "Los archivos viven en el disco temporal del servidor y se borran si se reinicia.",
} as const;

const TIPO_DE_ARCHIVO = {
  [TIPO_ARCHIVO_CASO.FORMULARIO]: "Formulario",
  [TIPO_ARCHIVO_CASO.VALORES_PORTAL]: "Valores para portal",
  [TIPO_ARCHIVO_CASO.CHECKLIST]: "Checklist",
  [TIPO_ARCHIVO_CASO.BORRADOR]: "Borrador de correo",
  [TIPO_ARCHIVO_CASO.ENVIO_SIMULADO]: "Envío simulado",
  [TIPO_ARCHIVO_CASO.SOPORTE]: "Soporte",
} as const satisfies Record<TipoArchivoUi, string>;

const VER = "Ver";
const DESCARGAR = "Descargar";

export const TEXTO_ARCHIVOS = {
  lista: (caso: string) => `Archivos de ${caso}`,
  cargando: "Cargando archivos…",
  error: "No pudimos traer los archivos de este caso.",
  reintentar: "Reintentar",
  vacio:
    "Todavía no hay archivos de este caso. Aparecen cuando el agente genera el formulario o arma el paquete.",
  tipo: (tipo: TipoArchivoUi) => TIPO_DE_ARCHIVO[tipo],
  ver: VER,
  descargar: DESCARGAR,
  verArchivo: (nombre: string) => `${VER} ${nombre}`,
  descargarArchivo: (nombre: string) => `${DESCARGAR} ${nombre}`,
} as const;

const ETIQUETA_DE_PESTANA = {
  [PESTANA.CHAT]: "Chat",
  [PESTANA.CASOS]: "Casos y archivos",
} as const satisfies Record<Pestana, string>;

export const TEXTO_PESTANAS = {
  grupo: "Vistas del agente",
  etiqueta: (pestana: Pestana) => ETIQUETA_DE_PESTANA[pestana],
  cambiosSinVer: ", hay cambios sin ver",
} as const;

const ACCION_CONFIRMADA = "Envío simulado";

const DESENLACE_DE_TARJETA = {
  [ESTADO_TARJETA_CONFIRMACION.ABIERTA]: "Confirmación pendiente",
  [ESTADO_TARJETA_CONFIRMACION.REGISTRADA]: "Envío registrado",
  [ESTADO_TARJETA_CONFIRMACION.CANCELADA]: "Envío cancelado",
  [ESTADO_TARJETA_CONFIRMACION.REEMPLAZADA]: "Reemplazada por una confirmación nueva",
} as const satisfies Record<EstadoTarjetaConfirmacion, string>;

const MENSAJE_DE_ACCION = {
  [TIPO_ACCION.CONFIRMAR]: (caso: string) => `Sí, envía ${caso}`,
  [TIPO_ACCION.CANCELAR]: (caso: string) => `Cancela el envío de ${caso}`,
} as const satisfies Record<AccionDeTarjeta["tipo"], (caso: string) => string>;

export const TEXTO_CONFIRMACION = {
  titulo: `Confirmación requerida ${SEPARADOR} ${ACCION_CONFIRMADA}`,
  caso: "Caso: ",
  accion: `Acción: ${ACCION_CONFIRMADA}`,
  bloqueos: "Bloqueos",
  conBloqueos: (cantidad: number) => `Se registrará con ${cantidad} bloqueo(s).`,
  nota: `Confirmar registra solo ${ARCHIVOS_SALIDA.ENVIO_SIMULADO}. No se envía ningún correo real.`,
  confirmar: "Confirmar envío simulado",
  cancelar: "Cancelar envío",
  enviando: "Enviando…",
  ocupada: "Espera a que termine la respuesta actual.",
  desenlace: (estado: EstadoTarjetaConfirmacion) => DESENLACE_DE_TARJETA[estado],
  mensaje: ({ tipo, caso }: AccionDeTarjeta) => MENSAJE_DE_ACCION[tipo](caso),
  anuncio: (casos: readonly string[]) => `Confirmación requerida para ${casos.join(SEPARADOR_LISTA_CASOS)}`,
  etiqueta: (caso: string) => `Confirmación de ${caso}`,
} as const;
