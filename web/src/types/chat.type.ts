import type {
  ACCION_UI,
  ESTADO_ACCESO,
  ESTADO_ETAPA,
  ESTADO_FIRMA,
  ESTADO_HERRAMIENTA,
  ETAPA,
  RESULTADO_API,
} from "@web/config/constants/ui.constants.ts";
import type { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { ConfigResponse, ErrorResponse, HealthResponse, SseEvent } from "@/http/types/api.type.ts";

export type ErrorVisible = {
  readonly codigo: string | null;
  readonly mensaje: string;
};

export type TextoAgente = {
  readonly clave: number;
  readonly texto: string;
};

export type EstadoHerramienta = ValorDe<typeof ESTADO_HERRAMIENTA>;

export type LlamadaDelTurno = {
  readonly llamadaId: string;
  readonly herramienta: string;
  readonly caso: string | null;
  readonly argumentos: unknown;
  readonly estado: EstadoHerramienta;
  readonly resumen: string | null;
  readonly codigo: string | null;
  readonly resultado: ResultadoVisibleUi | null;
};

export type ResumenLlamadas = {
  readonly total: number;
  readonly correctas: number;
  readonly conError: number;
};

export type EventoInicioHerramientaUi = Extract<
  SseEvent,
  { readonly tipo: typeof TIPO_EVENTO.INICIO_HERRAMIENTA }
>;

export type EventoFinHerramientaUi = Extract<SseEvent, { readonly tipo: typeof TIPO_EVENTO.FIN_HERRAMIENTA }>;

export type ResultadoVisibleUi = NonNullable<EventoFinHerramientaUi["resultado"]>;

export type FormatoVisible = NonNullable<ResultadoVisibleUi["formato"]>;

export type ConteoUi = NonNullable<ResultadoVisibleUi["conteo"]>;

export type EstadoCampoUi = keyof ConteoUi;

export type EstadoFirma = ValorDe<typeof ESTADO_FIRMA>;

export type ResultadoDeCaso = {
  readonly caso: string;
  readonly pais: string | null;
  readonly formato: FormatoVisible | null;
  readonly conteo: ConteoUi | null;
  readonly listoParaFirma: boolean | null;
  readonly bloqueosLegibles: readonly string[] | null;
  readonly carpeta: string | null;
  readonly aviso: string | null;
};

export type EventoConfirmacionUi = Extract<
  SseEvent,
  { readonly tipo: typeof TIPO_EVENTO.CONFIRMACION_REQUERIDA }
>;

export type ConfirmacionDelTurno = {
  readonly caso: string;
  readonly bloqueosLegibles: readonly string[];
  readonly trasLlamadas: number;
};

export type Etapa = ValorDe<typeof ETAPA>;

export type EstadoEtapa = ValorDe<typeof ESTADO_ETAPA>;

export type EtapaDeCaso = {
  readonly etapa: Etapa;
  readonly estado: EstadoEtapa;
};

export type ProgresoDeCaso = {
  readonly caso: string;
  readonly etapas: readonly EtapaDeCaso[];
};

export type ContadorDeCaso = {
  readonly estado: EstadoCampoUi;
  readonly cantidad: number | null;
};

export type TurnoConversacion = {
  readonly clave: number;
  readonly mensaje: string;
  readonly llamadas: readonly LlamadaDelTurno[];
  readonly eventos: number;
  readonly textos: readonly TextoAgente[];
  readonly confirmaciones: readonly ConfirmacionDelTurno[];
  readonly error: ErrorVisible | null;
};

export type VistaTurnos = Pick<EstadoConversacion, "turnos" | "enCurso">;

export type EstadoAcceso =
  | { readonly tipo: typeof ESTADO_ACCESO.VERIFICANDO }
  | { readonly tipo: typeof ESTADO_ACCESO.PEDIDO; readonly aviso: string | null }
  | { readonly tipo: typeof ESTADO_ACCESO.CONCEDIDO };

export type ResultadoApi<T> =
  | { readonly tipo: typeof RESULTADO_API.OK; readonly valor: T }
  | { readonly tipo: typeof RESULTADO_API.ACCESO_VENCIDO; readonly mensaje: string }
  | { readonly tipo: typeof RESULTADO_API.RECHAZO; readonly status: number; readonly mensaje: string }
  | { readonly tipo: typeof RESULTADO_API.SIN_RED };

export type ResultadoFallido = Exclude<ResultadoApi<never>, { readonly tipo: typeof RESULTADO_API.OK }>;

export type EstadoConversacion = {
  readonly sesionId: string | null;
  readonly turnos: readonly TurnoConversacion[];
  readonly enCurso: boolean;
  readonly acceso: EstadoAcceso;
  readonly config: ConfigResponse | null;
  readonly borrador: string;
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

export type AccionConfigRecibida = {
  readonly tipo: typeof ACCION_UI.CONFIG_RECIBIDA;
  readonly config: ConfigResponse | null;
};

export type AccionAccesoPedido = {
  readonly tipo: typeof ACCION_UI.ACCESO_PEDIDO;
  readonly aviso: string | null;
};

export type AccionCambiarBorrador = {
  readonly tipo: typeof ACCION_UI.CAMBIAR_BORRADOR;
  readonly borrador: string;
};

export type AccionAceptado = {
  readonly tipo: typeof ACCION_UI.ACEPTADO;
  readonly mensaje: string;
};

export type AccionUi =
  | AccionEnviar
  | AccionEvento
  | AccionErrorHttp
  | AccionErrorRed
  | AccionFinStream
  | AccionConfigRecibida
  | AccionAccesoPedido
  | AccionCambiarBorrador
  | AccionAceptado;

export type Despachar = (accion: AccionUi) => void;

export type ControlChat = {
  readonly estado: EstadoConversacion;
  readonly borrador: string;
  readonly cambiarBorrador: (borrador: string) => void;
  readonly enviar: () => void;
  readonly enviarTexto: (mensaje: string) => void;
  readonly recibirConfig: (resultado: ResultadoApi<ConfigResponse>) => void;
};

export type EstadoModelo = HealthResponse["llm"];

export type SaludModelo = Pick<HealthResponse, "model" | "llm">;

export type ControlSalud = {
  readonly salud: HealthResponse | null;
  readonly refrescar: () => void;
};
