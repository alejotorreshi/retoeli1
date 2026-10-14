import { rm } from "node:fs/promises";
import { join } from "node:path";
import { casosConEnvioSimulado, finDeTurno, finesDeHerramienta, lineasDeEnvio, textoFinal } from "@tests/helpers/eventos.helper.ts";
import { TEXTO_CONFIRMACION } from "@/config/strings.ts";
import { respuestaDeTurno } from "@/loop/services/respuesta-turno.service.ts";
import { N, H, RAIZ, agenteQa, chequear, flujoCaso, guionFetch, herr, informe, texto, ultimoParrafo } from "./qa-comun.ts";

const EC = "ec-corp-andina";
const BASE = "Armé el paquete de ec-corp-andina. Queda BLOQUEADO por un soporte ausente.";
const AJENA = "¿Quieres que revise algo más?";
const PREGUNTA = TEXTO_CONFIRMACION.unCaso(EC, ["ausente: Certificado de cumplimiento tributario"]);
const t0 = performance.now();

async function limpiar() {
  await rm(join(RAIZ, "out"), { recursive: true, force: true });
}

async function conPendiente(textoModelo: string, segundo: string | null) {
  await limpiar();
  const g = guionFetch([
    ...flujoCaso(EC),
    texto(textoModelo),
    herr(N[H.SIMULAR_ENVIO], { caso: EC }, "simular-2"),
    texto("Registrado."),
  ]);
  const qa = agenteQa(g.fetch);
  const t1 = await qa.turno("procesa el caso ec-corp-andina");
  const t2 = segundo === null ? null : await qa.turno(segundo);
  return { t1, t2, g };
}

const v1 = await conPendiente(`${BASE}\n\n${AJENA}`, "sí");
const f1 = textoFinal(v1.t1);
const v2 = await conPendiente(`${BASE} ${AJENA}`, null);
const f2 = textoFinal(v2.t1);
chequear(
  "con caso pendiente: último párrafo = pregunta del servidor; la pregunta del modelo desaparece sin fragmentos",
  ultimoParrafo(f1) === PREGUNTA && !f1.includes("revise algo") && f1 === `${BASE}\n\n${PREGUNTA}` &&
    respuestaDeTurno(v1.t1).reply === f1 && ultimoParrafo(f2) === PREGUNTA && f2 === `${BASE}\n\n${PREGUNTA}`,
  { parrafoAparte: f1, mismaLinea: f2 },
);
await limpiar();
const v1b = await conPendiente(`${BASE}\n\n${AJENA}`, "sí");
const historialT2 = v1b.g.pedidos.at(-2)?.cuerpo.messages.filter((m) => m.role === "assistant" && !m.tool_calls?.length).at(-1)?.content ?? "";
const okEnvios = (await lineasDeEnvio(RAIZ)).filter((l) => l.ok === true).length;
chequear(
  "'sí' tras esa respuesta envía una vez (responde la pregunta del servidor)",
  finesDeHerramienta(v1b.t2 ?? []).map((f) => f.ok).join() === "true" && okEnvios === 1 &&
    JSON.stringify(await casosConEnvioSimulado(RAIZ)) === JSON.stringify([EC]) && ultimoParrafo(historialT2) === PREGUNTA,
  { simular: finesDeHerramienta(v1b.t2 ?? []).map((f) => ({ ok: f.ok, codigo: f.codigo })), okEnvios, historialAsistenteVistoPorModeloTerminaEnPreguntaServidor: ultimoParrafo(historialT2) === PREGUNTA },
);

await limpiar();
const c = guionFetch([
  ...flujoCaso(EC).slice(0, 3),
  texto(`Generé el formulario de ${EC}.\n\n${AJENA}`),
  herr(N[H.SIMULAR_ENVIO], { caso: EC }, "simular-c"),
  texto("Listo."),
]);
const qc = agenteQa(c.fetch);
const c1 = await qc.turno(`procesa el caso ${EC} hasta el formulario`);
const c2 = await qc.turno("sí");
chequear(
  "control sin pendiente: 'sí' no envía (CONFIRMACION_REQUERIDA si el modelo lo intenta)",
  finDeTurno(c1).needsConfirmation === false && textoFinal(c1).endsWith(AJENA) &&
    finesDeHerramienta(c2)[0]?.codigo === "CONFIRMACION_REQUERIDA" && (await casosConEnvioSimulado(RAIZ)).length === 0,
  { textoT1: textoFinal(c1), simular: finesDeHerramienta(c2).map((f) => ({ ok: f.ok, codigo: f.codigo })) },
);

const NOTA = "- Régimen tributario: requiere confirmación (¿RIMPE o general?)";
const w1 = await conPendiente(`${BASE}\nCampos por confirmar:\n${NOTA}`, null);
const w2 = await conPendiente(`${BASE}\nCampos por confirmar:\n${NOTA}\n\n${AJENA}`, null);
const w3 = await conPendiente(`${BASE}\nCampos por confirmar:\n${NOTA}\nRevisa el checklist antes de firmar.`, null);
const wr02 = {
  notaComoUltimaLinea: { sobrevive: textoFinal(w1.t1).includes("RIMPE"), texto: textoFinal(w1.t1) },
  notaSeguidaDePreguntaAjena: { sobrevive: textoFinal(w2.t1).includes("RIMPE"), texto: textoFinal(w2.t1) },
  notaSeguidaDeLineaSinPregunta: { sobrevive: textoFinal(w3.t1).includes("RIMPE"), texto: textoFinal(w3.t1) },
};
informe("T05", { WR02_registro: wr02, ms: Math.round(performance.now() - t0) });
