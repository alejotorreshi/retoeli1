import { recoger, sesionDe } from "@tests/helpers/eventos.helper.ts";
import type { AgenteFetch, OpcionesAgenteFetch } from "@tests/helpers/types/agente-fetch.type.ts";
import { NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import { crearAgente } from "@/loop/wiring/agente.wiring.ts";

export const CLAVE_PRUEBA = "clave-de-prueba-Zq9X";
export const MARCA_CLAVE = "Zq9X";

export function crearAgenteFetch(opciones: OpcionesAgenteFetch): AgenteFetch {
  const esperas: number[] = [];
  const creacion = crearAgente({
    directorio: opciones.raiz,
    fetch: opciones.fetch,
    fuenteEntorno: { LLM_API_KEY: CLAVE_PRUEBA, LOG_LEVEL: NIVELES_LOG.SILENCIO, ...opciones.entorno },
    esperar: async (ms) => {
      esperas.push(ms);
    },
    ...(opciones.destinoLogs === undefined ? {} : { destinoLogs: opciones.destinoLogs }),
  });
  if (!creacion.ok) throw new Error(creacion.mensaje);
  const { agente } = creacion;
  let sesionId: string | null = null;
  return {
    agente,
    esperas,
    async turno(mensaje) {
      const eventos = await recoger(agente.turno({ sesionId, mensaje }));
      sesionId = sesionDe(eventos);
      return eventos;
    },
  };
}
