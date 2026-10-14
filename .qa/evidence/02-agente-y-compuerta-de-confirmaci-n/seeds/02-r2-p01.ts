import { rm } from "node:fs/promises";
import { join } from "node:path";
import { ACCION } from "@/config/constants/agent.constants.ts";
import { DECISION_CONFIRMACION, ESTADO_COMPUERTA } from "@/config/constants/confirmation.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { abrirTurno } from "@/domain/policies/compuerta.policy.ts";
import { clasificarConfirmacion } from "@/domain/policies/confirmacion.policy.ts";
import {
  CO, EC, agente, armar, casosConEnvioSimulado, check, enviar, proyecto, resumen, simularDelCaso, texto, totales, ultimoParrafo,
} from "./qa.helper.ts";

pinExecutionDate(FECHA_DEMO);
const T = "P01";
const gate = (r: ReturnType<typeof resumen>) => (r.fin.needsConfirmation ? `PENDIENTE[${r.confs.map((c) => c.caso).join(",")}]` : "LIBRE");
const obs = (k: string, v: unknown) => console.log(`OBS ${k} ${JSON.stringify(v)}`);
const algunEnvioSinConfirmar: string[] = [];

for (const f of [
  "Consulta el valor del NIT de co-industrias-delta para tenerlo a mano",
  "No envíes nada todavía, ¿qué falta?",
  "no lo envíes aún, ¿puedes revisar el NIT?",
  "Procesa el caso co-industrias-delta para tenerlo listo",
  "Procesa co-industrias-delta, luego vemos el otro",
  "dame el NIT de ec-corp-andina, no el RUC",
  "mejor procesa pe-andes",
  "procesa el caso co-industrias-delta",
  "¿cuál es el NIT?",
  "No envíes nada todavía",
  "hola",
  "sí",
  "envía ec-corp-andina",
]) {
  obs("CLASIFICADOR", { frase: f, pendientes: [CO], decision: clasificarConfirmacion(f, [CO]).decision });
}
{
  const dos = { tipo: ESTADO_COMPUERTA.PENDIENTE, accion: ACCION.ENVIO, casos: [{ caso: EC, bloqueos: [], motivos: [] }, { caso: CO, bloqueos: [], motivos: [] }] } as const;
  const ap = abrirTurno(dos, { decision: DECISION_CONFIRMACION.RECHAZA });
  obs("WR-17 abrirTurno(dos pendientes, RECHAZA)", ap);
}

{
  const raiz = await proyecto("p01-wr16");
  const a = agente(raiz, [...armar(CO), texto("El NIT de co-industrias-delta está en el maestro (enmascarado)."), ...enviar("s-co", CO)]);
  const t1 = resumen(await a.turno(`procesa el caso ${CO}`));
  const t2 = resumen(await a.turno("Consulta el valor del NIT de co-industrias-delta para tenerlo a mano"));
  const t3 = resumen(await a.turno("sí"));
  const envios = await casosConEnvioSimulado(raiz);
  obs("WR-16", { t1: gate(t1), t2: { clasificador: clasificarConfirmacion("Consulta el valor del NIT de co-industrias-delta para tenerlo a mano", [CO]).decision, compuerta: gate(t2), cierre: t2.texto }, t3: { compuerta: gate(t3), simular: t3.simular, envios, cierre: t3.texto.slice(0, 200) } });
  if (envios.length > 0) algunEnvioSinConfirmar.push("WR-16");
}

{
  const raiz = await proyecto("p01-wr15");
  const a = agente(raiz, [...armar(EC), texto("Falta el certificado de cumplimiento tributario."), ...enviar("s-ec", EC)]);
  await a.turno(`procesa el caso ${EC}`);
  const t2 = resumen(await a.turno("No envíes nada todavía, ¿qué falta?"));
  const t3 = resumen(await a.turno("sí"));
  const envios = await casosConEnvioSimulado(raiz);
  obs("WR-15", { t2: { clasificador: clasificarConfirmacion("No envíes nada todavía, ¿qué falta?", [EC]).decision, compuerta: gate(t2), ultimoParrafo: ultimoParrafo(t2.texto) }, t3: { compuerta: gate(t3), simular: t3.simular, envios } });
  obs("WR-15 nota", "el 'sí' de t3 responde a la pregunta del servidor emitida en t2 (re-preguntada justo tras la negación)");
}

{
  const raiz = await proyecto("p01-wr17");
  const a = agente(raiz, [...armar(EC), ...armar(CO), texto("Entendido, no registro co-industrias-delta."), ...enviar("s-ec", EC)]);
  await a.turno(`procesa el caso ${EC}`);
  const t2 = resumen(await a.turno(`procesa el caso ${CO}`));
  const t3 = resumen(await a.turno("", { confirmacion: { aprobada: false, caso: CO } }));
  const t4 = resumen(await a.turno(`envía ${EC}`));
  const envios = await casosConEnvioSimulado(raiz);
  obs("WR-17", { t2: gate(t2), t3: { estructurada: { aprobada: false, caso: CO }, compuerta: gate(t3), cierre: t3.texto }, t4: { compuerta: gate(t4), simular: t4.simular, envios, cierre: ultimoParrafo(t4.texto).slice(0, 160) } });
}

{
  const raiz = await proyecto("p01-wr18");
  const a = agente(raiz, [...armar(EC), ...enviar("s1", EC, "No pude registrar el envío simulado."), ...enviar("s2", EC, "No pude registrar el envío simulado.")]);
  await a.turno(`procesa el caso ${EC}`);
  await rm(join(raiz, "out", EC, "paquete"), { recursive: true, force: true });
  const t2 = resumen(await a.turno("envía"));
  const t3 = resumen(await a.turno("sí"));
  obs("WR-18", { t2: { simular: t2.simular, compuerta: gate(t2), cierre: t2.texto }, t3: { simular: t3.simular, compuerta: gate(t3), envios: await casosConEnvioSimulado(raiz), log: await simularDelCaso(raiz, EC) } });
}

{
  const raiz = await proyecto("p01-wr03");
  const a = agente(raiz, [...armar(EC), texto("no debería llamarse"), texto("no debería llamarse"), ...enviar("s-ec", EC)], { AGENT_SESSION_TOKEN_BUDGET: "1200" });
  const t1 = resumen(await a.turno(`procesa el caso ${EC}`));
  const n1 = a.pedidos.length;
  const t2 = resumen(await a.turno("hola"));
  const n2 = a.pedidos.length;
  const t3 = resumen(await a.turno("sí"));
  const n3 = a.pedidos.length;
  const t4 = resumen(await a.turno("no envíes nada"));
  const envios = await casosConEnvioSimulado(raiz);
  obs("WR-03", {
    t1: { motivo: t1.fin.motivo, compuerta: gate(t1), llamadas: n1 },
    hola: { motivo: t2.fin.motivo, compuerta: gate(t2), llamadasProveedor: n2 - n1, cierre: t2.texto },
    si: { motivo: t3.fin.motivo, compuerta: gate(t3), llamadasProveedor: n3 - n2, simular: t3.simular, envios, ultimo: ultimoParrafo(t3.texto).slice(0, 120) },
    negacion: { motivo: t4.fin.motivo, compuerta: gate(t4) },
  });
}

check(T, "ningún camino envía sin confirmación explícita de un caso pendiente", algunEnvioSinConfirmar.length === 0, algunEnvioSinConfirmar);
totales();
