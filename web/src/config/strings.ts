import type { EstadoModelo } from "@web/types/chat.type.ts";
import type { EstadoModeloConAviso, PartesAvisoModelo } from "@web/types/ui.type.ts";
import { VIGENCIA_ACCESO_HORAS_POR_DEFECTO } from "@/config/constants/http.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";

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
  respuestaLista: "Respuesta lista",
  irAlFinal: "Ir al final",
  autorUsuaria: "Tú: ",
  autorAgente: "Agente: ",
  etiquetaMensaje: "Mensaje para el agente",
  placeholder: "Escribe una instrucción, por ejemplo: procesa el caso ec-corp-andina",
  ayuda: `Enter para enviar ${SEPARADOR} Shift+Enter para nueva línea`,
  enviar: "Enviar mensaje",
  contador: (caracteres: number, maximo: number) => `${caracteres}/${maximo}`,
} as const;

export const TEXTO_ERROR = {
  sinConexion: "No hay conexión con el servidor. Revisa tu red y vuelve a intentarlo.",
  streamCortado:
    "Se perdió la conexión con el servidor durante la respuesta. Recarga la conversación para ver lo que alcanzó a hacer, o vuelve a enviar el mensaje.",
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
