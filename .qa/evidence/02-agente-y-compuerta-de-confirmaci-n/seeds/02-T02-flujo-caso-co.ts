import { confirmaciones, finDeTurno, textoFinal } from "@tests/helpers/eventos.helper.ts";
import { TEXTO_CONFIRMACION } from "@/config/strings.ts";
import { respuestaDeTurno } from "@/loop/services/respuesta-turno.service.ts";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  CLAVE_QA, N, H, RAIZ, agenteQa, chequear, escaneoPii, flujoCaso, guionFetch, informe, listar, texto, ultimoParrafo,
} from "./qa-comun.ts";

const CASO = "co-industrias-delta";
const TEXTO_MODELO = `Procesé el caso ${CASO}: leí la solicitud, mapeé los campos, generé el formulario y armé el paquete.`;
const { fetch, pedidos } = guionFetch([...flujoCaso(CASO), texto(TEXTO_MODELO)]);
const qa = agenteQa(fetch);
const t0 = performance.now();
const ev = await qa.turno(`procesa el caso ${CASO}`);
const ms = Math.round(performance.now() - t0);

const tipos = ev.map((e) => e.tipo);
const herramientasEnOrden = ev
  .filter((e) => e.tipo === "tool_start" || e.tipo === "tool_end")
  .map((e) => `${e.tipo}:${"herramienta" in e ? e.herramienta : ""}`);
const esperado = [H.LEER_SOLICITUD, H.MAPEAR_CAMPOS, H.GENERAR_FORMULARIO, H.ARMAR_PAQUETE].flatMap((h) => [
  `tool_start:${N[h]}`,
  `tool_end:${N[h]}`,
]);
const finesOk = ev.filter((e) => e.tipo === "tool_end").map((e) => ("ok" in e ? e.ok : null));
const idxTexto = tipos.lastIndexOf("text");
chequear(
  "eventos: tool_start/tool_end de las 4 herramientas en orden, luego text y turn_end",
  JSON.stringify(herramientasEnOrden) === JSON.stringify(esperado) &&
    finesOk.every((x) => x === true) &&
    idxTexto > tipos.lastIndexOf("tool_end") &&
    tipos.at(-1) === "turn_end",
  { tipos, finesOk },
);

const cuerposOk = pedidos.map((p) => ({
  model: p.cuerpo.model,
  thinking: p.cuerpo.thinking?.type,
  url: p.url,
  tools: (p.cuerpo.tools ?? []).map((t) => t.function.name).sort(),
}));
chequear(
  "cada pedido: model deepseek-flash, thinking disabled, sin framework (fetch crudo a /chat/completions)",
  pedidos.length === 5 &&
    cuerposOk.every((c) => c.model === "deepseek-flash" && c.thinking === "disabled" && c.url === "https://api.deepseek.com/chat/completions"),
  { pedidos: pedidos.length, primero: cuerposOk[0], userAgent: pedidos[0]?.cabeceras["user-agent"] ?? null, cabeceras: Object.keys(pedidos[0]?.cabeceras ?? {}) },
);

const corpus = [...pedidos.map((p) => p.texto), JSON.stringify(ev)].join("\n");
const pii = await escaneoPii(CASO, corpus);
const solicitud = JSON.parse(await readFile(join(RAIZ, "reto-01/fixtures/reto-01/casos", CASO, "solicitud.json"), "utf8"));
const lineasCuerpo = String(solicitud.cuerpo).split("\n").map((l) => l.trim()).filter((l) => l.length >= 25);
const cuerpoFiltrado = lineasCuerpo.filter((l) => corpus.includes(l)).length;
const mascaras = pedidos.some((p) => p.cuerpo.messages.some((m) => m.role === "tool" && m.content.includes("•")));
chequear(
  "ningún valor sensible del maestro en pedidos ni eventos (con control positivo en out/)",
  pii.controlPositivo.length > 0 && pii.filtrados.length === 0 && cuerpoFiltrado === 0 && !corpus.includes(CLAVE_QA),
  { ...pii, controlPositivoN: pii.controlPositivo.length, lineasCuerpoCorreo: lineasCuerpo.length, cuerpoFiltrado, mascarasEnMensajesTool: mascaras },
);

const archivos = await listar(`out/${CASO}`);
chequear(
  "out/co-industrias-delta/formulario.* y paquete/ existen",
  archivos.some((a) => a.startsWith("formulario.")) && archivos.some((a) => a.startsWith("paquete/")),
  { archivos },
);

const final = textoFinal(ev);
const pregunta = TEXTO_CONFIRMACION.unCaso(CASO, []);
chequear(
  "respuesta final en texto plano español; último párrafo = pregunta del servidor para caso LISTO",
  ultimoParrafo(final) === pregunta && final.startsWith(TEXTO_MODELO) && !/[*#`]/.test(final) &&
    finDeTurno(ev).needsConfirmation === true && confirmaciones(ev).length === 1,
  { final, confirmacion: confirmaciones(ev), reply: respuestaDeTurno(ev).reply === final },
);

informe("T02", { ms, rolesPrimerPedido: pedidos[0]?.cuerpo.messages.map((m) => m.role) });
