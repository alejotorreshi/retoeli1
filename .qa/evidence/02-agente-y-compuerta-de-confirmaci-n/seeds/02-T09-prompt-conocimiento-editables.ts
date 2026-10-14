import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { errores, finDeTurno } from "@tests/helpers/eventos.helper.ts";
import { RAIZ, agenteQa, chequear, guionFetch, informe, texto } from "./qa-comun.ts";

const MARCA_PROMPT = `QA-MARCA-PROMPT-${crypto.randomUUID().slice(0, 8)}: responde siempre con cortesía.`;
const MARCA_CONOC = `QA-MARCA-CONOCIMIENTO-${crypto.randomUUID().slice(0, 8)}: regla de prueba.`;
const PROMPT = join(RAIZ, "agent/prompt.md");
const CONOC = join(RAIZ, "src/knowledge/registro-proveedor.md");
const t0 = performance.now();

const g = guionFetch([texto("uno"), texto("dos"), texto("tres")]);
const qa = agenteQa(g.fetch);
const sistema = (i: number) => (g.pedidos[i]?.cuerpo.messages ?? []).filter((m) => m.role === "system").map((m) => m.content).join("\n");
const noSistema = (i: number) => (g.pedidos[i]?.cuerpo.messages ?? []).filter((m) => m.role !== "system").map((m) => m.content).join("\n");

await qa.turno("hola");
const promptOriginal = await readFile(PROMPT, "utf8");
const conocOriginal = await readFile(CONOC, "utf8");
await writeFile(PROMPT, `${promptOriginal}\n${MARCA_PROMPT}\n`);
await writeFile(CONOC, `${conocOriginal}\n${MARCA_CONOC}\n`);
const e2 = await qa.turno("sigue");
await writeFile(PROMPT, promptOriginal);
await writeFile(CONOC, conocOriginal);
const e3 = await qa.turno("sigue");

chequear(
  "ambas marcas aparecen en el contenido system del siguiente pedido, sin cambio de código",
  !sistema(0).includes("QA-MARCA") && sistema(1).includes(MARCA_PROMPT) && sistema(1).includes(MARCA_CONOC) &&
    !noSistema(1).includes("QA-MARCA") && errores(e2).length === 0 && finDeTurno(e2).motivo === "final",
  { pedido0: { marcaPrompt: sistema(0).includes(MARCA_PROMPT) }, pedido1: { marcaPrompt: sistema(1).includes(MARCA_PROMPT), marcaConocimiento: sistema(1).includes(MARCA_CONOC), enMensajesNoSystem: noSistema(1).includes("QA-MARCA") }, largoSystem: [sistema(0).length, sistema(1).length] },
);
chequear(
  "al quitarlas desaparecen del siguiente pedido",
  !sistema(2).includes(MARCA_PROMPT) && !sistema(2).includes(MARCA_CONOC) && sistema(2) === sistema(0) && errores(e3).length === 0,
  { pedido2: { marcaPrompt: sistema(2).includes(MARCA_PROMPT), marcaConocimiento: sistema(2).includes(MARCA_CONOC), igualAlBase: sistema(2) === sistema(0) } },
);
informe("T09", { ms: Math.round(performance.now() - t0) });
