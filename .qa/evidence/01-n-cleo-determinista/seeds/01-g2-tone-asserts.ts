import { existsSync } from "node:fs";
import { call } from "./qa-lib.ts";
const casos = ["co-industrias-delta", "ec-corp-andina", "hn-agroexport-sula", "pa-logistica-istmo"];
const enviar = ["ec-corp-andina", "hn-agroexport-sula"];
for (const caso of enviar) {
  const r = await call("simular_envio", { caso, confirmado: true });
  console.log("send", caso, JSON.stringify({ ok: r.ok, codigo: r.codigo ?? null, ruta: r.data?.ruta, bloqueos: r.data?.bloqueos }));
}
const reglas = await Bun.file("src/knowledge/reglas.json").json();
const maestro = await Bun.file("reto-01/fixtures/reto-01/repositorio/maestro.json").json();
const index: { tipo: string; descripcion: string }[] = await Bun.file("reto-01/fixtures/reto-01/repositorio/soportes/index.json").json();
const tipos = [...new Set(index.map((s) => s.tipo)), "certificado_cumplimiento_tributario"];
const notasReglas: string[] = [
  reglas.identificador_tributario.nota_extranjero,
  reglas.identificador_tributario.nota_generica.split("{{")[0],
  ...reglas.notas_contexto.map((n: { texto: string }) => n.texto.split("{{")[0]).filter((t: string) => t.trim().length > 3),
  reglas.soportes.aviso_emisor_distinto.split("{{")[0],
  "confirmar si el cliente lo acepta",
  "no existe en el maestro",
];
const bancoValores = Object.entries(maestro.banco).filter(([k, v]) => typeof v === "string" && String(v).length >= 4 && !(k === "titular" && v === maestro.razon_social)).map(([k, v]) => ({ k, v: String(v) }));
const NOMBRES = ["Certificación de aportes parafiscales", "Certificado de existencia y representación legal", "Registro Único Tributario", "Certificación bancaria", "Estados financieros", "Certificado de cumplimiento tributario", "Certificado ISO 9001"];
const sinArchivos = (t: string) => NOMBRES.reduce((acc, n) => acc.split(n).join("<nombre>"), t.replace(/[\w.-]+\.(txt|xlsx|pdf|md)\b/g, "<archivo>"));
const fallos: string[] = [];
const check = (cond: boolean, msg: string) => { console.log(cond ? "  PASS" : "  FAIL", msg); if (!cond) fallos.push(msg); };
const cierreEsperado: Record<string, RegExp> = {
  "co-industrias-delta": /queda listo para la firma/,
  "pa-logistica-istmo": /Con su confirmación pasaremos el formulario a la firma/,
  "ec-corp-andina": /todavía no está listo para la firma/,
  "hn-agroexport-sula": /todavía no está listo para la firma/,
};
for (const caso of casos) {
  console.log(`== ${caso}`);
  const b = await Bun.file(`out/${caso}/paquete/borrador-correo.md`).text();
  const ck = await Bun.file(`out/${caso}/paquete/checklist.md`).text();
  const mapeo = await Bun.file(`out/${caso}/mapeo.json`).json();
  const notasMapeo: string[] = mapeo.campos.map((c: { nota: string | null }) => c.nota).filter((n: string | null): n is string => !!n);
  check(!/\bfirmad[oa]\b/i.test(b), "no 'firmado' in borrador");
  check(cierreEsperado[caso]!.test(b), `closing line matches ${cierreEsperado[caso]}`);
  const faltantes: string[] = mapeo.campos.filter((c: { estado: string }) => c.estado === "faltante").map((c: { etiqueta: string }) => c.etiqueta);
  const seccionBlanco = b.split("quedan en blanco")[1]?.split("\n\n")[0] ?? "";
  const seccionSoportes = b.split("Quedan pendientes estos soportes:")[1]?.split("\n\n")[0] ?? "";
  for (const f of faltantes) {
    check(seccionBlanco.includes(`- ${f}`), `faltante "${f}" asked to client in 'quedan en blanco' section`);
    check(!seccionSoportes.includes(f), `faltante "${f}" not promised in 'Quedan pendientes estos soportes' section`);
  }
  check(!/Quedan pendientes:\s*\n/.test(b), "no generic 'Quedan pendientes:' mixing data and soportes");
  const porSeparado = (b.match(/por separado/g) ?? []).length;
  check(porSeparado <= 1 && (porSeparado === 0 || seccionSoportes.length > 0), `'por separado' only after the soportes section (count ${porSeparado})`);
  for (const n of [...new Set([...notasReglas, ...notasMapeo])]) check(!b.includes(n.trim()), `analyst note not in borrador: "${n.trim().slice(0, 50)}"`);
  const bancoRutas = mapeo.campos.filter((c: { ruta: string | null }) => c.ruta?.startsWith("banco.")).map((c: { etiqueta: string }) => c.etiqueta);
  for (const e of bancoRutas) check(!b.includes(e), `bank field label "${e}" not in borrador`);
  for (const { k } of bancoValores) check(!b.includes(maestro.banco[k]), `bank value banco.${k} not in borrador`);
  const textos = [["borrador", b], ["checklist", ck]] as const;
  for (const [nombre, t] of textos) {
    const limpio = sinArchivos(t);
    const crudos = tipos.filter((id) => new RegExp(`(^|[^\\w-])${id}([^\\w-]|$)`).test(limpio));
    const snake = limpio.match(/\b[a-z0-9]+_[a-z0-9_]+\b/g) ?? [];
    check(crudos.length === 0 && snake.length === 0, `${nombre}: no raw soporte id / snake_case (found ${JSON.stringify([...crudos, ...snake])})`);
  }
  const ext = (await call("armar_paquete", { caso })).data?.checklist?.soportes?.filter((s: { aviso_emisor: string | null }) => s.aviso_emisor) ?? [];
  for (const s of ext) {
    const nombre = index.find((i) => i.tipo === s.tipo) ? null : s.tipo;
    const accion = ck.split("\n").find((l) => l.startsWith("- [ ] Confirmar con el cliente si acepta el soporte") && l.includes(`emitido en ${s.pais_emisor}`) && (nombre === null || l.includes(nombre)));
    check(!!accion, `foreign-issuer ${s.tipo}: checklist action present`);
    if (s.estado === "presente") check(/emitidos en otro país; les agradecemos confirmarnos si los aceptan/.test(b) && b.includes(`(país emisor: ${s.pais_emisor})`), `foreign-issuer ${s.tipo} (presente): client question in borrador`);
    else console.log(`  NOTE foreign-issuer ${s.tipo} estado=${s.estado}: in checklist actions=${!!accion}; in borrador question=${b.split("emitidos en otro país")[1]?.split("\n\n")[0]?.includes("parafiscales") ?? false}`);
  }
}
for (const caso of enviar) {
  const p = `out/${caso}/ENVIO-SIMULADO.md`;
  console.log(`== ENVIO ${caso} exists=${existsSync(p)}`);
  if (!existsSync(p)) continue;
  const t = await Bun.file(p).text();
  const limpio = sinArchivos(t);
  const crudos = tipos.filter((id) => new RegExp(`(^|[^\\w-])${id}([^\\w-]|$)`).test(limpio));
  check(crudos.length === 0, `ENVIO ${caso}: no raw soporte id (found ${JSON.stringify(crudos)})`);
  check(!/checklist\.md|borrador-correo\.md/.test(t.split("## Archivos que se envían")[1]?.split("##")[0] ?? ""), `ENVIO ${caso}: no checklist/borrador in sent files`);
  check(!/\bfirmad[oa]\b/i.test(t), `ENVIO ${caso}: no 'firmado'`);
}
console.log(`TOTAL FAILS: ${fallos.length}`);
