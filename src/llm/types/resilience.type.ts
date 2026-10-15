import type { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { ErrorLlm, OpcionesEnvio } from "@/llm/types/llm.type.ts";

export type RetryOptions = {
  readonly maxRetries: number;
  readonly baseMs: number;
  readonly capMs: number;
  wait(ms: number, signal: AbortSignal): Promise<void>;
  random(): number;
};

export type OnProviderSwitch = (error: ErrorLlm, options: OpcionesEnvio) => void;

export type LlmHealthState = ValorDe<typeof ESTADO_LLM>;

export type LlmHealthMonitor = {
  current(): LlmHealthState;
  publish(state: LlmHealthState): void;
};

export type DailyBudgetOptions = {
  readonly limit: number;
  today(): string;
};

export type DailyBudget = {
  exhausted(): boolean;
  record(tokens: number): void;
};
