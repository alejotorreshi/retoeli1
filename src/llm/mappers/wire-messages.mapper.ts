import {
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
  WireMessage,
  WireTool,
  WireToolCall,
} from "@/llm/types/provider.type.ts";

function toWireToolCall(llamada: LlamadaHerramienta): WireToolCall {
  return {
    id: llamada.id,
    type: TIPO_HERRAMIENTA_WIRE,
    function: { name: llamada.nombre, arguments: llamada.argumentos },
  };
}

function toWireAssistant(mensaje: MensajeAsistente, reasoningPassback: boolean): WireMessage {
  const toolCalls = mensaje.llamadas.length === 0 ? {} : { tool_calls: mensaje.llamadas.map(toWireToolCall) };
  const reasoning =
    reasoningPassback && mensaje.razonamiento !== null ? { reasoning_content: mensaje.razonamiento } : {};
  return { role: ROL_MENSAJE.ASISTENTE, content: mensaje.contenido ?? "", ...toolCalls, ...reasoning };
}

function toWireMessage(mensaje: Mensaje, reasoningPassback: boolean): WireMessage {
  switch (mensaje.rol) {
    case ROL_MENSAJE.SISTEMA:
    case ROL_MENSAJE.USUARIO:
      return { role: mensaje.rol, content: mensaje.contenido };
    case ROL_MENSAJE.ASISTENTE:
      return toWireAssistant(mensaje, reasoningPassback);
    case ROL_MENSAJE.HERRAMIENTA:
      return { role: ROL_MENSAJE.HERRAMIENTA, tool_call_id: mensaje.llamadaId, content: mensaje.contenido };
  }
}

export function toWireMessages(mensajes: readonly Mensaje[], reasoningPassback: boolean): WireMessage[] {
  return mensajes.map((mensaje) => toWireMessage(mensaje, reasoningPassback));
}

export function toWireTools(definiciones: readonly DefinicionHerramienta[]): WireTool[] {
  return definiciones.map((definicion) => ({
    type: TIPO_HERRAMIENTA_WIRE,
    function: {
      name: definicion.nombre,
      description: definicion.descripcion,
      parameters: definicion.parametros,
    },
  }));
}

function fromToolCall(llamada: ChatCompletionToolCall): LlamadaHerramienta {
  return { id: llamada.id, nombre: llamada.function.name, argumentos: llamada.function.arguments };
}

function tokensEstimados(caracteres: number): number {
  return Math.ceil(caracteres / CARACTERES_POR_TOKEN);
}

function caracteresDeSalida(
  contenido: string | null | undefined,
  llamadas: readonly LlamadaHerramienta[],
): number {
  return (contenido ?? "").length + llamadas.reduce((total, llamada) => total + llamada.argumentos.length, 0);
}

function usoDe(
  usage: ChatCompletionUsage | null | undefined,
  caracteresPeticion: number,
  caracteresRespuesta: number,
): Uso {
  if (usage === null || usage === undefined) {
    return {
      entrada: tokensEstimados(caracteresPeticion),
      salida: tokensEstimados(caracteresRespuesta),
      cacheHit: 0,
    };
  }
  return {
    entrada: usage.prompt_tokens,
    salida: usage.completion_tokens,
    cacheHit: usage.prompt_tokens_details?.cached_tokens ?? usage.prompt_cache_hit_tokens ?? 0,
  };
}

function finDe(finishReason: string | null | undefined, conLlamadas: boolean): FinLlm {
  if (finishReason === FINISH_REASON.LENGTH) return FIN_LLM.LIMITE;
  if (conLlamadas || finishReason === FINISH_REASON.TOOL_CALLS) return FIN_LLM.HERRAMIENTAS;
  return FIN_LLM.TEXTO;
}

function textoDe(contenido: string | null | undefined): string | null {
  return contenido === null || contenido === undefined || contenido === "" ? null : contenido;
}

export function fromChatCompletion(
  completion: ChatCompletion,
  proveedor: string,
  caracteresPeticion: number,
): ResultadoEnvio {
  const eleccion = completion.choices[0];
  if (eleccion === undefined) return { ok: false, error: invalidResponseError() };
  const errorDeFin = errorFromFinishReason(eleccion.finish_reason);
  if (errorDeFin !== null) return { ok: false, error: errorDeFin };
  const llamadas = (eleccion.message.tool_calls ?? []).map(fromToolCall);
  return {
    ok: true,
    respuesta: {
      texto: textoDe(eleccion.message.content),
      llamadas,
      uso: usoDe(
        completion.usage,
        caracteresPeticion,
        caracteresDeSalida(eleccion.message.content, llamadas),
      ),
      razonamiento: eleccion.message.reasoning_content ?? null,
      fin: finDe(eleccion.finish_reason, llamadas.length > 0),
      proveedor,
      modelo: completion.model,
    },
  };
}
