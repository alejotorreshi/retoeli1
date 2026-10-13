import ExcelJS from "exceljs";
import { call, proyectar } from "./qa-lib.ts";
const caso = "co-industrias-delta";
await call("leer_solicitud", { caso });
const m = await call("mapear_campos", { caso, campos: [] });
console.log("conteo:", JSON.stringify(m.data.conteo));
console.log("faltantes:", JSON.stringify(m.data.faltantes.map((f: any) => ({ etiqueta: f.etiqueta, ruta: f.ruta, estado: f.estado }))));
const g = await call("generar_formulario", { caso, mapeo: proyectar(m) });
console.log("generar:", g.resumen);
const p = await call("armar_paquete", { caso });
console.log("armar:", p.resumen, JSON.stringify(p.data?.bloqueos));
const plant = await Bun.file(`reto-01/fixtures/reto-01/casos/${caso}/plantilla-celdas.json`).json();
const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile(`out/${caso}/formulario.xlsx`);
for (const e of plant.filter((x: any) => ["Ciudad"].includes(x.etiqueta) || /ciiu/i.test(x.etiqueta))) {
  const c = wb.getWorksheet(e.hoja)!.getCell(e.celda_valor);
  console.log("cell", e.etiqueta, e.celda_valor, JSON.stringify(c.value), "fill:", (c.fill as any)?.fgColor?.argb, "note:", JSON.stringify(c.note));
}
