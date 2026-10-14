import { casosConEnvioSimulado, confirmaciones, errores, finDeTurno, finesDeHerramienta, lineasDeEnvio, textoFinal } from "@tests/helpers/eventos.helper.ts";
import { TEXTO_CONFIRMACION } from "@/config/strings.ts";
import { respuestaDeTurno } from "@/loop/services/respuesta-turno.service.ts";
import { N, H, RAIZ, agenteQa, chequear, flujoCaso, guionFetch, herr, informe, texto, ultimoParrafo, type Paso } from "./qa-comun.ts";

const EC = "ec-corp-andina";
const PREGUNTA = TEXTO_CONFIRMACION.unCaso(EC, ["ausente: Certificado de cumplimiento tributario"]);
const r503: Paso = { estado: 503, cuerpo: { error: { message: "Server overloaded" } } };
const t0 = performance.now();
const g = guionFetch([
  ...flujoCaso(EC),
  texto("Armé el paquete de ec-corp-andina."),
  r503, r503, r503,
  herr(N[H.SIMULAR_ENVIO], { caso: EC }, "simular-3"),
  texto("Registré el envío simulado."),
]);
const qa = agenteQa(g.fetch, { LLM_FALLBACK_ENABLED: "false", LLM_MAX_RETRIES: "2" });
const t1 = await qa.turno("procesa el caso ec-corp-andina");
const t2 = await qa.turno("envía");
const casosTrasT2 = await casosConEnvioSimulado(RAIZ);
const r2 = respuestaDeTurno(t2);
chequear(
  "turno 2: sin ENVIO-SIMULADO.md, error en español, confirmation_required otra vez con la pregunta del servidor como último párrafo",
  finDeTurno(t1).needsConfirmation && casosTrasT2.length === 0 && errores(t2)[0]?.codigo === "PROVEEDOR_NO_DISPONIBLE" &&
    /no está disponible/.test(errores(t2)[0]?.mensaje ?? "") && confirmaciones(t2).map((c) => c.caso).join() === EC &&
    finDeTurno(t2).needsConfirmation === true && ultimoParrafo(r2.reply) === PREGUNTA,
  { error: errores(t2)[0], tipos: t2.map((e) => e.tipo), motivo: finDeTurno(t2).motivo, reply: r2.reply, needsConfirmation: r2.needsConfirmation, ultimoTexto: t2.some((e) => e.tipo === "text") ? textoFinal(t2) : null },
);
const t3 = await qa.turno("envía");
const okEnvios = (await lineasDeEnvio(RAIZ)).filter((l) => l.ok === true);
chequear(
  "turno 3 escribe ENVIO-SIMULADO.md exactamente una vez",
  finesDeHerramienta(t3).map((f) => f.ok).join() === "true" && okEnvios.length === 1 &&
    JSON.stringify(await casosConEnvioSimulado(RAIZ)) === JSON.stringify([EC]) && finDeTurno(t3).needsConfirmation === false,
  { simular: finesDeHerramienta(t3).map((f) => ({ ok: f.ok, codigo: f.codigo })), lineasEnvioOk: okEnvios.length, textoT3: textoFinal(t3) },
);
informe("T11", { ms: Math.round(performance.now() - t0), pedidos: g.pedidos.length, esperas: qa.esperas.length });
