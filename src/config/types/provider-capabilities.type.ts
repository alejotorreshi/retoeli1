import type { MODO_THINKING, PARAMETRO_MAX_TOKENS } from "@/config/constants/llm.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type ThinkingMode = ValorDe<typeof MODO_THINKING>;

export type MaxTokensParam = ValorDe<typeof PARAMETRO_MAX_TOKENS>;

export type ProviderCapabilities = {
  readonly maxTokensParam: MaxTokensParam;
  readonly temperature: number | null;
  readonly thinking: ThinkingMode | null;
  readonly reasoningPassback: boolean;
  readonly toolChoiceNone: boolean;
};

export type ProviderEndpoint = {
  readonly provider: string;
  readonly baseUrl: string;
  readonly model: string;
  readonly maxOutputTokens: number;
  readonly capabilities: ProviderCapabilities;
};
