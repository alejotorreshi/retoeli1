import type { BitacoraEstructurada } from "@/application/types/puertos-agente.type.ts";
import { EVENTO_BITACORA } from "@/config/constants/agent.constants.ts";
import type { LlamadaHerramienta, ObservadorLlm, RespuestaLlm } from "@/llm/types/llm.type.ts";
import { casoDeLlamada } from "@/loop/services/despacho-llamada.service.ts";
import type { PaquetesConocidos, ResultadoDespacho } from "@/loop/types/turno.type.ts";

export function bitacoraDelTurno(
  bitacora: BitacoraEstructurada,
  sesionId: string,
  turnoId: string,
): BitacoraEstructurada {
  return bitacora.hijo({ sesionId }).hijo({ turnoId });
}

export function observadorDelTurno(bitacora: BitacoraEstructurada): ObservadorLlm {
  return {
    fallo: ({ proveedor, modelo, duracionMs, error }) =>
      bitacora.advertir(EVENTO_BITACORA.ERROR_LLM, {
        proveedor,
        modelo,
        duracionMs,
        tipo: error.tipo,
        estado: error.estado,
      }),
    cambio: (error) =>
      bitacora.advertir(EVENTO_BITACORA.CAMBIO_PROVEEDOR, { tipo: error.tipo, estado: error.estado }),
  };
}

export function anotarLlamadaLlm(
  bitacora: BitacoraEstructurada,
  respuesta: RespuestaLlm,
  duracionMs: number,
): void {
  bitacora.info(EVENTO_BITACORA.LLAMADA_LLM, {
    proveedor: respuesta.proveedor,
    modelo: respuesta.modelo,
    duracionMs,
    ...respuesta.uso,
    fin: respuesta.fin,
    llamadas: respuesta.llamadas.length,
  });
}

function casoConocido(llamada: LlamadaHerramienta, conocidos: PaquetesConocidos): string | null {
  const caso = casoDeLlamada(llamada);
  return caso !== null && Object.hasOwn(conocidos, caso) ? caso : null;
}

export function anotarHerramienta(
  bitacora: BitacoraEstructurada,
  llamada: LlamadaHerramienta,
  despacho: ResultadoDespacho,
  conocidos: PaquetesConocidos,
  duracionMs: number,
): void {
  const hija = bitacora.hijo({ llamadaId: llamada.id, herramienta: llamada.nombre });
  const { ok, codigo } = despacho.resultado;
  hija.info(EVENTO_BITACORA.HERRAMIENTA, { ok, codigo, duracionMs });
  if (despacho.envioPermitido === null) return;
  const caso = casoConocido(llamada, conocidos);
  if (despacho.envioPermitido) hija.info(EVENTO_BITACORA.COMPUERTA_PERMISO, { caso });
  else hija.advertir(EVENTO_BITACORA.COMPUERTA_BLOQUEO, { caso });
}
