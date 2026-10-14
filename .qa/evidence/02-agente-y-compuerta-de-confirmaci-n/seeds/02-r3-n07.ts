import { DECISION_CONFIRMACION } from "@/config/constants/confirmation.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { clasificarConfirmacion } from "@/domain/policies/confirmacion.policy.ts";
import {
  CO, EC, agente, armar, casosConEnvioSimulado, check, enviar, herr, proyecto, resumen, simularDelCaso, texto, totales, ultimoParrafo,
} from "./qa.helper.ts";

pinExecutionDate(FECHA_DEMO);
const T = "N07";
const R = DECISION_CONFIRMACION.RECHAZA;
const O = DECISION_CONFIRMACION.OTRO;
const UNO = [EC];
const DOS = [EC, CO];
type Esperado = { uno: string | null; dos: string | null; fuente: string };

const tabla: [string, Esperado][] = [
  ["no, envía ec-corp-andina", { uno: R, dos: R, fuente: "02-24 HV2 item 1 / 02-VERIFICATION HV2" }],
  ["no confirmo porque el NIT está mal", { uno: R, dos: R, fuente: "02-24 HV2 item 2" }],
  ["no confirmo el NIT porque está mal", { uno: O, dos: O, fuente: "02-24 HV2 item 2" }],
  ["No, el de ec-corp-andina", { uno: R, dos: R, fuente: "02-24 HV2 item 3 (user-approved flip)" }],
  ["No, el de co-industrias-delta", { uno: null, dos: R, fuente: "02-24 HV2 item 3 (DOS only)" }],
  ["No, consulta el NIT de co-industrias-delta", { uno: null, dos: O, fuente: "02-24 HV2 item 4 (DOS only)" }],
  ["No, procesa ec-corp-andina", { uno: O, dos: O, fuente: "02-24 HV2 item 4 / 02-VERIFICATION HV2" }],
  ["No, por favor consulta el NIT de ec-corp-andina", { uno: R, dos: R, fuente: "FILAS_D6311 / 02-VERIFICATION HV2 (D-63.11)" }],
  ["Todavía no. Por favor revisa el NIT de ec-corp-andina.", { uno: R, dos: R, fuente: "FILAS_D6311" }],
  ["Todavía no, pero dame el NIT de ec-corp-andina", { uno: R, dos: R, fuente: "FILAS_D6311" }],
  ["No, quiero el NIT de ec-corp-andina", { uno: R, dos: R, fuente: "FILAS_D6311" }],
  ["No, envíame el NIT de ec-corp-andina", { uno: R, dos: null, fuente: "FILAS_D6311 (UNO only)" }],
  ["No, mejor procesa ec-corp-andina", { uno: R, dos: null, fuente: "FILAS_D6311 (UNO only)" }],
  ["detente, procesa ec-corp-andina", { uno: R, dos: null, fuente: "FILAS_D6311 (UNO only)" }],
  ["No, ahora consulta el NIT de co-industrias-delta", { uno: O, dos: R, fuente: "FILAS_D6311" }],
  ["No, consulta el NIT de ec-corp-andina", { uno: O, dos: O, fuente: "FILAS_D6311 (DOS) / D-63.11 text (both)" }],
  ["Espera, procesa ec-corp-andina", { uno: O, dos: null, fuente: "FILAS_D6311 (UNO only)" }],
  ["Todavía no, consulta el NIT de ec-corp-andina", { uno: O, dos: null, fuente: "FILAS_D6311 (UNO only)" }],
  ["No envíes nada todavía, ¿qué falta?", { uno: R, dos: R, fuente: "02-VERIFICATION D5 item (session 3 cancels; WR-15 closed by 02-22)" }],
];

console.log("TABLE | frase | UNO=[ec] | DOS=[ec,co] | declared UNO | declared DOS | source");
for (const [frase, e] of tabla) {
  const d1 = clasificarConfirmacion(frase, UNO).decision;
  const d2 = clasificarConfirmacion(frase, DOS).decision;
  console.log(`TABLE | ${frase} | ${d1} | ${d2} | ${e.uno ?? "(undeclared)"} | ${e.dos ?? "(undeclared)"} | ${e.fuente}`);
  if (e.uno !== null) check(T, `clasificador UNO "${frase}" = ${e.uno}`, d1 === e.uno, d1);
  if (e.dos !== null) check(T, `clasificador DOS "${frase}" = ${e.dos}`, d2 === e.dos, d2);
}

