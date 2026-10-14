import { readFile } from "node:fs/promises";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
const log = await readFile(process.argv[2] ?? "", "utf8");
const sens = await sensiblesDelProyecto(".");
const hits = sens.filter((h) => log.includes(h.valor)).map((h) => h.ruta);
console.log(`sensibles del maestro=${sens.length} apariciones en el log=${hits.length} ${JSON.stringify(hits)}`);
