import type {
  MODO_THINKING,
  PARAMETRO_MAX_TOKENS,
  ROL_MENSAJE,
  TIPO_HERRAMIENTA_WIRE,
  TOOL_CHOICE,
} from "@/config/constants/llm.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type ModoThinking = ValorDe<typeof MODO_THINKING>;

export type ParametroMaxTokens = ValorDe<typeof PARAMETRO_MAX_TOKENS>;

export type ToolChoice = ValorDe<typeof TOOL_CHOICE>;

export type ProviderCapabilities = {
  readonly maxTokensParam: ParametroMaxTokens;
  readonly temperature: number | null;
  readonly thinking: ModoThinking | null;
  readonly reasoningPassback: boolean;
  readonly toolChoiceNone: boolean;
};

export type ProviderSlot = {
  readonly provider: string;
  readonly baseUrl: string;
  readonly model: string;
  readonly apiKey: string;
  readonly maxOutputTokens: number;
  readonly capabilities: ProviderCapabilities;
};

export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

export type AdapterDependencies = { readonly fetch: FetchLike };

export type WireToolCall = {
  readonly id: string;
  readonly type: typeof TIPO_HERRAMIENTA_WIRE;
  readonly function: { readonly name: string; readonly arguments: string };
};

export type WireMessage =
  | { readonly role: typeof ROL_MENSAJE.SISTEMA | typeof ROL_MENSAJE.USUARIO; readonly content: string }
  | {
      readonly role: typeof ROL_MENSAJE.ASISTENTE;
      readonly content: string;
      readonly tool_calls?: readonly WireToolCall[];
      readonly reasoning_content?: string;
    }
  | {
      readonly role: typeof ROL_MENSAJE.HERRAMIENTA;
      readonly tool_call_id: string;
      readonly content: string;
    };

export type WireTool = {
  readonly type: typeof TIPO_HERRAMIENTA_WIRE;
  readonly function: {
    readonly name: string;
    readonly description: string;
    readonly parameters: Readonly<Record<string, unknown>>;
  };
};

export type ChatCompletionRequest = {
  readonly model: string;
  readonly messages: readonly WireMessage[];
  readonly stream: false;
  readonly temperature?: number;
  readonly thinking?: { readonly type: ModoThinking };
  readonly tools?: readonly WireTool[];
  readonly tool_choice?: ToolChoice;
} & Readonly<Partial<Record<ParametroMaxTokens, number>>>;

export type ChatCompletionToolCall = {
  readonly id: string;
  readonly function: { readonly name: string; readonly arguments: string };
};

export type ChatCompletionChoice = {
  readonly finish_reason?: string | null | undefined;
  readonly message: {
    readonly content?: string | null | undefined;
    readonly tool_calls?: readonly ChatCompletionToolCall[] | undefined;
    readonly reasoning_content?: string | null | undefined;
  };
};

export type ChatCompletionUsage = {
  readonly prompt_tokens: number;
  readonly completion_tokens: number;
  readonly prompt_tokens_details?: { readonly cached_tokens?: number | null | undefined } | null | undefined;
  readonly prompt_cache_hit_tokens?: number | null | undefined;
};

export type ChatCompletion = {
  readonly model: string;
  readonly choices: readonly ChatCompletionChoice[];
  readonly usage?: ChatCompletionUsage | null | undefined;
};
