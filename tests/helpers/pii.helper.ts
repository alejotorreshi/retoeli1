import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { HojaMaestro } from "@tests/helpers/types/pii.type.ts";
import { ARCHIVOS_REPOSITORIO, FIXTURES_DIR } from "@/config/constants/files.constants.ts";
import { VARIABLES_NOTA_DEL_MAESTRO } from "@/config/constants/maestro.constants.ts";
import { TIPO_MASCARA } from "@/config/constants/pii.constants.ts";
import { POLITICA_PII } from "@/domain/policies/pii.policy.ts";

const LARGO_MINIMO_SENSIBLE = 5;
const RUTAS_EN_NOTAS: ReadonlySet<string> = new Set(VARIABLES_NOTA_DEL_MAESTRO.map(([, ruta]) => ruta));

function hojasDe(valor: unknown, ruta: string): HojaMaestro[] {
  if (typeof valor === "string") return [{ ruta, valor }];
  if (typeof valor === "number") return [{ ruta, valor: String(valor) }];
  if (Array.isArray(valor)) return valor.flatMap((elemento) => hojasDe(elemento, ruta));
  if (typeof valor !== "object" || valor === null) return [];
  return Object.entries(valor).flatMap(([clave, hijo]) =>
    hojasDe(hijo, ruta === "" ? clave : `${ruta}.${clave}`),
  );
}

function esPublica(hoja: HojaMaestro): boolean {
  return POLITICA_PII.get(hoja.ruta) === TIPO_MASCARA.PUBLICO;
}

export function sensiblesDelMaestro(maestro: unknown): HojaMaestro[] {
  const hojas = hojasDe(maestro, "");
  const publicos = new Set(hojas.filter(esPublica).map((hoja) => hoja.valor));
  return hojas.filter(
    (hoja) =>
      !esPublica(hoja) &&
      !RUTAS_EN_NOTAS.has(hoja.ruta) &&
      !publicos.has(hoja.valor) &&
      hoja.valor.length >= LARGO_MINIMO_SENSIBLE,
  );
}

export async function sensiblesDelProyecto(raiz: string): Promise<HojaMaestro[]> {
  const ruta = join(raiz, FIXTURES_DIR, ARCHIVOS_REPOSITORIO.maestro);
  return sensiblesDelMaestro(JSON.parse(await readFile(ruta, "utf8")));
}
