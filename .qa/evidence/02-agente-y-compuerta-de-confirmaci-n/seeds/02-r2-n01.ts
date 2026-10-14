import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import {
  EC, agente, armar, casosConEnvioSimulado, check, enviar, herr, proyecto, resumen, simularDelCaso, texto, totales, ultimoParrafo,
} from "./qa.helper.ts";

pinExecutionDate(FECHA_DEMO);
const T = "N01";
const turno1 = [herr("leer-ec", "LEER_SOLICITUD", { caso: EC }), ...armar(EC, "Armé el paquete. Estado: BLOQUEADO.")];
const ACUSE = "Entendido.";

for (const frase of ["ok", "listo", "si por favor", "si gracias", `si ${EC}`]) {
  const raiz = await proyecto(`n01-${frase.replace(/\W+/g, "_")}`);
  const a = agente(raiz, [...turno1, texto(ACUSE), ...enviar("simular-2", EC)]);
  const t1 = resumen(await a.turno(`procesa el caso ${EC}`));
  const pregunta = ultimoParrafo(t1.texto);
  check(T, `[${frase}] t1 pendiente`, t1.fin.needsConfirmation === true && t1.confs.length === 1, t1.confs);
  const n1 = a.pedidos.length;
  const t2 = resumen(await a.turno(frase));
  const extraQ = (t2.texto.slice(0, t2.texto.length - pregunta.length).match(/¿/g) ?? []).length;
  check(T, `[${frase}] t2 needsConfirmation true`, t2.fin.needsConfirmation === true, t2.fin);
  check(T, `[${frase}] t2 una confirmation_required ec con bloqueos`, t2.confs.length === 1 && t2.confs[0]?.caso === EC && (t2.confs[0]?.bloqueos.length ?? 0) > 0, t2.confs);
  check(T, `[${frase}] t2 ultimo parrafo = pregunta del servidor`, ultimoParrafo(t2.texto) === pregunta, ultimoParrafo(t2.texto).slice(0, 90));
  check(T, `[${frase}] t2 sin '¿' extra del modelo`, extraQ === 0, `extra=${extraQ}`);
  check(T, `[${frase}] t2 sin herramientas y 1 llamada al proveedor`, t2.simular.length === 0 && a.pedidos.length - n1 === 1, `llamadas=${a.pedidos.length - n1}`);
  check(T, `[${frase}] t2 sin ENVIO-SIMULADO.md`, (await casosConEnvioSimulado(raiz)).length === 0);
  const t3 = resumen(await a.turno("sí"));
  const envios = await casosConEnvioSimulado(raiz);
  const oks = (await simularDelCaso(raiz, EC)).filter((l) => l.ok).length;
  check(T, `[${frase}] t3 envía una vez`, JSON.stringify(t3.simular) === JSON.stringify([{ ok: true, codigo: null }]) && JSON.stringify(envios) === JSON.stringify([EC]) && oks === 1, { simular: t3.simular, envios, oks });
  check(T, `[${frase}] t3 needsConfirmation false`, t3.fin.needsConfirmation === false, t3.fin);
}

{
  const raiz = await proyecto("n01-control");
  const a = agente(raiz, [...turno1, texto("Entendido, no envío nada."), ...enviar("simular-2", EC)]);
  await a.turno(`procesa el caso ${EC}`);
  const t2 = resumen(await a.turno("no envíes nada"));
  check(T, "[control] 'no envíes nada' cierra sin pendiente", t2.fin.needsConfirmation === false && t2.confs.length === 0, { fin: t2.fin, texto: t2.texto });
  const t3 = resumen(await a.turno("sí"));
  check(T, "[control] 'sí' posterior bloqueado CONFIRMACION_REQUERIDA", JSON.stringify(t3.simular) === JSON.stringify([{ ok: false, codigo: "CONFIRMACION_REQUERIDA" }]) && (await casosConEnvioSimulado(raiz)).length === 0, t3.simular);
  console.log("INFO [N01] [control] t3 (fuera del contrato): blocked send re-asks", JSON.stringify({ needsConfirmation: t3.fin.needsConfirmation, confs: t3.confs.map((c) => c.caso), ultimo: ultimoParrafo(t3.texto).slice(0, 80) }));
}
totales();
