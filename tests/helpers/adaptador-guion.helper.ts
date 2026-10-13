import type { AdaptadorGuion, PasoGuion } from "@tests/helpers/types/adaptador-guion.type.ts";
import { FIN_LLM, TIPOS_ERROR_LLM_REINTENTABLES } from "@/config/constants/llm.constants.ts";
import type { OpcionesEnvio, ResultadoEnvio, TipoErrorLlm } from "@/llm/types/llm.type.ts";

export const PROVEEDOR_PRIMARIO = "primario";
export const MODELO_PRIMARIO = "modelo-primario";
export const PROVEEDOR_RESPALDO = "respaldo";
export const MODELO_RESPALDO = "modelo-respaldo";

export function exito(proveedor = PROVEEDOR_PRIMARIO, modelo = MODELO_PRIMARIO): ResultadoEnvio {
  return {
    ok: true,
    respuesta: {
      texto: "listo",
      llamadas: [],
      uso: { entrada: 1, salida: 1, cacheHit: 0 },
      razonamiento: null,
      fin: FIN_LLM.TEXTO,
      proveedor,
      modelo,
    },
  };
}

export function falla(tipo: TipoErrorLlm, reintentarTrasMs: number | null = null): ResultadoEnvio {
  return {
    ok: false,
    error: { tipo, reintentable: TIPOS_ERROR_LLM_REINTENTABLES.has(tipo), estado: null, reintentarTrasMs },
  };
}

function pasoFijo(resultado: ResultadoEnvio): PasoGuion {
  return async () => resultado;
}

export function crearAdaptadorGuion(
  guion: readonly (ResultadoEnvio | PasoGuion)[],
  proveedor = PROVEEDOR_PRIMARIO,
  modelo = MODELO_PRIMARIO,
): AdaptadorGuion {
  const llamadas: OpcionesEnvio[] = [];
  const pasos = guion.map((paso) => (typeof paso === "function" ? paso : pasoFijo(paso)));
  return {
    proveedor,
    modelo,
    llamadas,
    enviar: async (_mensajes, _herramientas, opciones) => {
      const paso = pasos[Math.min(llamadas.length, pasos.length - 1)];
      llamadas.push(opciones);
      if (paso === undefined) throw new Error("guion vacío");
      return paso(opciones);
    },
  };
}

export function opcionesCon(signal: AbortSignal = new AbortController().signal): OpcionesEnvio {
  return { signal, herramientasDesactivadas: false };
}
