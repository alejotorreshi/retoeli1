import type { ErrorLlm, OpcionesEnvio } from "@/llm/types/llm.type.ts";

export type RetryOptions = {
  readonly maxRetries: number;
  readonly baseMs: number;
  readonly capMs: number;
  wait(ms: number, signal: AbortSignal): Promise<void>;
  random(): number;
};

export type OnProviderSwitch = (error: ErrorLlm, options: OpcionesEnvio) => void;
