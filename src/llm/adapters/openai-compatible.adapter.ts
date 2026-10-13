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
  definiciones: readonly DefinicionHerramienta[],
  desactivadas: boolean,
): ToolPart {
  if (definiciones.length === 0) return {};
  const tools: readonly WireTool[] = toWireTools(definiciones);
  if (!desactivadas) return { tools, tool_choice: TOOL_CHOICE.AUTO };
  return slot.capabilities.toolChoiceNone ? { tools, tool_choice: TOOL_CHOICE.NINGUNA } : {};
}

function buildRequest(
  slot: ProviderSlot,
  mensajes: readonly Mensaje[],
  definiciones: readonly DefinicionHerramienta[],
  desactivadas: boolean,
): ChatCompletionRequest {
  const { capabilities } = slot;
  return {
    model: slot.model,
    messages: toWireMessages(mensajes, capabilities.reasoningPassback),
    stream: false,
    [capabilities.maxTokensParam]: slot.maxOutputTokens,
    ...(capabilities.temperature === null ? {} : { temperature: capabilities.temperature }),
    ...(capabilities.thinking === null ? {} : { thinking: { type: capabilities.thinking } }),
    ...toolPart(slot, definiciones, desactivadas),
  };
}

function requestInit(slot: ProviderSlot, cuerpo: string, signal: AbortSignal): RequestInit {
  return {
    method: METODO_POST,
    headers: {
      [CABECERA_HTTP.AUTORIZACION]: `${PREFIJO_BEARER}${slot.apiKey}`,
      [CABECERA_HTTP.TIPO_CONTENIDO]: TIPO_CONTENIDO_JSON,
    },
    body: cuerpo,
    signal,
  };
}

async function discardBody(respuesta: Response): Promise<void> {
  try {
    await respuesta.body?.cancel();
  } catch {
    return;
  }
}

function parseCompletion(texto: string, proveedor: string, caracteresPeticion: number): ResultadoEnvio {
  let json: unknown;
  try {
    json = JSON.parse(texto.trim());
  } catch {
    return { ok: false, error: invalidResponseError() };
  }
  const validado = chatCompletionSchema.safeParse(json, { error: z.locales.es().localeError });
  if (!validado.success) return { ok: false, error: invalidResponseError() };
  return fromChatCompletion(validado.data, proveedor, caracteresPeticion);
}

async function readCompletion(
  respuesta: Response,
  proveedor: string,
  caracteresPeticion: number,
  signal: AbortSignal,
): Promise<ResultadoEnvio> {
  try {
    return parseCompletion(await respuesta.text(), proveedor, caracteresPeticion);
  } catch {
    return { ok: false, error: errorFromException(signal.aborted) };
  }
}

async function send(
  slot: ProviderSlot,
  dependencies: AdapterDependencies,
  peticion: ChatCompletionRequest,
  opciones: OpcionesEnvio,
): Promise<ResultadoEnvio> {
  if (opciones.signal.aborted) return { ok: false, error: errorFromException(true) };
  const cuerpo = JSON.stringify(peticion);
  let respuesta: Response;
  try {
    respuesta = await dependencies.fetch(
      `${slot.baseUrl}${RUTA_CHAT_COMPLETIONS}`,
      requestInit(slot, cuerpo, opciones.signal),
    );
  } catch {
    return { ok: false, error: errorFromException(opciones.signal.aborted) };
  }
  if (!respuesta.ok) {
    const retryAfter = respuesta.headers.get(CABECERA_HTTP.REINTENTAR_TRAS);
    await discardBody(respuesta);
    return { ok: false, error: errorFromStatus(respuesta.status, retryAfter) };
  }
  return readCompletion(respuesta, slot.provider, cuerpo.length, opciones.signal);
}

export function createOpenAICompatibleAdapter(
  slot: ProviderSlot,
  dependencies: AdapterDependencies,
): AdaptadorLlm {
  return {
    proveedor: slot.provider,
    modelo: slot.model,
    enviar: (mensajes, herramientas, opciones) =>
      send(
        slot,
        dependencies,
        buildRequest(slot, mensajes, herramientas, opciones.herramientasDesactivadas),
        opciones,
      ),
  };
}
