import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { inicioDe } from "@tests/helpers/eventos.helper.ts";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
import { CLAVE_QA, RAIZ, agenteQa, chequear, escaneoPii, flujoCaso, guionFetch, informe, texto } from "./qa-comun.ts";

const CASO = "co-industrias-delta";
const t0 = performance.now();
const g = guionFetch([...flujoCaso(CASO), texto("Procesé el caso."), texto("Ese dato lo leo siempre del maestro.")]);
const qa = agenteQa(g.fetch, { LOG_LEVEL: "info" }, true);
const ev1 = await qa.turno(`procesa el caso ${CASO}`);
const sensibles = await sensiblesDelProyecto(RAIZ);
const nitCo = sensibles.find((s) => s.ruta === "nit")?.valor ?? "";
const ev2 = await qa.turno(`¿el NIT ${nitCo} es el correcto?`);

const crudas = qa.captura.crudas.join("").split("\n").filter((l) => l !== "");
let validas = 0;
const lineas: Record<string, unknown>[] = [];
for (const c of crudas) {
  try { lineas.push(JSON.parse(c)); validas += 1; } catch { /* inválida */ }
}
const turnos = new Set([inicioDe(ev1).turnoId, inicioDe(ev2).turnoId]);
const sesion = inicioDe(ev1).sesionId;
const herramientas = lineas.filter((l) => l.msg === "tool_exec");
chequear(
  "cada línea del agente es JSON válido con sesionId y turnoId; las de herramienta llevan llamadaId y herramienta",
  crudas.length > 0 && validas === crudas.length && lineas.every((l) => l.sesionId === sesion && turnos.has(String(l.turnoId))) &&
    herramientas.length === 4 && herramientas.every((l) => typeof l.llamadaId === "string" && typeof l.herramienta === "string"),
  {
    lineas: crudas.length, validas,
    camposCorrelacion: ["sesionId", "turnoId", "llamadaId", "herramienta"],
    porMensaje: Object.fromEntries([...new Set(lineas.map((l) => String(l.msg)))].map((m) => [m, lineas.filter((l) => l.msg === m).length])),
    ejemploHerramienta: herramientas[0] === undefined ? null : Object.keys(herramientas[0]),
  },
);

const audit = await readFile(join(RAIZ, "out/log.jsonl"), "utf8");
const auditCaso = await readFile(join(RAIZ, "out", CASO, "log.jsonl"), "utf8");
const auditLineas = [...audit.trim().split("\n"), ...auditCaso.trim().split("\n")];
let auditValidas = 0;
for (const l of auditLineas) { try { JSON.parse(l); auditValidas += 1; } catch { /* inválida */ } }
const todo = [crudas.join("\n"), audit, auditCaso].join("\n");
chequear(
  "la clave ficticia nunca aparece en ninguna línea de log",
  !todo.includes(CLAVE_QA) && !todo.includes(CLAVE_QA.slice(-5)),
  { bitacoraAgente: crudas.length, auditGlobal: audit.trim().split("\n").length, auditCaso: auditCaso.trim().split("\n").length, auditValidas, auditTotal: auditLineas.length, camposAudit: Object.keys(JSON.parse(audit.trim().split("\n")[0] ?? "{}")) },
);
const pii = await escaneoPii(CASO, todo);
chequear(
  "ningún valor sensible del maestro en los logs del agente ni en out/log.jsonl ni out/<caso>/log.jsonl (control positivo en out/)",
  pii.controlPositivo.length > 0 && pii.filtrados.length === 0 && nitCo !== "" && !todo.includes(nitCo),
  { ...pii, nitDelMensajeUsuarioEnLogs: todo.includes(nitCo), nitEnPedidoAlModelo: g.pedidos.at(-1)?.texto.includes(nitCo) ?? null },
);
informe("T10", { ms: Math.round(performance.now() - t0) });
