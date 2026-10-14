import { errores, finDeTurno, textoFinal, usos } from "@tests/helpers/eventos.helper.ts";
import { cuerpoConArgumentosCrudos, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { historialWireIntegro } from "@tests/helpers/historial.helper.ts";
import type { MensajeWire } from "@tests/helpers/types/fetch-falso.type.ts";
import { CLAVE_QA, N, H, agenteQa, chequear, guionFetch, herr, informe, texto, type Paso } from "./qa-comun.ts";

const t0 = performance.now();
const SIN_RESPALDO = { LLM_FALLBACK_ENABLED: "false", LLM_MAX_RETRIES: "2" };
const CON_RESPALDO = { LLM_FALLBACK_ENABLED: "true", LLM_MAX_RETRIES: "2", LOG_LEVEL: "info" };
const r429: Paso = { estado: 429, cuerpo: { error: { message: "Rate limit reached" } } };
const r503: Paso = { estado: 503, cuerpo: { error: { message: "Server overloaded" } } };
const red: Paso = { cuerpo: null, red: true };
const colgado: Paso = { cuerpo: null, colgar: true };
const r402: Paso = { estado: 402, cuerpo: { error: { message: `Insufficient Balance for api key ****${CLAVE_QA.slice(-5)}` } } };

const esperasPorEnsayo: number[][] = [];
let todosOk = true;
let pedidosPorEnsayo = 0;
for (let i = 0; i < 40; i += 1) {
  const g = guionFetch([r429, r503, texto("Hola, aquí estoy.")]);
  const qa = agenteQa(g.fetch, SIN_RESPALDO);
  const ev = await qa.turno("hola");
  esperasPorEnsayo.push([...qa.esperas]);
  pedidosPorEnsayo = g.pedidos.length;
  todosOk &&= errores(ev).length === 0 && finDeTurno(ev).motivo === "final" && textoFinal(ev) === "Hola, aquí estoy.";
}
const prim = esperasPorEnsayo.map((e) => e[0] ?? -1);
const seg = esperasPorEnsayo.map((e) => e[1] ?? -1);
const media = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
chequear(
  "429/503 reintentados con esperas crecientes (techo exponencial con jitter), luego éxito; sin evento error",
  todosOk && pedidosPorEnsayo === 3 && esperasPorEnsayo.every((e) => e.length === 2) &&
    Math.max(...prim) <= 500 && Math.max(...seg) <= 1000 && media(seg) > media(prim),
  { ensayos: 40, pedidosPorEnsayo, techoPrimera: Math.round(Math.max(...prim)), techoSegunda: Math.round(Math.max(...seg)), mediaPrimera: media(prim), mediaSegunda: media(seg), ejemplo: esperasPorEnsayo[0]?.map(Math.round) },
);

const gf = guionFetch([red, red, red, { cuerpo: { ...(cuerpoConTexto("Respondo desde el respaldo.") as object), model: "deepseek-v4-pro" } }]);
const qf = agenteQa(gf.fetch, CON_RESPALDO, true);
const evf = await qf.turno("hola");
const logsF = qf.captura.lineas();
chequear(
  "el primario sigue fallando -> responde el modelo de respaldo (evento usage y log muestran deepseek-v4-pro)",
  gf.pedidos.length === 4 && gf.pedidos.slice(0, 3).every((p) => p.cuerpo.model === "deepseek-flash") &&
    gf.pedidos[3]?.cuerpo.model === "deepseek-v4-pro" && usos(evf).at(-1)?.modelo === "deepseek-v4-pro" &&
    textoFinal(evf) === "Respondo desde el respaldo." && errores(evf).length === 0 && logsF.some((l) => l.msg === "llm_fallback"),
  { modelos: gf.pedidos.map((p) => p.cuerpo.model), uso: usos(evf).at(-1), lineasLog: logsF.map((l) => ({ msg: l.msg, tipo: l.tipo, modelo: l.modelo })) },
);

const gs = guionFetch([
  herr(N[H.LEER_SOLICITUD], { caso: "co-industrias-delta" }, "leer-s1"),
  r402,
  colgado, colgado, colgado,
  texto("Sigo aquí."),
]);
const qs = agenteQa(gs.fetch, { ...SIN_RESPALDO, LLM_TIMEOUT_MS: "40" });
const s1 = await qs.turno("procesa el caso co-industrias-delta");
const pedidosTrasS1 = gs.pedidos.length;
const s2 = await qs.turno("¿sigues?");
const s3 = await qs.turno("¿y ahora?");
const e402 = errores(s1)[0];
const eTo = errores(s2)[0];
const todoEventos = JSON.stringify([s1, s2, s3]);
chequear(
  "402 -> mensaje en español con 'saldo' (agotado), sin reintento ni clave; timeout -> mensaje claro en español",
  e402?.codigo === "PROVEEDOR_SALDO_AGOTADO" && /saldo agotado/i.test(e402.mensaje) && pedidosTrasS1 === 2 &&
    eTo?.codigo === "PROVEEDOR_TIMEOUT" && !todoEventos.includes(CLAVE_QA) && !todoEventos.includes(CLAVE_QA.slice(-5)),
  { error402: e402, errorTimeout: eTo, pedidosHasta402: pedidosTrasS1, esperasSesion: qs.esperas.length },
);
const ultimo = gs.pedidos.at(-1)?.cuerpo.messages ?? [];
const roles = ultimo.map((m) => m.role);
const ids = ultimo.flatMap((m) => m.tool_calls?.map((c) => c.id) ?? []);
const contenidos = ultimo.filter((m) => m.role !== "system").map((m) => `${m.role}:${m.content}`);
chequear(
  "el siguiente mensaje en la misma sesión funciona y el historial reenviado está íntegro (sin duplicados)",
  textoFinal(s3) === "Sigo aquí." && finDeTurno(s3).motivo === "final" &&
    JSON.stringify(roles) === JSON.stringify(["system", "system", "user", "assistant", "tool", "assistant", "user", "assistant", "user"]) &&
    new Set(ids).size === ids.length && historialWireIntegro(ultimo as readonly MensajeWire[]).length === 0 &&
    new Set(contenidos).size === contenidos.length,
  { roles, asistentes: ultimo.filter((m) => m.role === "assistant" && !m.tool_calls?.length).map((m) => m.content) },
);

const TRUNCADO = '{"caso":"co-industrias-delta","mapeo":[{"etiq';
const gc = guionFetch([
  { cuerpo: cuerpoConArgumentosCrudos("length", { id: "call_cortado", nombre: N[H.GENERAR_FORMULARIO], argumentos: TRUNCADO }) },
  texto("Vuelvo a pedirla."),
  texto("Sigo aquí."),
]);
const qc = agenteQa(gc.fetch, SIN_RESPALDO);
const c1 = await qc.turno("procesa el caso co-industrias-delta");
const c2 = await qc.turno("¿sigues?");
const argsPosteriores = gc.pedidos.slice(1).flatMap((p) => p.cuerpo.messages.flatMap((m) => m.tool_calls ?? []).map((c) => c.function.arguments));
const resultadoTool = gc.pedidos[1]?.cuerpo.messages.find((m) => m.role === "tool")?.content ?? "";
const esObjeto = (s: string) => { try { const v = JSON.parse(s); return typeof v === "object" && v !== null && !Array.isArray(v); } catch { return false; } };
chequear(
  "CR-03: ninguna herramienta ejecutada en el paso truncado; los pedidos posteriores llevan argumentos JSON objeto ('{}' para el truncado)",
  c1.every((e) => e.tipo !== "tool_start" && e.tipo !== "tool_end") && argsPosteriores.length === 2 &&
    argsPosteriores.every((a) => a === "{}") && argsPosteriores.every(esObjeto) && JSON.parse(resultadoTool).codigo === "ARGUMENTOS_TRUNCADOS" &&
    textoFinal(c2) === "Sigo aquí.",
  { tiposT1: c1.map((e) => e.tipo), argsPosteriores, resultadoTool },
);

informe("T06", { ms: Math.round(performance.now() - t0) });
