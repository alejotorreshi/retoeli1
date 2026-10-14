import { readFile } from "node:fs/promises";
import { TEXTO_CONFIRMACION } from "@/config/strings.ts";
import { check, totales } from "./qa.helper.ts";
const T = "HV1";
const [logPath, summaryPath, statePath] = process.argv.slice(2) as [string, string, string];
const lineas = (await readFile(logPath, "utf8")).split("\n");
const ini = (pref: string, desde = 0) => lineas.findIndex((l, i) => i >= desde && l.startsWith(pref));
const a1 = ini("Caso: co-industrias-delta");
const a2 = ini('No puedo tomar un "ok"');
const a3 = ini("Envío simulado registrado para co-industrias-delta");
const b1 = ini("Caso: ec-corp-andina");
const b2 = ini("Envío simulado registrado para ec-corp-andina");
const fin = ini("VIVO PASS");
const r = {
  A1: lineas.slice(a1, a2).join("\n").trim(),
  A2: lineas.slice(a2, a3).join("\n").trim(),
  A3: lineas.slice(a3, b1).join("\n").trim(),
  B1: lineas.slice(b1, b2).join("\n").trim(),
  B2: lineas.slice(b2, fin).join("\n").trim(),
};
const qCO = TEXTO_CONFIRMACION.unCaso("co-industrias-delta", []);
const qEC = TEXTO_CONFIRMACION.unCaso("ec-corp-andina", ["ausente: Certificado de cumplimiento tributario"]);
const ultimo = (t: string) => t.split("\n\n").at(-1) ?? "";
for (const [k, t] of Object.entries(r)) console.log(`INFO ${k} '¿'=${(t.match(/¿/g) ?? []).length} parrafos=${t.split("\n\n").length} chars=${t.length}`);
check(T, "A1 ultimo parrafo = pregunta del servidor (CO LISTO)", ultimo(r.A1) === qCO);
check(T, "A2 ultimo parrafo = pregunta del servidor (CO LISTO)", ultimo(r.A2) === qCO);
check(T, "B1 ultimo parrafo = pregunta del servidor (EC BLOQUEADO)", ultimo(r.B1) === qEC);
for (const k of ["A1", "A2", "B1"] as const) check(T, `${k} exactamente un '¿' (el del servidor)`, (r[k].match(/¿/g) ?? []).length === 1);
for (const k of ["A3", "B2"] as const) check(T, `${k} sin '¿'`, (r[k].match(/¿/g) ?? []).length === 0);
const a2Modelo = r.A2.slice(0, r.A2.length - qCO.length);
const pedidoPropio = /\b(dime|responde|confirma|escribe|indica)\b.*(sí|envía|confirm)/i.test(a2Modelo);
check(T, "A2 parte del modelo SIN pedido de confirmación propio (human check)", !pedidoPropio, a2Modelo.trim().split("\n\n").at(-1));
check(T, "A3 solo envío simulado de co + ruta + bloqueos", /registrado para co-industrias-delta/.test(r.A3) && r.A3.includes("out/co-industrias-delta/ENVIO-SIMULADO.md") && /Bloqueos registrados: ninguno/.test(r.A3) && !/Conteos|Faltantes|Soportes/.test(r.A3));
check(T, "B2 solo envío simulado de ec + ruta + bloqueo", /registrado para ec-corp-andina/.test(r.B2) && r.B2.includes("out/ec-corp-andina/ENVIO-SIMULADO.md") && /ausente: Certificado de cumplimiento tributario/.test(r.B2) && !/Conteos|Faltantes|Soportes/.test(r.B2));
check(T, "B1 caso, out/ec-corp-andina/, 13/1/1, RUC por confirmar, Certificado de cumplimiento tributario, BLOQUEADO",
  r.B1.includes("Caso: ec-corp-andina") && r.B1.includes("out/ec-corp-andina/") && /13 campos llenos, 1 faltante y 1 por confirmar/.test(r.B1) && /Por confirmar:\n- RUC/.test(r.B1) && r.B1.includes("Certificado de cumplimiento tributario") && r.B1.includes("BLOQUEADO"));
const afirm = /(envi[eéó]|enviad[oa]|firmad[oa]|firm[eéó] |llen[eé] |llenad[oa])/giu;
for (const [k, t] of Object.entries(r)) {
  const hits = [...t.matchAll(afirm)].map((m) => t.slice(Math.max(0, m.index - 30), m.index + m[0].length + 10).replace(/\n/g, " "));
  console.log(`CLAIMS ${k}: ${JSON.stringify(hits)}`);
}
const unsupported = Object.values(r).some((t) => [...t.matchAll(afirm)].some((m) => !/\b(no|ni|ningún)\b[^.]*$/iu.test(t.slice(Math.max(0, m.index - 25), m.index))));
check(T, "ninguna afirmación de enviado/firmado sin herramienta ok (A1/A2/B1 no afirman envío; A3/B2 respaldados por simular ok en la corrida)", !unsupported);
const vivoLines = lineas.filter((l) => l.startsWith("VIVO PASS")).length;
const summary = await readFile(summaryPath, "utf8");
const filasCorrida = summary.split("## Corrida en vivo")[1]?.split("\n").filter((l) => /^\| \d+ \|/.test(l)).length ?? -1;
const state = await readFile(statePath, "utf8");
const state0221 = state.split("\n").filter((l) => l.startsWith("- [Phase 02]: 02-21:") && l.includes("VIVO PASS")).length;
check(T, "exactamente una corrida en vivo tras 'correr'", vivoLines === 1 && filasCorrida === 1 && summary.includes('**"correr"**') && state0221 === 1, { vivoLines, filasCorrida, state0221 });
totales();
