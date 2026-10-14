import { rm } from "node:fs/promises";
import { join } from "node:path";
import { casosConEnvioSimulado, confirmaciones, finDeTurno, finesDeHerramienta, lineasDeEnvio, textoFinal } from "@tests/helpers/eventos.helper.ts";
import { crearAgente } from "@/loop/wiring/agente.wiring.ts";
import { CLAVE_QA, N, H, RAIZ, agenteQa, chequear, flujoCaso, guionFetch, herr, informe, texto, ultimoParrafo } from "./qa-comun.ts";

const EC = "ec-corp-andina";
const SIM = N[H.SIMULAR_ENVIO];
const limpiar = () => rm(join(RAIZ, "out"), { recursive: true, force: true });

await limpiar();
const g1 = guionFetch([...flujoCaso(EC), texto("Armé el paquete."), texto("De nada."), herr(SIM, { caso: EC }, "sim-si"), texto("Registré el envío simulado.")]);
const q1 = agenteQa(g1.fetch);
await q1.turno(`procesa el caso ${EC}`);
const okT2 = await q1.turno("ok");
const siT3 = await q1.turno("sí");
chequear(
  "D-63.6: 'ok' mantiene pendiente con re-pregunta; el 'sí' siguiente envía una sola vez",
  finDeTurno(okT2).needsConfirmation === true && confirmaciones(okT2).map((c) => c.caso).join() === EC &&
    finesDeHerramienta(siT3).map((f) => f.ok).join() === "true" && (await lineasDeEnvio(RAIZ)).filter((l) => l.ok === true).length === 1 &&
    finDeTurno(siT3).needsConfirmation === false,
  { t2: { needs: finDeTurno(okT2).needsConfirmation, ultimo: ultimoParrafo(textoFinal(okT2)).slice(0, 60) }, t3: finesDeHerramienta(siT3).map((f) => ({ ok: f.ok, codigo: f.codigo })) },
);

await limpiar();
const g2 = guionFetch([...flujoCaso(EC), texto("Armé el paquete."), herr(SIM, { caso: EC }, "sim-falla"), texto("No pude registrar el envío."), herr(SIM, { caso: EC }, "sim-sin-aut"), texto("x"), herr(SIM, { caso: EC }, "sim-ok"), texto("y")]);
const q2 = agenteQa(g2.fetch);
await q2.turno(`procesa el caso ${EC}`);
await rm(join(RAIZ, "out", EC, "paquete"), { recursive: true, force: true });
const f2 = await q2.turno("envía");
const fin2 = finesDeHerramienta(f2);
const f3 = await q2.turno("¿qué pasó?");
const fin3 = finesDeHerramienta(f3);
chequear(
  "D-63.7: un envío autorizado que falla deja el caso pendiente (re-pregunta del servidor) y no recupera la autorización",
  fin2.length === 1 && fin2[0]?.ok === false && fin2[0]?.codigo !== "CONFIRMACION_REQUERIDA" && finDeTurno(f2).needsConfirmation === true &&
    confirmaciones(f2).map((c) => c.caso).join() === EC && ultimoParrafo(textoFinal(f2)).includes(`¿Confirmas el envío simulado de ${EC}?`) &&
    fin3[0]?.codigo === "CONFIRMACION_REQUERIDA" && (await casosConEnvioSimulado(RAIZ)).length === 0,
  { t2: fin2.map((f) => ({ ok: f.ok, codigo: f.codigo })), t2needs: finDeTurno(f2).needsConfirmation, t2motivo: finDeTurno(f2).motivo, t3: fin3.map((f) => ({ ok: f.ok, codigo: f.codigo })), t3needs: finDeTurno(f3).needsConfirmation },
);

const { fetch } = guionFetch([]);
const multi = crearAgente({ directorio: RAIZ, fetch, fuenteEntorno: { LOG_LEVEL: "silent", LLM_API_KEY: CLAVE_QA, LLM_BASE_URL: "http://api.example.com", LLM_FALLBACK_BASE_URL: "http://otro.example.com", LLM_MAX_RETRIES: "abc" } });
const msg = multi.ok ? "" : multi.mensaje;
chequear(
  "WR-01: un mensaje de configuración con varios issues termina en exactamente un punto (sin '..' ni '.;')",
  !multi.ok && msg.endsWith(".") && !msg.endsWith("..") && !msg.includes("..") && !msg.includes(".;") && !msg.includes(CLAVE_QA),
  { codigo: multi.ok ? null : multi.codigo, mensaje: msg },
);
informe("X-r2-extras");
