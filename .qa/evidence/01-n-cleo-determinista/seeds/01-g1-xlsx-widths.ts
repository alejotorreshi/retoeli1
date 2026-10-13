import ExcelJS from "exceljs";
const root = process.argv[2] ?? process.cwd();
const casos = ["co-industrias-delta", "hn-agroexport-sula"];
for (const caso of casos) {
  const plant: { hoja: string; celda_etiqueta: string; celda_valor: string; etiqueta: string }[] = await Bun.file(
    `${root}/reto-01/fixtures/reto-01/casos/${caso}/plantilla-celdas.json`,
  ).json();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(`${root}/out/${caso}/formulario.xlsx`);
  console.log(`== ${caso}`);
  wb.eachSheet((ws) => {
    const widths = (ws.columns ?? []).map((c, i) => `${String.fromCharCode(65 + i)}=${c.width ?? "null"}`);
    console.log(`  sheet "${ws.name}" widths: ${widths.join(" ")}`);
  });
  let bold = 0;
  const wrapViolations: string[] = [];
  const wrapped: string[] = [];
  for (const e of plant) {
    const ws = wb.getWorksheet(e.hoja);
    if (!ws) { console.log("  MISSING SHEET", e.hoja); continue; }
    const lab = ws.getCell(e.celda_etiqueta);
    const val = ws.getCell(e.celda_valor);
    if (lab.font?.bold) bold++;
    for (const [kind, c] of [["label", lab], ["value", val]] as const) {
      const text = c.value === null || c.value === undefined ? "" : String(c.value);
      const longest = Math.max(0, ...text.split("\n").map((l) => l.length));
      const shouldWrap = text.length > 60 || text.includes("\n");
      const wraps = c.alignment?.wrapText === true;
      if (wraps) wrapped.push(`${e.hoja}!${c.address} (${kind}, len=${text.length}, longestLine=${longest}, newline=${text.includes("\n")})`);
      if (wraps !== shouldWrap) wrapViolations.push(`${e.hoja}!${c.address} ${kind} wraps=${wraps} len=${text.length}`);
    }
    const fill = (val.fill as { fgColor?: { argb?: string } } | undefined)?.fgColor?.argb ?? null;
    const note = val.note ?? lab.note ?? null;
    if (fill || note) console.log(`  marked ${e.hoja}!${e.celda_valor} "${e.etiqueta}" fill=${fill} note=${JSON.stringify(note)} valueEmpty=${val.value === null}`);
  }
  console.log(`  labels bold ${bold}/${plant.length}`);
  console.log(`  wrapped cells: ${wrapped.length ? wrapped.join("; ") : "none"}`);
  console.log(`  wrap rule violations (wrap iff len>60 or newline): ${wrapViolations.length ? wrapViolations.join("; ") : "none"}`);
}
