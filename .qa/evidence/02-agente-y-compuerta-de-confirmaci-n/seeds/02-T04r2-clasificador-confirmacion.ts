import { rm } from "node:fs/promises";
import { join } from "node:path";
import { casosConEnvioSimulado, finDeTurno, finesDeHerramienta, textoFinal } from "@tests/helpers/eventos.helper.ts";
import { clasificarConfirmacion } from "@/domain/policies/confirmacion.policy.ts";
import { N, H, RAIZ, agenteQa, chequear, flujoCaso, guionFetch, herr, informe, texto, ultimoParrafo } from "./qa-comun.ts";

const EC = "ec-corp-andina";
const PEND = [EC];
const t0 = performance.now();
const clase = (f: string) => clasificarConfirmacion(f, PEND);
const tabla = (fs: string[]) => fs.map((f) => ({ frase: f, ...clase(f) }));

const dudosas = tabla(["y el envío", "el envío", "ok, gracias", "listo, ya", "vale, el paquete"]);
chequear("frases dudosas -> otro", dudosas.every((r) => r.decision === "otro"), dudosas);
const rechazo = tabla(["No envíes nada todavía"]);
chequear("'No envíes nada todavía' -> rechaza", rechazo.every((r) => r.decision === "rechaza"), rechazo);
const explicitas = tabla(["envía", "sí", "confirmo", "envía ec-corp-andina"]);
chequear(
  "'envía', 'sí', 'confirmo', 'envía ec-corp-andina' -> confirma para ec-corp-andina",
  explicitas.every((r) => r.decision === "confirma" && "caso" in r && r.caso === EC),
  explicitas,
);

async function e2e(frase: string) {
  await rm(join(RAIZ, "out"), { recursive: true, force: true });
  const g = guionFetch([
    ...flujoCaso(EC),
    texto("Armé el paquete de ec-corp-andina."),
    herr(N[H.SIMULAR_ENVIO], { caso: EC }, "simular-2"),
    texto("Listo."),
  ]);
  const qa = agenteQa(g.fetch);
  const t1 = await qa.turno("procesa el caso ec-corp-andina");
  const t2 = await qa.turno(frase);
  return {
    frase,
    pendienteTrasT1: finDeTurno(t1).needsConfirmation,
    preguntaServidor: ultimoParrafo(textoFinal(t1)),
    simular: finesDeHerramienta(t2).map((f) => ({ ok: f.ok, codigo: f.codigo })),
    casosConEnvio: await casosConEnvioSimulado(RAIZ),
    pendienteTrasT2: finDeTurno(t2).needsConfirmation,
    reAskServidorT2: ultimoParrafo(textoFinal(t2)) === ultimoParrafo(textoFinal(t1)),
  };
}
const extremo = [await e2e("y el envío"), await e2e("ok, gracias")];
chequear(
  "e2e: frases dudosas dejan simular_envio bloqueado, sin ENVIO-SIMULADO.md",
  extremo.every((r) => r.pendienteTrasT1 && r.simular.length === 1 && r.simular[0]?.ok === false && r.simular[0]?.codigo === "CONFIRMACION_REQUERIDA" && r.casosConEnvio.length === 0),
  extremo.map(({ preguntaServidor, ...resto }) => resto),
);

const acuses = tabla(["ok", "listo", "vale", "claro", "correcto", "ok ok", "si todo bien"]);
chequear("acuses sueltos y 'si todo bien' -> otro", acuses.every((r) => r.decision === "otro"), acuses);
const acusesE2e = [await e2e("ok"), await e2e("si todo bien")];
chequear(
  "e2e: 'ok' y 'si todo bien' dejan simular_envio bloqueado, sin ENVIO-SIMULADO.md",
  acusesE2e.every((r) => r.pendienteTrasT1 && r.simular.length === 1 && r.simular[0]?.ok === false && r.simular[0]?.codigo === "CONFIRMACION_REQUERIDA" && r.casosConEnvio.length === 0),
  acusesE2e.map(({ preguntaServidor, ...resto }) => resto),
);
const d636 = [...extremo, ...acusesE2e];
chequear(
  "D-63.6 (r2): tras una frase que no confirma ni rechaza el caso sigue pendiente y el servidor vuelve a preguntar",
  d636.every((r) => r.pendienteTrasT2 === true && r.reAskServidorT2 === true),
  d636.map((r) => ({ frase: r.frase, pendienteTrasT2: r.pendienteTrasT2, reAskServidorT2: r.reAskServidorT2 })),
);
const rech = await (async () => {
  await rm(join(RAIZ, "out"), { recursive: true, force: true });
  const g = guionFetch([...flujoCaso(EC), texto("Armé el paquete de ec-corp-andina."), texto("Entendido."), herr(N[H.SIMULAR_ENVIO], { caso: EC }, "simular-r3"), texto("x")]);
  const qa = agenteQa(g.fetch);
  await qa.turno("procesa el caso ec-corp-andina");
  const t2 = await qa.turno("No envíes nada todavía");
  const t3 = await qa.turno("sí");
  return { pendienteTrasRechazo: finDeTurno(t2).needsConfirmation, simularT3: finesDeHerramienta(t3).map((f) => ({ ok: f.ok, codigo: f.codigo })), casosConEnvio: await casosConEnvioSimulado(RAIZ) };
})();
const masExplicitas = tabla(["sí, envía", "si", "si, envía", "dale", "procede", "adelante"]);
informe("T04", { registro_rechazoLibera: rech, registro_explicitasExtra: masExplicitas, ms: Math.round(performance.now() - t0) });
