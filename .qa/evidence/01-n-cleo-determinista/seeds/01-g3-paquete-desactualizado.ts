import { existsSync } from "node:fs";
import { copyFile, readdir, rm } from "node:fs/promises";
import { call, proyectar } from "./qa-lib.ts";
const SEEDS = process.argv[2]!;
const INDEX = "reto-01/fixtures/reto-01/repositorio/soportes/index.json";
const SOPORTES = "reto-01/fixtures/reto-01/repositorio/soportes";
const show = (l: string, r: unknown) => console.log(l, JSON.stringify(r));
const ls = async (caso: string) => (await readdir(`out/${caso}/paquete`)).sort();
const envio = (caso: string) => existsSync(`out/${caso}/ENVIO-SIMULADO.md`);
async function flujo(caso: string) {
  await call("leer_solicitud", { caso });
  const m = await call("mapear_campos", { caso, campos: [] });
  await call("generar_formulario", { caso, mapeo: proyectar(m) });
  const p = await call("armar_paquete", { caso });
  console.log(`flujo ${caso}: ${p.resumen}`);
}
const co = "co-industrias-delta";
const hn = "hn-agroexport-sula";
await flujo(co);
await rm(`out/${co}/paquete/rut-2026.txt`);
console.log("A paquete:", await ls(co));
show("A send:", await call("simular_envio", { caso: co, confirmado: true }));
console.log("A ENVIO-SIMULADO.md exists:", envio(co));
await flujo(hn);
await copyFile(`${SEEDS}/01-soportes-index-renovado.json`, INDEX);
await copyFile(`${SEEDS}/01-parafiscales-2026-09.txt`, `${SOPORTES}/parafiscales-2026-09.txt`);
console.log("B paquete (armed before renewal):", await ls(hn));
show("B send:", await call("simular_envio", { caso: hn, confirmado: true }));
console.log("B ENVIO-SIMULADO.md exists:", envio(hn));
const pa = await call("armar_paquete", { caso: co });
console.log("C re-armar co:", pa.resumen);
const formulario = (await ls(co)).find((f) => f.startsWith("formulario."))!;
await rm(`out/${co}/paquete/${formulario}`);
console.log("C paquete:", await ls(co));
show("C send:", await call("simular_envio", { caso: co, confirmado: true }));
console.log("C ENVIO-SIMULADO.md exists:", envio(co));
for (const caso of [co, hn]) {
  const p = await call("armar_paquete", { caso });
  console.log(`D re-armar ${caso}: ${p.resumen}; paquete: ${JSON.stringify(await ls(caso))}`);
  const e = await call("simular_envio", { caso, confirmado: true });
  show(`D send ${caso}:`, { ok: e.ok, codigo: e.codigo ?? null, ruta: e.data?.ruta, bloqueos: e.data?.bloqueos });
  if (envio(caso)) {
    const t = await Bun.file(`out/${caso}/ENVIO-SIMULADO.md`).text();
    console.log(`D ENVIO ${caso} 'Archivos que se envían':`, JSON.stringify(t.split("## Archivos que se envían")[1]?.split("##")[0]?.trim()));
  }
}
