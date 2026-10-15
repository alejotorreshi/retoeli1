import { VIGENCIA_ACCESO_HORAS_POR_DEFECTO } from "@/config/constants/http.constants.ts";

const TITULO_APP = "Registro como proveedor";
const SUBTITULO_APP = "Periferia IT Group";
const SEPARADOR = "·";
const SIN_DATO = "—";

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
  respuestaLista: "Respuesta lista",
  irAlFinal: "Ir al final",
  autorUsuaria: "Tú: ",
  autorAgente: "Agente: ",
  etiquetaMensaje: "Mensaje para el agente",
  placeholder: "Escribe una instrucción, por ejemplo: procesa el caso ec-corp-andina",
  ayuda: `Enter para enviar ${SEPARADOR} Shift+Enter para nueva línea`,
  enviar: "Enviar mensaje",
} as const;

export const TEXTO_ERROR = {
  sinConexion: "No hay conexión con el servidor. Revisa tu red y vuelve a intentarlo.",
  streamCortado:
    "Se perdió la conexión con el servidor durante la respuesta. Recarga la conversación para ver lo que alcanzó a hacer, o vuelve a enviar el mensaje.",
} as const;
