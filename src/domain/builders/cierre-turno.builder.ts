import { SEPARADOR_PARRAFOS } from "@/config/constants/agent.constants.ts";
import { ORDEN_FLUJO_HERRAMIENTAS } from "@/config/constants/tools.constants.ts";
import { TEXTO_CIERRE, TEXTO_CONFIRMACION } from "@/config/strings.ts";
import { motivosDeBloqueo } from "@/domain/builders/checklist.builder.ts";
import type { LlamadaResumida } from "@/domain/types/cierre-turno.type.ts";
import type { CasoPendiente } from "@/domain/types/compuerta.type.ts";

export function preguntaConfirmacion(pendientes: readonly CasoPendiente[]): string {
  const legibles = pendientes.map(({ caso, motivos }) => ({
    caso,
    bloqueos: motivosDeBloqueo({ motivos_bloqueo: motivos }),
  }));
  const [unico] = legibles;
  if (unico !== undefined && legibles.length === 1) {
    return TEXTO_CONFIRMACION.unCaso(unico.caso, unico.bloqueos);
  }
  return TEXTO_CONFIRMACION.variosCasos(legibles);
}

function exitosas(llamadas: readonly LlamadaResumida[]): readonly LlamadaResumida[] {
  return llamadas.filter((llamada) => llamada.ok);
}

function casosEnOrden(llamadas: readonly LlamadaResumida[]): readonly string[] {
  return [...new Set(exitosas(llamadas).flatMap(({ caso }) => (caso === null ? [] : [caso])))];
}

function siguientePaso(caso: string, llamadas: readonly LlamadaResumida[]): readonly string[] {
  const ultima = exitosas(llamadas)
    .filter((llamada) => llamada.caso === caso)
    .at(-1);
  if (ultima === undefined) return [];
  const siguiente = ORDEN_FLUJO_HERRAMIENTAS[ORDEN_FLUJO_HERRAMIENTAS.indexOf(ultima.herramienta) + 1];
  return siguiente === undefined ? [] : [TEXTO_CIERRE.siguientePaso[siguiente](caso)];
}

export function cierreDeterminista(llamadas: readonly LlamadaResumida[]): string {
  const resumenes = exitosas(llamadas).flatMap(({ resumen }) => (resumen === null ? [] : [resumen]));
  const pasos = casosEnOrden(llamadas).flatMap((caso) => siguientePaso(caso, llamadas));
  const partes = [
    ...(resumenes.length === 0 ? [] : [TEXTO_CIERRE.completado(resumenes)]),
    ...(pasos.length === 0 ? [] : [TEXTO_CIERRE.falta(pasos)]),
  ];
  return partes.length === 0 ? TEXTO_CIERRE.sinPasos : partes.join(SEPARADOR_PARRAFOS);
}
