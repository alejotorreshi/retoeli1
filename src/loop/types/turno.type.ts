import type { Registrar, Reloj } from "@/application/types/puertos.type.ts";
import type {
  AlmacenSesiones,
  BitacoraEstructurada,
  CargarInstrucciones,
} from "@/application/types/puertos-agente.type.ts";
import type { LlamadaResumida } from "@/domain/types/cierre-turno.type.ts";
import type {
  AutorizacionTurno,
  CasoPendiente,
  EntradaCierreCompuerta,
  EstadoCompuerta,
  EventoCompuerta,
  PaquetesConocidos,
} from "@/domain/types/compuerta.type.ts";
import type {
  AdaptadorLlm,
  DefinicionHerramienta,
  LlamadaHerramienta,
  Mensaje,
  ObservadorLlm,
  RespuestaLlm,
} from "@/llm/types/llm.type.ts";
import type {
  CodigoAgente,
  EventoAgente,
  EventoConfirmacionRequerida,
  MotivoFin,
} from "@/loop/types/evento.type.ts";
import type { ContextoHerramienta } from "@/tools/types/herramienta.type.ts";

export type Sesion = {
  readonly id: string;
  readonly historial: readonly Mensaje[];
  readonly tokensUsados: number;
  readonly compuerta: EstadoCompuerta;
  readonly paquetesConocidos: PaquetesConocidos;
};

export type ConfirmacionEstructurada = { readonly aprobada: boolean; readonly caso: string };

export type EntradaTurno = {
  readonly sesionId: string | null;
  readonly mensaje: string;
  readonly signal?: AbortSignal;
  readonly confirmacion?: ConfirmacionEstructurada;
};

export type ResultadoLlamada = {
  readonly contenido: string;
  readonly ok: boolean;
  readonly codigo: string | null;
  readonly resumen: string | null;
  readonly respuesta: unknown;
};

export type RegistroHerramientas = {
  readonly definiciones: readonly DefinicionHerramienta[];
  ejecutar(llamada: LlamadaHerramienta, ctx: ContextoHerramienta): Promise<ResultadoLlamada>;
};

export type DependenciasTurno = {
  readonly llm: AdaptadorLlm;
  readonly herramientas: RegistroHerramientas;
  readonly instrucciones: CargarInstrucciones;
  readonly sesiones: AlmacenSesiones<Sesion>;
  readonly reloj: Reloj;
  readonly registrar: Registrar;
  readonly directorio: string;
  readonly maxIteraciones: number;
  readonly presupuestoTokens: number;
  readonly deadlineMs: number;
  readonly bitacora: BitacoraEstructurada;
  readonly secretos: readonly string[];
  nuevoId(): string;
};

export type ContextoDespacho = {
  readonly registro: RegistroHerramientas;
  readonly registrar: Registrar;
  readonly directorio: string;
  readonly sesionId: string;
  readonly autorizacion: AutorizacionTurno;
  readonly conocidos: PaquetesConocidos;
};

export type ResultadoDespacho = {
  readonly resultado: ResultadoLlamada;
  readonly autorizacion: AutorizacionTurno;
  readonly evento: EventoCompuerta | null;
  readonly paquete: CasoPendiente | null;
  readonly envioPermitido: boolean | null;
};

export type EntradaCierreTurno = EntradaCierreCompuerta & {
  readonly turnoId: string;
  readonly texto: string;
};

export type CierreTurnoCompuerta = {
  readonly estado: EstadoCompuerta;
  readonly pendientes: readonly CasoPendiente[];
  readonly texto: string;
  readonly eventosConfirmacion: readonly EventoConfirmacionRequerida[];
  readonly needsConfirmation: boolean;
};

export type LlamadaRespondida = {
  readonly herramienta: string;
  readonly argumentos: unknown;
  readonly ok: boolean;
  readonly codigo: string | null;
  readonly resumen: string | null;
};

export type RespuestaTurno = {
  readonly reply: string;
  readonly toolCalls: readonly LlamadaRespondida[];
  readonly needsConfirmation: boolean;
};

export type ContextoTope = {
  readonly mensajes: readonly Mensaje[];
  readonly definiciones: readonly DefinicionHerramienta[];
  readonly signal: AbortSignal;
  readonly observador: ObservadorLlm;
  readonly llamadas: readonly LlamadaResumida[];
  readonly cabePresupuesto: boolean;
};

export type ResultadoTope = {
  readonly texto: string;
  readonly respuesta: RespuestaLlm | null;
};

export type Ejecucion<R> = AsyncGenerator<EventoAgente, R>;

export type Cierre = {
  readonly motivo: MotivoFin;
  readonly texto: string;
  readonly razonamiento: string | null;
  readonly porError: boolean;
  readonly codigo: CodigoAgente | null;
};

export type Turno = {
  readonly turnoId: string;
  readonly candado: string;
  sesion: Sesion;
  readonly usuario: Mensaje;
  readonly pasos: Mensaje[];
  readonly signal: AbortSignal;
  readonly llamante: AbortSignal | null;
  readonly deps: DependenciasTurno;
  readonly bitacora: BitacoraEstructurada;
  readonly observador: ObservadorLlm;
  readonly inicioMs: number;
  readonly arrastrados: readonly CasoPendiente[];
  readonly eventosCompuerta: EventoCompuerta[];
  readonly llamadas: LlamadaResumida[];
  autorizacion: AutorizacionTurno;
  conocidos: PaquetesConocidos;
  guardado: boolean;
};

export type FinAnotado = {
  readonly needsConfirmation: boolean;
  readonly abandonado: boolean;
  readonly sesionGuardada: boolean;
};

export type FinDeTurno = { readonly motivo: MotivoFin; readonly needsConfirmation: boolean };
