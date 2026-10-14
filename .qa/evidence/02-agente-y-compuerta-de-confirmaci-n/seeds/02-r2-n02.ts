import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import {
  CO, EC, agente, armar, casosConEnvioSimulado, check, enviar, proyecto, resumen, simularDelCaso, texto, totales, ultimoParrafo,
} from "./qa.helper.ts";

pinExecutionDate(FECHA_DEMO);
const T = "N02";
const BLOQ = JSON.stringify([{ ok: false, codigo: "CONFIRMACION_REQUERIDA" }]);
const OK1 = JSON.stringify([{ ok: true, codigo: null }]);

for (const variante of ["texto", "desobediente"] as const) {
  const raiz = await proyecto(`n02-a-${variante}`);
  const turnoSi = variante === "texto" ? [texto("Hay dos paquetes pendientes.")] : enviar("simular-x", EC);
  const a = agente(raiz, [...armar(EC), ...armar(CO), ...turnoSi, ...enviar("simular-co", CO)]);
  await a.turno(`procesa el caso ${EC}`);
  const t2 = resumen(await a.turno(`procesa el caso ${CO}`));
  const preg = ultimoParrafo(t2.texto);
  check(T, `(a/${variante}) ambos pendientes y la pregunta nombra los dos`, JSON.stringify(t2.confs.map((c) => c.caso).sort()) === JSON.stringify([CO, EC]) && t2.texto.includes(EC) && t2.texto.includes(CO) && t2.fin.needsConfirmation, { confs: t2.confs.map((c) => c.caso), cierre: t2.texto.slice(-260) });
  const t3 = resumen(await a.turno("sí"));
  check(T, `(a/${variante}) 'sí' a secas no envía (falta_caso)`, (await casosConEnvioSimulado(raiz)).length === 0 && (variante === "texto" ? t3.simular.length === 0 : JSON.stringify(t3.simular) === BLOQ), { simular: t3.simular });
  check(T, `(a/${variante}) tras 'sí' siguen los dos pendientes`, t3.confs.length === 2 && t3.fin.needsConfirmation, t3.confs.map((c) => c.caso));
  const t4 = resumen(await a.turno(`envía ${CO}`));
  check(T, `(a/${variante}) 'envía ${CO}' envía solo co`, JSON.stringify(t4.simular) === OK1 && JSON.stringify(await casosConEnvioSimulado(raiz)) === JSON.stringify([CO]), { simular: t4.simular, envios: await casosConEnvioSimulado(raiz) });
  check(T, `(a/${variante}) ec sigue pendiente tras enviar co`, JSON.stringify(t4.confs.map((c) => c.caso)) === JSON.stringify([EC]) && t4.fin.needsConfirmation, t4.confs.map((c) => c.caso));
  if (variante === "texto") console.log("INFO (a) pregunta varios casos (t2 ultimo bloque):", JSON.stringify(t2.texto.slice(t2.texto.lastIndexOf("Quedaron"))).slice(0, 400), "| preg ultimo parrafo:", JSON.stringify(preg).slice(0, 200));
}

{
  const raiz = await proyecto("n02-b");
  const a = agente(raiz, [...armar(EC), ...enviar("simular-1", EC)]);
  await a.turno(`procesa el caso ${EC}`);
  const n = a.pedidos.length;
  const t2 = resumen(await a.turnoAbortado("ok"));
  check(T, "(b) turno abortado: motivo abortado, needsConfirmation false, sin confirmation_required", t2.fin.motivo === "abortado" || t2.fin.motivo === "aborted" ? t2.fin.needsConfirmation === false && t2.confs.length === 0 : t2.fin.needsConfirmation === false && t2.confs.length === 0, { fin: t2.fin, llamadasProveedor: a.pedidos.length - n });
  const t3 = resumen(await a.turno("sí"));
  check(T, "(b) 'sí' tras aborto no envía (compuerta LIBRE)", JSON.stringify(t3.simular) === BLOQ && (await casosConEnvioSimulado(raiz)).length === 0, t3.simular);
}

{
  const raiz = await proyecto("n02-c");
  const a = agente(raiz, [...armar(EC), ...enviar("simular-2", EC)]);
  await a.turno(`procesa el caso ${EC}`);
  const t2 = resumen(await a.turno("ok"));
  const lineas = await simularDelCaso(raiz, EC);
  check(T, "(c) 'ok' + simular desobediente -> CONFIRMACION_REQUERIDA", JSON.stringify(t2.simular) === BLOQ, t2.simular);
  check(T, "(c) nada escrito (sin ENVIO-SIMULADO.md, sin linea ok)", (await casosConEnvioSimulado(raiz)).length === 0 && lineas.every((l) => !l.ok), lineas);
  check(T, "(c) ec sigue pendiente y re-pregunta el servidor", t2.fin.needsConfirmation && t2.confs.length === 1, { fin: t2.fin.needsConfirmation, ultimo: ultimoParrafo(t2.texto).slice(0, 80) });
}
totales();
