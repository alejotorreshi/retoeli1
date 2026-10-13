import {
  ARGUMENTOS_VACIOS,
  CARACTERES_POR_TOKEN,
  FIN_LLM,
  FINISH_REASON,
  ROL_MENSAJE,
  TIPO_HERRAMIENTA_WIRE,
} from "@/config/constants/llm.constants.ts";
import { errorFromFinishReason, invalidResponseError } from "@/llm/mappers/provider-error.mapper.ts";
import type {
  DefinicionHerramienta,
  FinLlm,
  LlamadaHerramienta,
  Mensaje,
  MensajeAsistente,
  ResultadoEnvio,
  Uso,
} from "@/llm/types/llm.type.ts";
import type {
  ChatCompletion,
  ChatCompletionToolCall,
  ChatCompletionUsage,
  ParsedJson,
  WireMessage,
  WireTool,
  WireToolCall,
} from "@/llm/types/provider.type.ts";

export function parseJson(text: string): ParsedJson {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

function isJsonObject(text: string): boolean {
  const parsed = parseJson(text);
  return (
    parsed.ok && typeof parsed.value === "object" && parsed.value !== null && !Array.isArray(parsed.value)
  );
}

function toWireToolCall(call: LlamadaHerramienta): WireToolCall {
  const args = isJsonObject(call.argumentos) ? call.argumentos : ARGUMENTOS_VACIOS;
  return {
    id: call.id,
    type: TIPO_HERRAMIENTA_WIRE,
    function: { name: call.nombre, arguments: args },
  };
}

function toWireAssistant(message: MensajeAsistente, reasoningPassback: boolean): WireMessage {
  const toolCalls = message.llamadas.length === 0 ? {} : { tool_calls: message.llamadas.map(toWireToolCall) };
  const reasoning =
    reasoningPassback && message.razonamiento !== null ? { reasoning_content: message.razonamiento } : {};
  return { role: ROL_MENSAJE.ASISTENTE, content: message.contenido ?? "", ...toolCalls, ...reasoning };
}

function toWireMessage(message: Mensaje, reasoningPassback: boolean): WireMessage {
  switch (message.rol) {
    case ROL_MENSAJE.SISTEMA:
    case ROL_MENSAJE.USUARIO:
      return { role: message.rol, content: message.contenido };
    case ROL_MENSAJE.ASISTENTE:
      return toWireAssistant(message, reasoningPassback);
    case ROL_MENSAJE.HERRAMIENTA:
      return { role: ROL_MENSAJE.HERRAMIENTA, tool_call_id: message.llamadaId, content: message.contenido };
  }
}

export function toWireMessages(messages: readonly Mensaje[], reasoningPassback: boolean): WireMessage[] {
  return messages.map((message) => toWireMessage(message, reasoningPassback));
}

export function toWireTools(definitions: readonly DefinicionHerramienta[]): WireTool[] {
  return definitions.map((definition) => ({
    type: TIPO_HERRAMIENTA_WIRE,
    function: {
      name: definition.nombre,
      description: definition.descripcion,
      parameters: definition.parametros,
    },
  }));
}

function fromToolCall(call: ChatCompletionToolCall): LlamadaHerramienta {
  return { id: call.id, nombre: call.function.name, argumentos: call.function.arguments };
}

function estimatedTokens(characters: number): number {
  return Math.ceil(characters / CARACTERES_POR_TOKEN);
}

function outputCharacters(content: string | null | undefined, calls: readonly LlamadaHerramienta[]): number {
  return (content ?? "").length + calls.reduce((total, call) => total + call.argumentos.length, 0);
}

function usageFrom(
  usage: ChatCompletionUsage | null | undefined,
  requestCharacters: number,
  responseCharacters: number,
): Uso {
  if (usage === null || usage === undefined) {
    return {
      entrada: estimatedTokens(requestCharacters),
      salida: estimatedTokens(responseCharacters),
      cacheHit: 0,
    };
  }
  return {
    entrada: usage.prompt_tokens,
    salida: usage.completion_tokens,
    cacheHit: usage.prompt_tokens_details?.cached_tokens ?? usage.prompt_cache_hit_tokens ?? 0,
  };
}

function finishFrom(finishReason: string | null | undefined, hasToolCalls: boolean): FinLlm {
  if (finishReason === FINISH_REASON.LENGTH) return FIN_LLM.LIMITE;
  if (hasToolCalls || finishReason === FINISH_REASON.TOOL_CALLS) return FIN_LLM.HERRAMIENTAS;
  return FIN_LLM.TEXTO;
}

function textFrom(content: string | null | undefined): string | null {
  return content === null || content === undefined || content === "" ? null : content;
}

export function fromChatCompletion(
  completion: ChatCompletion,
  provider: string,
  requestCharacters: number,
): ResultadoEnvio {
  const choice = completion.choices[0];
  if (choice === undefined) return { ok: false, error: invalidResponseError() };
  const finishError = errorFromFinishReason(choice.finish_reason);
  if (finishError !== null) return { ok: false, error: finishError };
  const calls = (choice.message.tool_calls ?? []).map(fromToolCall);
  return {
    ok: true,
    respuesta: {
      texto: textFrom(choice.message.content),
      llamadas: calls,
      uso: usageFrom(completion.usage, requestCharacters, outputCharacters(choice.message.content, calls)),
      razonamiento: choice.message.reasoning_content ?? null,
      fin: finishFrom(choice.finish_reason, calls.length > 0),
      proveedor: provider,
      modelo: completion.model,
    },
  };
}
