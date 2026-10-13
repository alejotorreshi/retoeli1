import { errorFromException } from "@/llm/mappers/provider-error.mapper.ts";
import type {
  AdaptadorLlm,
  DefinicionHerramienta,
  ErrorLlm,
  Mensaje,
  OpcionesEnvio,
  ResultadoEnvio,
} from "@/llm/types/llm.type.ts";
import type { RetryOptions } from "@/llm/types/resilience.type.ts";

const ABORTED: ResultadoEnvio = { ok: false, error: errorFromException(true) };

function delayFor(error: ErrorLlm, attempt: number, retry: RetryOptions): number {
  const exponential = Math.min(retry.capMs, retry.baseMs * 2 ** attempt);
  return Math.min(retry.capMs, error.reintentarTrasMs ?? retry.random() * exponential);
}

async function waitUnlessAborted(ms: number, retry: RetryOptions, signal: AbortSignal): Promise<boolean> {
  try {
    await retry.wait(ms, signal);
  } catch {
    return false;
  }
  return !signal.aborted;
}

export function withRetry(base: AdaptadorLlm, retry: RetryOptions): AdaptadorLlm {
  async function sendWithRetries(
    messages: readonly Mensaje[],
    tools: readonly DefinicionHerramienta[],
    options: OpcionesEnvio,
  ): Promise<ResultadoEnvio> {
    let result = await base.enviar(messages, tools, options);
    for (let attempt = 0; attempt < retry.maxRetries; attempt += 1) {
      if (result.ok || !result.error.reintentable) return result;
      if (options.signal.aborted) return ABORTED;
      const delay = delayFor(result.error, attempt, retry);
      if (!(await waitUnlessAborted(delay, retry, options.signal))) return ABORTED;
      result = await base.enviar(messages, tools, options);
    }
    return result;
  }
  return { proveedor: base.proveedor, modelo: base.modelo, enviar: sendWithRetries };
}
