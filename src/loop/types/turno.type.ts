import type { Registrar, Reloj } from "@/application/types/puertos.type.ts";
import type { AlmacenSesiones, CargarInstrucciones } from "@/application/types/puertos-agente.type.ts";
import type {
  AutorizacionTurno,
  CasoPendiente,
  EstadoCompuerta,
  EventoCompuerta,
} from "@/domain/types/compuerta.type.ts";
import type {
  AdaptadorLlm,
  DefinicionHerramienta,
  LlamadaHerramienta,
  Mensaje,
} from "@/llm/types/llm.type.ts";
import type { EventoConfirmacionRequerida } from "@/loop/types/evento.type.ts";
import type { ContextoHerramienta } from "@/tools/types/herramienta.type.ts";

export type PaquetesConocidos = Readonly<Record<string, CasoPendiente>>;

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
};

export type EntradaCierreTurno = {
  readonly turnoId: string;
  readonly texto: string;
  readonly arrastrados: readonly CasoPendiente[];
  readonly eventos: readonly EventoCompuerta[];
  readonly conocidos: PaquetesConocidos;
  readonly abortado: boolean;
};

export type CierreTurnoCompuerta = {
  readonly estado: EstadoCompuerta;
  readonly pendientes: readonly CasoPendiente[];
  readonly texto: string;
  readonly eventosConfirmacion: readonly EventoConfirmacionRequerida[];
  readonly needsConfirmation: boolean;
};
