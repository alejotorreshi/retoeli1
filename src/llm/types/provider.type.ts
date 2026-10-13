import type { ROL_MENSAJE, TIPO_HERRAMIENTA_WIRE, TOOL_CHOICE } from "@/config/constants/llm.constants.ts";
import type {
  MaxTokensParam,
  ProviderEndpoint,
  ThinkingMode,
} from "@/config/types/provider-capabilities.type.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type ToolChoice = ValorDe<typeof TOOL_CHOICE>;

export type ProviderSlot = ProviderEndpoint & { readonly apiKey: string };

export type ParsedJson = { readonly ok: true; readonly value: unknown } | { readonly ok: false };

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
  readonly thinking?: { readonly type: ThinkingMode };
  readonly tools?: readonly WireTool[];
  readonly tool_choice?: ToolChoice;
} & Readonly<Partial<Record<MaxTokensParam, number>>>;

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
