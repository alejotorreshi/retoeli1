import { z } from "zod";
import {
  CABECERA_HTTP,
  METODO_POST,
  PREFIJO_BEARER,
  RUTA_CHAT_COMPLETIONS,
  TIPO_CONTENIDO_JSON,
  TOOL_CHOICE,
} from "@/config/constants/llm.constants.ts";
import {
  errorFromException,
  errorFromStatus,
  invalidResponseError,
} from "@/llm/mappers/provider-error.mapper.ts";
import { fromChatCompletion, toWireMessages, toWireTools } from "@/llm/mappers/wire-messages.mapper.ts";
import { chatCompletionSchema } from "@/llm/schemas/chat-completion.schema.ts";
import type {
  AdaptadorLlm,
  DefinicionHerramienta,
  Mensaje,
  OpcionesEnvio,
  ResultadoEnvio,
} from "@/llm/types/llm.type.ts";
import type {
  AdapterDependencies,
  ChatCompletionRequest,
  ProviderSlot,
  WireTool,
} from "@/llm/types/provider.type.ts";

type ToolPart = Pick<ChatCompletionRequest, "tools" | "tool_choice">;

function toolPart(
  slot: ProviderSlot,
  definitions: readonly DefinicionHerramienta[],
  toolsDisabled: boolean,
): ToolPart {
  if (definitions.length === 0) return {};
  const tools: readonly WireTool[] = toWireTools(definitions);
  if (!toolsDisabled) return { tools, tool_choice: TOOL_CHOICE.AUTO };
  return slot.capabilities.toolChoiceNone ? { tools, tool_choice: TOOL_CHOICE.NINGUNA } : {};
}

function buildRequest(
  slot: ProviderSlot,
  messages: readonly Mensaje[],
  definitions: readonly DefinicionHerramienta[],
  toolsDisabled: boolean,
): ChatCompletionRequest {
  const { capabilities } = slot;
  return {
    model: slot.model,
    messages: toWireMessages(messages, capabilities.reasoningPassback),
    stream: false,
    [capabilities.maxTokensParam]: slot.maxOutputTokens,
    ...(capabilities.temperature === null ? {} : { temperature: capabilities.temperature }),
    ...(capabilities.thinking === null ? {} : { thinking: { type: capabilities.thinking } }),
    ...toolPart(slot, definitions, toolsDisabled),
  };
}

function requestInit(slot: ProviderSlot, body: string, signal: AbortSignal): RequestInit {
  return {
    method: METODO_POST,
    headers: {
      [CABECERA_HTTP.AUTORIZACION]: `${PREFIJO_BEARER}${slot.apiKey}`,
      [CABECERA_HTTP.TIPO_CONTENIDO]: TIPO_CONTENIDO_JSON,
    },
    body,
    signal,
  };
}

async function discardBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    return;
  }
}

function parseCompletion(text: string, provider: string, requestCharacters: number): ResultadoEnvio {
  let json: unknown;
  try {
    json = JSON.parse(text.trim());
  } catch {
    return { ok: false, error: invalidResponseError() };
  }
  const parsed = chatCompletionSchema.safeParse(json, { error: z.locales.es().localeError });
  if (!parsed.success) return { ok: false, error: invalidResponseError() };
  return fromChatCompletion(parsed.data, provider, requestCharacters);
}

async function readCompletion(
  response: Response,
  provider: string,
  requestCharacters: number,
  signal: AbortSignal,
): Promise<ResultadoEnvio> {
  try {
    return parseCompletion(await response.text(), provider, requestCharacters);
  } catch {
    return { ok: false, error: errorFromException(signal.aborted) };
  }
}

async function send(
  slot: ProviderSlot,
  dependencies: AdapterDependencies,
  request: ChatCompletionRequest,
  options: OpcionesEnvio,
): Promise<ResultadoEnvio> {
  if (options.signal.aborted) return { ok: false, error: errorFromException(true) };
  const body = JSON.stringify(request);
  let response: Response;
  try {
    response = await dependencies.fetch(
      `${slot.baseUrl}${RUTA_CHAT_COMPLETIONS}`,
      requestInit(slot, body, options.signal),
    );
  } catch {
    return { ok: false, error: errorFromException(options.signal.aborted) };
  }
  if (!response.ok) {
    const retryAfter = response.headers.get(CABECERA_HTTP.REINTENTAR_TRAS);
    await discardBody(response);
    return { ok: false, error: errorFromStatus(response.status, retryAfter) };
  }
  return readCompletion(response, slot.provider, body.length, options.signal);
}

export function createOpenAICompatibleAdapter(
  slot: ProviderSlot,
  dependencies: AdapterDependencies,
): AdaptadorLlm {
  return {
    proveedor: slot.provider,
    modelo: slot.model,
    enviar: (messages, tools, options) =>
      send(
        slot,
        dependencies,
        buildRequest(slot, messages, tools, options.herramientasDesactivadas),
        options,
      ),
  };
}
