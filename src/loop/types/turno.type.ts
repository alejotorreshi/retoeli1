import type { AlmacenSesiones, CargarInstrucciones } from "@/application/types/puertos-agente.type.ts";
import type {
  AdaptadorLlm,
  DefinicionHerramienta,
  LlamadaHerramienta,
  Mensaje,
} from "@/llm/types/llm.type.ts";
import type { ContextoHerramienta } from "@/tools/types/herramienta.type.ts";

export type Sesion = {
  readonly id: string;
  readonly historial: readonly Mensaje[];
  readonly tokensUsados: number;
};

export type EntradaTurno = {
  readonly sesionId: string | null;
  readonly mensaje: string;
  readonly signal?: AbortSignal;
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
  readonly directorio: string;
  readonly maxIteraciones: number;
  nuevoId(): string;
};
