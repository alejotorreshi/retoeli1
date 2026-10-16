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

export type PasoPreflight<T> =
  | { readonly ok: true; readonly valor: T }
  | { readonly ok: false; readonly mensaje: string };
