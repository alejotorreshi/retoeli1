import type { MOTIVO_FIN } from "@/config/constants/agent.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type FetchPreflight = (url: URL, init?: RequestInit) => Promise<Response>;

export type PlazosPreflight = {
  readonly despertarMs: number;
  readonly sondeoMs: number;
  readonly pausaMs: number;
  readonly turnoMs: number;
};

export type OpcionesPreflight = {
  readonly url: URL;
  readonly codigo: string;
  readonly guion: boolean;
  readonly fetch: FetchPreflight;
  readonly plazos: PlazosPreflight;
  escribir(linea: string): void;
  esperar(ms: number): Promise<void>;
  ahora(): number;
};

export type UsoGuion = {
  readonly entrada: number;
  readonly cacheHit: number;
  readonly salida: number;
  readonly totalSesion: number;
};

export type ResultadoPreflight = {
  readonly fallido: boolean;
  readonly tokens: UsoGuion | null;
};

export type FalloPreflight = { readonly ok: false; readonly mensaje: string };

export type PasoPreflight<T> = { readonly ok: true; readonly valor: T } | FalloPreflight;

export type InicioTurnoGuion = { readonly sesionId: string };

export type FinHerramientaGuion = {
  readonly herramienta: string;
  readonly caso: string | null;
  readonly ok: boolean;
};

export type ConfirmacionGuion = {
  readonly caso: string;
  readonly bloqueos: readonly string[];
};

export type UsoTurnoGuion = UsoGuion;

export type ErrorGuion = { readonly mensaje: string };

export type FinTurnoGuion = {
  readonly motivo: ValorDe<typeof MOTIVO_FIN>;
  readonly needsConfirmation: boolean;
};

export type ArchivosGuion = {
  readonly archivos: readonly { readonly nombre: string }[];
};

export type LecturaTurnoGuion = {
  readonly sesionId: string | null;
  readonly herramientas: readonly FinHerramientaGuion[];
  readonly confirmaciones: readonly ConfirmacionGuion[];
  readonly usos: readonly UsoTurnoGuion[];
  readonly errores: readonly string[];
  readonly fin: FinTurnoGuion | null;
};
