import { FINES_DE_ORACION } from "@/config/constants/confirmation.constants.ts";
import { PATRON_PREGUNTA } from "@/config/constants/patterns.constants.ts";
import { SALTO_DE_LINEA, SEPARADOR_PARRAFOS } from "@/config/constants/text.constants.ts";
import { ORDEN_FLUJO_HERRAMIENTAS } from "@/config/constants/tools.constants.ts";
import { TEXTO_CIERRE, TEXTO_CONFIRMACION } from "@/config/strings.ts";
import { motivosDeBloqueo } from "@/domain/builders/checklist.builder.ts";
import type { LlamadaResumida } from "@/domain/types/cierre-turno.type.ts";
import type { CasoPendiente } from "@/domain/types/compuerta.type.ts";

function preguntaConfirmacion(pendientes: readonly CasoPendiente[]): string {
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

function corteEnFinDeOracion(linea: string, pregunta: number): number | null {
  const cortes = FINES_DE_ORACION.flatMap((fin) => {
    const inicio = linea.lastIndexOf(fin, pregunta - fin.length);
    return inicio < 0 ? [] : [inicio + fin.trimEnd().length];
  });
  return cortes.length === 0 ? null : Math.max(...cortes);
}

function sinPreguntaFinal(texto: string): string {
  const lineas = texto.trimEnd().split(SALTO_DE_LINEA);
  for (let ultima = lineas.pop(); ultima !== undefined; ultima = lineas.pop()) {
    if (ultima.trim() === "") continue;
    const pregunta = ultima.search(PATRON_PREGUNTA);
    if (pregunta < 0) {
      lineas.push(ultima);
      break;
    }
    const corte = corteEnFinDeOracion(ultima, pregunta);
    if (corte !== null) {
      lineas.push(ultima.slice(0, corte).trim());
      break;
    }
  }
  return lineas.join(SALTO_DE_LINEA).trimEnd();
}

export function cierreConPregunta(texto: string, pendientes: readonly CasoPendiente[]): string {
  if (pendientes.length === 0) return texto;
  const pregunta = preguntaConfirmacion(pendientes);
  const previo = sinPreguntaFinal(texto);
  return previo === "" ? pregunta : `${previo}${SEPARADOR_PARRAFOS}${pregunta}`;
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