const MENSAJE_PRD_11 =
  'Procesa el caso "ec-corp-andina". Dime qué campos quedaron llenos, cuáles faltan, si el paquete está listo para firma y qué soportes debo actualizar. No envíes nada todavía.';
const turno1 = [herr("leer-ec", "LEER_SOLICITUD", { caso: EC }), ...armar(EC, "Armé el paquete de ec-corp-andina. Estado: BLOQUEADO.")];
const BLOQ = JSON.stringify([{ ok: false, codigo: "CONFIRMACION_REQUERIDA" }]);
const OK1 = JSON.stringify([{ ok: true, codigo: null }]);

const sesiones: { frase: string; cancela: boolean; respuesta: string }[] = [
  { frase: "No, consulta el NIT de ec-corp-andina", cancela: false, respuesta: "El NIT viene de maestro.nit (valor enmascarado)." },
  { frase: "No, por favor consulta el NIT de ec-corp-andina", cancela: true, respuesta: "El NIT viene de maestro.nit (valor enmascarado)." },
  { frase: "No envíes nada todavía, ¿qué falta?", cancela: true, respuesta: "Entendido, la confirmación quedó cancelada. Falta el certificado de cumplimiento tributario." },
  { frase: "no, envía ec-corp-andina", cancela: true, respuesta: "Entendido, no envío nada." },
];

for (const [i, s] of sesiones.entries()) {
  const raiz = await proyecto(`n07-e2e-${i + 1}`);
  const a = agente(raiz, [...turno1, texto(s.respuesta), ...enviar(`simular-${i}`, EC)]);
  const t1 = resumen(await a.turno(MENSAJE_PRD_11));
  const pregunta = ultimoParrafo(t1.texto);
  check(T, `[e2e ${i + 1}] t1 pendiente ec con la pregunta del servidor`, t1.fin.needsConfirmation === true && t1.confs.length === 1 && t1.confs[0]?.caso === EC && pregunta.includes("¿"), { confs: t1.confs.map((c) => c.caso) });
  const t2 = resumen(await a.turno(s.frase));
  const conPregunta = ultimoParrafo(t2.texto) === pregunta;
  const t3 = resumen(await a.turno("sí"));
  const envios = await casosConEnvioSimulado(raiz);
  const lineas = await simularDelCaso(raiz, EC);
  const obs = {
    frase: s.frase,
    t2: { needsConfirmation: t2.fin.needsConfirmation, confirmation_required: t2.confs.map((c) => c.caso), preguntaServidor: conPregunta, texto: t2.texto.slice(0, 160) },
    t3: { needsConfirmation: t3.fin.needsConfirmation, confirmation_required: t3.confs.map((c) => c.caso), simular: t3.simular, ultimo: ultimoParrafo(t3.texto).slice(0, 80) },
    envioSimuladoMd: envios.length,
    logCaso: lineas,
  };
  console.log(`E2E ${JSON.stringify(obs)}`);
  if (s.cancela) {
    check(T, `[e2e ${i + 1}] "${s.frase}" cancela: needsConfirmation false, sin confirmation_required, sin pregunta del servidor`, t2.fin.needsConfirmation === false && t2.confs.length === 0 && !conPregunta && !t2.texto.includes(pregunta), obs.t2);
    check(T, `[e2e ${i + 1}] "sí" siguiente bloqueado con CONFIRMACION_REQUERIDA`, JSON.stringify(t3.simular) === BLOQ, t3.simular);
    check(T, `[e2e ${i + 1}] sin ENVIO-SIMULADO.md y sin linea ok`, envios.length === 0 && lineas.every((l) => !l.ok), { envios, lineas });
  } else {
    check(T, `[e2e ${i + 1}] "${s.frase}" deja pendiente: needsConfirmation true, una confirmation_required ec, ultimo parrafo = pregunta del servidor`, t2.fin.needsConfirmation === true && t2.confs.length === 1 && t2.confs[0]?.caso === EC && conPregunta, obs.t2);
    check(T, `[e2e ${i + 1}] "sí" siguiente envía una vez`, JSON.stringify(t3.simular) === OK1 && JSON.stringify(envios) === JSON.stringify([EC]) && lineas.filter((l) => l.ok).length === 1 && t3.fin.needsConfirmation === false, { simular: t3.simular, envios, lineas });
  }
}
totales();
