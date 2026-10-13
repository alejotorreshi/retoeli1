import { bitacoraMuda } from "@tests/helpers/bitacora.helper.ts";
import { crearLlmFalso } from "@tests/helpers/llm-falso.helper.ts";
import type {
  AgentePrueba,
  ExtraTurno,
  OpcionesAgentePrueba,
} from "@tests/helpers/types/agente-prueba.type.ts";
import {
  DEADLINE_TURNO_MS_POR_DEFECTO,
  MAX_ITERACIONES_POR_DEFECTO,
  PRESUPUESTO_TOKENS_SESION_POR_DEFECTO,
  TIPO_EVENTO,
} from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { fixedClock } from "@/infra/clock/clock.adapter.ts";
import { createInstructionsLoader } from "@/infra/knowledge/instructions-loader.adapter.ts";
import { createAuditLog } from "@/infra/logging/audit-log.adapter.ts";
import { createMemorySessionStore } from "@/infra/sessions/memory-session-store.adapter.ts";
import { ejecutarTurno, sesionVacia } from "@/loop/services/ejecutar-turno.service.ts";
import { crearRegistroHerramientas } from "@/loop/services/registro-herramientas.service.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";
import type { DependenciasTurno, Sesion } from "@/loop/types/turno.type.ts";
import * as proveedor from "@/tools/proveedor.ts";

const TTL_PRUEBA_MS = 60_000;
const MAX_SESIONES_PRUEBA = 10;

async function recoger(eventos: AsyncIterable<EventoAgente>): Promise<EventoAgente[]> {
  const recogidos: EventoAgente[] = [];
  for await (const evento of eventos) recogidos.push(evento);
  return recogidos;
}

function sesionDe(eventos: readonly EventoAgente[]): string {
  const inicio = eventos[0];
  if (inicio?.tipo !== TIPO_EVENTO.INICIO_TURNO) throw new Error("falta turn_start");
  return inicio.sesionId;
}

export function crearAgentePrueba(opciones: OpcionesAgentePrueba): AgentePrueba {
  const { raiz, guion, ...sobrescritas } = opciones;
  const llm = crearLlmFalso(guion);
  const reloj = fixedClock(FECHA_DEMO);
  const nuevoId = () => crypto.randomUUID();
  const deps: DependenciasTurno = {
    llm,
    herramientas: crearRegistroHerramientas(proveedor),
    instrucciones: createInstructionsLoader(),
    sesiones: createMemorySessionStore<Sesion>({
      create: sesionVacia,
      newId: nuevoId,
      ttlMs: TTL_PRUEBA_MS,
      maxSessions: MAX_SESIONES_PRUEBA,
      now: () => Date.now(),
    }),
    reloj,
    directorio: raiz,
    maxIteraciones: MAX_ITERACIONES_POR_DEFECTO,
    presupuestoTokens: PRESUPUESTO_TOKENS_SESION_POR_DEFECTO,
    deadlineMs: DEADLINE_TURNO_MS_POR_DEFECTO,
    bitacora: bitacoraMuda(),
    secretos: [],
    nuevoId,
    registrar: createAuditLog(raiz, reloj),
    ...sobrescritas,
  };
  let sesionId: string | null = null;
  return {
    llm,
    async turno(mensaje: string, extra: ExtraTurno = {}) {
      const eventos = await recoger(ejecutarTurno({ ...extra, sesionId, mensaje }, deps));
      sesionId = sesionDe(eventos);
      return eventos;
    },
    async *iniciar(mensaje: string, extra: ExtraTurno = {}) {
      for await (const evento of ejecutarTurno({ ...extra, sesionId, mensaje }, deps)) {
        if (evento.tipo === TIPO_EVENTO.INICIO_TURNO) sesionId = evento.sesionId;
        yield evento;
      }
    },
    sesionActual() {
      if (sesionId === null) throw new Error("todavía no hay sesión");
      return deps.sesiones.abrir(sesionId).sesion;
    },
  };
}
