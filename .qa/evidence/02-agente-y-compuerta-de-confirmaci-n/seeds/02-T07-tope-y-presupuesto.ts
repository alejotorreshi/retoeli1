import { rm } from "node:fs/promises";
import { join } from "node:path";
import { casosConEnvioSimulado, confirmaciones, errores, finDeTurno, finesDeHerramienta, textoFinal } from "@tests/helpers/eventos.helper.ts";
import { N, H, RAIZ, agenteQa, chequear, flujoCaso, guionFetch, herr, informe, texto, ultimoParrafo } from "./qa-comun.ts";

const CO = "co-industrias-delta";
const EC = "ec-corp-andina";
const LEER = N[H.LEER_SOLICITUD];
const t0 = performance.now();
const CODIGO_CRUDO = /\b[A-Z]{3,}_[A-Z_]{3,}\b/;

const ga = guionFetch([
  herr(LEER, { caso: CO }, "leer-1"),
  herr(N[H.MAPEAR_CAMPOS], { caso: CO, campos: [] }, "mapear-1"),
  herr(LEER, { caso: CO }, "leer-3"),
  herr(LEER, { caso: CO }, "leer-4"),
]);
const qa = agenteQa(ga.fetch, { AGENT_MAX_ITERATIONS: "3" });
const a1 = await qa.turno(`procesa el caso ${CO}`);
const ta = textoFinal(a1);
const resumenPedido = ga.pedidos[3]?.cuerpo as unknown as Record<string, unknown> | undefined;
chequear(
  "tope de iteraciones: texto final en español con lo obtenido y lo que falta; turn_end sin código crudo para la usuaria",
  ga.pedidos.length === 4 && finDeTurno(a1).motivo === "tope_iteraciones" && errores(a1).length === 0 &&
    ta.includes("Completé") && ta.includes("Falta") && !CODIGO_CRUDO.test(ta) && finesDeHerramienta(a1, LEER).length === 2,
  {
    pedidos: ga.pedidos.length,
    motivo: finDeTurno(a1).motivo,
    texto: ta,
    llamadaResumen: { tools: Array.isArray(resumenPedido?.tools), tool_choice: resumenPedido?.tool_choice ?? null, ultimoMensaje: ga.pedidos[3]?.cuerpo.messages.at(-1) },
  },
);

const gm = guionFetch([
  herr(LEER, { caso: CO }, "leer-1"), herr(LEER, { caso: CO }, "leer-2"), herr(LEER, { caso: CO }, "leer-3"),
  texto("Leí la solicitud de co-industrias-delta. Falta mapear los campos, generar el formulario y armar el paquete."),
]);
const qm = agenteQa(gm.fetch, { AGENT_MAX_ITERATIONS: "3" });
const m1 = await qm.turno(`procesa el caso ${CO}`);
const variante = { motivo: finDeTurno(m1).motivo, texto: textoFinal(m1), errores: errores(m1).length };

const gb = guionFetch([herr(LEER, { caso: CO }, "leer-1"), herr(LEER, { caso: CO }, "leer-2"), herr(LEER, { caso: CO }, "leer-3"), texto("no debería llegar")]);
const qb = agenteQa(gb.fetch, { AGENT_SESSION_TOKEN_BUDGET: "500" });
const b1 = await qb.turno(`procesa el caso ${CO}`);
const pedidosTrasB1 = gb.pedidos.length;
const b2 = await qb.turno("continúa por favor");
const tb2 = textoFinal(b2);
chequear(
  "presupuesto de tokens: mensaje en español que pide abrir sesión nueva; sin llamada al proveedor tras agotarlo",
  pedidosTrasB1 === 2 && gb.pedidos.length === 2 && finDeTurno(b1).motivo === "tope_tokens" &&
    /sesión nueva/i.test(textoFinal(b1)) && /sesión nueva/i.test(tb2) && !CODIGO_CRUDO.test(textoFinal(b1)),
  { pedidosTurno1: pedidosTrasB1, pedidosTrasTurno2: gb.pedidos.length, textoT1: textoFinal(b1), motivoT1: finDeTurno(b1).motivo, textoT2: tb2, motivoT2: finDeTurno(b2).motivo, erroresT2: errores(b2) },
);

await rm(join(RAIZ, "out"), { recursive: true, force: true });
const gw = guionFetch([...flujoCaso(EC), texto("Armé el paquete de ec-corp-andina."), herr(N[H.SIMULAR_ENVIO], { caso: EC }, "sim-w"), texto("Registrado.")]);
const qw = agenteQa(gw.fetch, { AGENT_SESSION_TOKEN_BUDGET: "1700" });
const w1 = await qw.turno(`procesa el caso ${EC}`);
const pedidosW1 = gw.pedidos.length;
const w2 = await qw.turno("envía");
const w3 = await qw.turno("envía");
const wr03 = {
  turno1: { motivo: finDeTurno(w1).motivo, needsConfirmation: finDeTurno(w1).needsConfirmation, pedidos: pedidosW1, ultimoParrafo: ultimoParrafo(textoFinal(w1)) },
  turno2_envia: { motivo: finDeTurno(w2).motivo, needsConfirmation: finDeTurno(w2).needsConfirmation, confirmaciones: confirmaciones(w2).map((c) => c.caso), texto: textoFinal(w2), errores: errores(w2) },
  turno3_envia: { motivo: finDeTurno(w3).motivo, needsConfirmation: finDeTurno(w3).needsConfirmation, texto: textoFinal(w3) },
  pedidosTotales: gw.pedidos.length,
  casosConEnvio: await casosConEnvioSimulado(RAIZ),
};
informe("T07", { varianteResumenDelModelo: variante, WR03_registro: wr03, ms: Math.round(performance.now() - t0) });
