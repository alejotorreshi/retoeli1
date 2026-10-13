import type { ErrorLlm } from "@/llm/types/llm.type.ts";

export type OpcionesReintento = {
  readonly maxReintentos: number;
  readonly baseMs: number;
  readonly topeMs: number;
  esperar(ms: number, signal: AbortSignal): Promise<void>;
  azar(): number;
};

export type AlCambiarProveedor = (error: ErrorLlm) => void;
