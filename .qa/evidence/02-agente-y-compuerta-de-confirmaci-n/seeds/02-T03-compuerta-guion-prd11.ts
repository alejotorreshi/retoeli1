import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { confirmaciones, finDeTurno, finesDeHerramienta, lineasDeEnvio, textoFinal, casosConEnvioSimulado } from "@tests/helpers/eventos.helper.ts";
import { respuestaDeTurno } from "@/loop/services/respuesta-turno.service.ts";
import { N, H, RAIZ, agenteQa, chequear, flujoCaso, guionFetch, herr, informe, texto, ultimoParrafo } from "./qa-comun.ts";

const EC = "ec-corp-andina";
const CO = "co-industrias-delta";
const SIM = N[H.SIMULAR_ENVIO];
const ENVIO = join(RAIZ, "out", EC, "ENVIO-SIMULADO.md");
const t0 = performance.now();

const flujoConEnvio = flujoCaso(EC);
flujoConEnvio[3] = herr(N[H.ARMAR_PAQUETE], { caso: EC }, "armar-a");
const a = guionFetch([...flujoConEnvio, herr(SIM, { caso: EC, confirmado: true }, "simular-a"), texto("Armé el paquete de ec-corp-andina.")]);
const qa = agenteQa(a.fetch);
const evA = await qa.turno("procesa el caso ec-corp-andina. No envíes nada todavía");
const resultadoA = a.pedidos.at(-1)?.cuerpo.messages.find((m) => m.role === "tool" && m.tool_call_id === "simular-a")?.content ?? "";
chequear(
  "(a) simular_envio con confirmado:true bloqueado: CONFIRMACION_REQUERIDA, sin ENVIO-SIMULADO.md",
  finesDeHerramienta(evA).length === 1 && finesDeHerramienta(evA)[0]?.codigo === "CONFIRMACION_REQUERIDA" &&
    JSON.parse(resultadoA).codigo === "CONFIRMACION_REQUERIDA" && !existsSync(ENVIO),
  { finSimular: finesDeHerramienta(evA), resultadoHerramienta: resultadoA, envioExiste: existsSync(ENVIO), needsConfirmation: finDeTurno(evA).needsConfirmation },
);

const b = guionFetch([
  ...flujoCaso(EC, "b"),
  texto("Armé el paquete de ec-corp-andina."),
  herr(SIM, { caso: EC }, "simular-b2"),
  texto("Registré el envío simulado."),
  herr(SIM, { caso: EC }, "simular-b3"),
  texto("Registré el envío simulado otra vez."),
  herr(SIM, { caso: EC }, "simular-b4"),
  texto("Turno 4."),
]);
const qb = agenteQa(b.fetch);
const t1 = await qb.turno("procesa el caso ec-corp-andina");
const final1 = textoFinal(t1);
const ult = ultimoParrafo(final1);
chequear(
  "(b) turno 1: confirmation_required + needsConfirmation, último párrafo = pregunta del servidor con ec-corp-andina y 'Certificado de cumplimiento tributario'",
  confirmaciones(t1).length === 1 && confirmaciones(t1)[0]?.caso === EC && finDeTurno(t1).needsConfirmation === true &&
    respuestaDeTurno(t1).needsConfirmation === true && ult.includes(EC) && ult.includes("Certificado de cumplimiento tributario") && ult.trimEnd().endsWith("?"),
  { confirmacion: confirmaciones(t1), ultimoParrafo: ult },
);
const t2 = await qb.turno("envía");
const okT2 = finesDeHerramienta(t2);
const mtime = existsSync(ENVIO) ? (await stat(ENVIO)).mtimeMs : null;
const contenido1 = existsSync(ENVIO) ? await readFile(ENVIO, "utf8") : null;
const enviosOk2 = (await lineasDeEnvio(RAIZ)).filter((l) => l.ok === true);
chequear(
  "(b) turno 2 'envía' escribe out/ec-corp-andina/ENVIO-SIMULADO.md exactamente una vez y solo para ese caso",
  okT2.length === 1 && okT2[0]?.ok === true && existsSync(ENVIO) && enviosOk2.length === 1 &&
    JSON.stringify(await casosConEnvioSimulado(RAIZ)) === JSON.stringify([EC]) && finDeTurno(t2).needsConfirmation === false,
  { finSimular: okT2, casosConEnvio: await casosConEnvioSimulado(RAIZ), lineasEnvioOk: enviosOk2.length, textoT2: textoFinal(t2) },
);
const t3 = await qb.turno("envía");
const okT3 = finesDeHerramienta(t3);
const enviosOk3 = (await lineasDeEnvio(RAIZ)).filter((l) => l.ok === true);
const mtime3 = existsSync(ENVIO) ? (await stat(ENVIO)).mtimeMs : null;
chequear(
  "(c) un 'envía' repetido sin caso pendiente nuevo no escribe un segundo ENVIO-SIMULADO.md",
  okT3.length === 1 && okT3[0]?.ok === false && okT3[0]?.codigo === "CONFIRMACION_REQUERIDA" && enviosOk3.length === 1 &&
    mtime3 === mtime && (await readFile(ENVIO, "utf8")) === contenido1,
  { finSimular: okT3, lineasEnvioOk: enviosOk3.length, mtimeIgual: mtime3 === mtime, textoT3: textoFinal(t3) },
);

const t4 = await qb.turno("envía");
const observacionT4 = {
  nota: "observación extra (no es assert de la suite): turno 4 'envía' tras la pregunta re-emitida en el turno 3",
  confirmacionesT3: confirmaciones(t3).map((c) => c.caso),
  needsConfirmationT3: finDeTurno(t3).needsConfirmation,
  finSimularT4: finesDeHerramienta(t4).map((f) => ({ ok: f.ok, codigo: f.codigo })),
  lineasEnvioOkTrasT4: (await lineasDeEnvio(RAIZ)).filter((l) => l.ok === true).length,
  envioReescrito: existsSync(ENVIO) ? (await stat(ENVIO)).mtimeMs !== mtime : null,
};

const d = guionFetch([
  ...flujoCaso(EC, "d"),
  ...flujoCaso(CO, "d"),
  texto("Armé los paquetes de ec-corp-andina y co-industrias-delta."),
  herr(SIM, { caso: EC }, "simular-d2"),
  texto("Intenté registrar el envío."),
]);
const qd = agenteQa(d.fetch, { AGENT_MAX_ITERATIONS: "12" });
const d1 = await qd.turno("procesa los casos ec-corp-andina y co-industrias-delta");
const d2 = await qd.turno("envía");
const extra = {
  H4_dosCasos: {
    confirmaciones: confirmaciones(d1).map((c) => ({ caso: c.caso, bloqueos: c.bloqueos })),
    needsConfirmation: finDeTurno(d1).needsConfirmation,
    textoFinalT1: textoFinal(d1),
    t2_envia_sinCaso: { finSimular: finesDeHerramienta(d2), texto: textoFinal(d2), needsConfirmation: finDeTurno(d2).needsConfirmation },
  },
  H4_unCaso_preguntaServidor: ult,
  observacionT4,
  ms: Math.round(performance.now() - t0),
};
informe("T03", extra);
