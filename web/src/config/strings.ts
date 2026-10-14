const TITULO_APP = "Registro como proveedor";
const SUBTITULO_APP = "Periferia IT Group";

export const TEXTO_APP = {
  titulo: TITULO_APP,
  subtitulo: SUBTITULO_APP,
  tituloDocumento: `${TITULO_APP} · ${SUBTITULO_APP}`,
} as const;

export const TEXTO_CHAT = {
  lineaDeTiempo: "Conversación con el agente",
  vacioTitulo: "¿Qué caso procesamos?",
  vacioCuerpo:
    'Pide un caso por su nombre, por ejemplo "procesa el caso co-industrias-delta", o usa una acción rápida. El agente lee la solicitud, mapea cada campo contra el maestro, genera el formulario y arma el paquete para firma. No registra ningún envío sin tu confirmación.',
  pensando: "Pensando…",
  etiquetaMensaje: "Mensaje para el agente",
  placeholder: "Escribe una instrucción, por ejemplo: procesa el caso ec-corp-andina",
  ayuda: "Enter para enviar · Shift+Enter para nueva línea",
  enviar: "Enviar mensaje",
} as const;

export const TEXTO_ERROR = {
  sinConexion: "No hay conexión con el servidor. Revisa tu red y vuelve a intentarlo.",
  streamCortado:
    "Se perdió la conexión con el servidor durante la respuesta. Recarga la conversación para ver lo que alcanzó a hacer, o vuelve a enviar el mensaje.",
} as const;
