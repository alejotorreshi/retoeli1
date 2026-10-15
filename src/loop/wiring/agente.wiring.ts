import type { Reloj } from "@/application/types/puertos.type.ts";
import { CODIGO_AGENTE } from "@/config/constants/agent.constants.ts";
import { MAX_ISSUES_ARGS } from "@/config/constants/limits.constants.ts";
import { BACKOFF_BASE_MS, BACKOFF_TOPE_MS, ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import { MS_POR_MINUTO, ZONA_HORARIA_POR_DEFECTO } from "@/config/constants/runtime.constants.ts";
import {
  type AgentEnv,
  type ProviderSettings,
  parseAgentEnv,
  readAgentEnv,
  readToolEnv,
} from "@/config/env.ts";
import { MENSAJE_AGENTE, TEXTO_AGENTE } from "@/config/strings.ts";
import { formatearIssues } from "@/domain/utils/formatear-issues.util.ts";
import { clockFromToolEnv, systemClock } from "@/infra/clock/clock.adapter.ts";
import { sleepWithSignal } from "@/infra/clock/sleep.util.ts";
import { resolveRoot } from "@/infra/fixtures/fixtures-reader.adapter.ts";
import {
  createInstructionsLoader,
  DEFAULT_AGENT_DIRECTORY,
} from "@/infra/knowledge/instructions-loader.adapter.ts";
import { DEFAULT_KNOWLEDGE_DIRECTORY } from "@/infra/knowledge/rules-loader.adapter.ts";
import { createAuditLog } from "@/infra/logging/audit-log.adapter.ts";
import { createLogger } from "@/infra/logging/logger.adapter.ts";
import { createMemorySessionStore } from "@/infra/sessions/memory-session-store.adapter.ts";
import { createOpenAICompatibleAdapter } from "@/llm/adapters/openai-compatible.adapter.ts";
import { withFallback } from "@/llm/decorators/fallback.decorator.ts";
import { createHealthMonitor, withHealthReport } from "@/llm/decorators/health-report.decorator.ts";
import { withObservation } from "@/llm/decorators/observation.decorator.ts";
import { withRetry } from "@/llm/decorators/retry.decorator.ts";
import { withTimeout } from "@/llm/decorators/timeout.decorator.ts";
import type { AdaptadorLlm, ErrorLlm, OpcionesEnvio } from "@/llm/types/llm.type.ts";
import type { LlmHealthMonitor } from "@/llm/types/resilience.type.ts";
import { ejecutarTurno, sesionVacia } from "@/loop/services/ejecutar-turno.service.ts";
import { crearRegistroHerramientas } from "@/loop/services/registro-herramientas.service.ts";
import type { CreacionAgente, OpcionesAgente } from "@/loop/types/agente.type.ts";
import type { DependenciasTurno, Sesion } from "@/loop/types/turno.type.ts";
import * as proveedor from "@/tools/proveedor.ts";

function nuevoId(): string {
  return crypto.randomUUID();
}

function relojVigente(): Reloj {
  const config = readToolEnv();
  return config.success ? clockFromToolEnv(config.data) : systemClock(ZONA_HORARIA_POR_DEFECTO);
}

function relojCompartidoConHerramientas(): Reloj {
  return {
    hoy: () => relojVigente().hoy(),
    instanteReal: () => relojVigente().instanteReal(),
  };
}

function leerConfiguracion(opciones: OpcionesAgente) {
  return opciones.fuenteEntorno === undefined ? readAgentEnv() : parseAgentEnv(opciones.fuenteEntorno);
}

function resiliente(
  slot: ProviderSettings,
  apiKey: string,
  config: AgentEnv,
  opciones: OpcionesAgente,
): AdaptadorLlm {
  const base = createOpenAICompatibleAdapter({ ...slot, apiKey }, { fetch: opciones.fetch });
  return withRetry(withObservation(withTimeout(base, config.timeoutMs)), {
    maxRetries: config.maxRetries,
    baseMs: BACKOFF_BASE_MS,
    capMs: BACKOFF_TOPE_MS,
    wait: opciones.esperar ?? sleepWithSignal,
    random: Math.random,
  });
}

function respaldoDe(config: AgentEnv, opciones: OpcionesAgente): AdaptadorLlm | null {
  const { fallback } = config;
  if (fallback === null || fallback.apiKey === null) return null;
  return resiliente(fallback, fallback.apiKey, config, opciones);
}

function avisarCambio(error: ErrorLlm, envio: OpcionesEnvio): void {
  envio.observador?.cambio(error);
}

function modeloDelAgente(
  opciones: OpcionesAgente,
  config: AgentEnv,
  apiKey: string,
  monitor: LlmHealthMonitor,
): AdaptadorLlm {
  const primario = resiliente(config.primary, apiKey, config, opciones);
  return withHealthReport(withFallback(primario, respaldoDe(config, opciones), avisarCambio), monitor);
}

export function secretosDelAgente(config: AgentEnv): readonly string[] {
  const claves = [config.primary.apiKey, config.fallback?.apiKey ?? null];
  return claves.filter((clave): clave is string => clave !== null);
}

function bitacoraDe(opciones: OpcionesAgente, config: AgentEnv, secretos: readonly string[]) {
  const destino = opciones.destinoLogs === undefined ? {} : { destination: opciones.destinoLogs };
  return createLogger({ level: config.logLevel, secrets: secretos, ...destino });
}

function dependencias(
  opciones: OpcionesAgente,
  config: AgentEnv,
  apiKey: string,
  monitor: LlmHealthMonitor,
): DependenciasTurno {
  const reloj = relojCompartidoConHerramientas();
  const secretos = [...secretosDelAgente(config), ...(opciones.secretosAdicionales ?? [])];
  return {
    llm: modeloDelAgente(opciones, config, apiKey, monitor),
    herramientas: crearRegistroHerramientas(proveedor),
    instrucciones: createInstructionsLoader({
      agentDirectory: opciones.directorioAgente ?? DEFAULT_AGENT_DIRECTORY,
      knowledgeDirectory: opciones.directorioConocimiento ?? DEFAULT_KNOWLEDGE_DIRECTORY,
    }),
    sesiones: createMemorySessionStore<Sesion>({
      create: sesionVacia,
      newId: nuevoId,
      ttlMs: config.sessionTtlMinutes * MS_POR_MINUTO,
      maxSessions: config.maxSessions,
      now: () => Date.now(),
    }),
    reloj,
    registrar: createAuditLog(resolveRoot(opciones.directorio), reloj),
    directorio: opciones.directorio,
    maxIteraciones: config.maxIterations,
    presupuestoTokens: config.sessionTokenBudget,
    deadlineMs: config.turnDeadlineMs,
    bitacora: bitacoraDe(opciones, config, secretos),
    secretos,
    nuevoId,
  };
}

export function crearAgente(opciones: OpcionesAgente): CreacionAgente {
  const config = leerConfiguracion(opciones);
  if (!config.success) {
    const codigo = CODIGO_AGENTE.CONFIGURACION_LLM_INVALIDA;
    const detalle = formatearIssues(config.error.issues, MAX_ISSUES_ARGS);
    return { ok: false, codigo, mensaje: TEXTO_AGENTE.conDetalle(MENSAJE_AGENTE[codigo], detalle) };
  }
  const { primary } = config.data;
  if (primary.apiKey === null) {
    const codigo = CODIGO_AGENTE.PROVEEDOR_SIN_CLAVE;
    return { ok: false, codigo, mensaje: MENSAJE_AGENTE[codigo] };
  }
  const monitor = createHealthMonitor(ESTADO_LLM.DISPONIBLE);
  const deps = dependencias(opciones, config.data, primary.apiKey, monitor);
  return {
    ok: true,
    agente: {
      proveedor: primary.provider,
      modelo: primary.model,
      estadoLlm: () => monitor.current(),
      turno: (entrada) => ejecutarTurno(entrada, deps),
    },
  };
}
