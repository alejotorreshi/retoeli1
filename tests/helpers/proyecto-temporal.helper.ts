import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
  ConocimientoTemporal,
  OpcionesProyecto,
  ProyectoTemporal,
} from "@tests/helpers/types/proyecto-temporal.type.ts";
import { CASOS_DIR, FIXTURES_DIR } from "@/config/constants/files.constants.ts";

const RAIZ_REPO = join(import.meta.dir, "..", "..");
const CASOS_SINTETICOS = join(RAIZ_REPO, "tests", "fixtures", "casos");
const CONOCIMIENTO = join(RAIZ_REPO, "src", "knowledge");

export async function crearProyectoTemporal(opciones: OpcionesProyecto = {}): Promise<ProyectoTemporal> {
  const raiz = await mkdtemp(join(tmpdir(), "proveedor-"));
  const fixtures = join(raiz, FIXTURES_DIR);
  const casosDir = join(fixtures, CASOS_DIR);
  await cp(join(RAIZ_REPO, FIXTURES_DIR), fixtures, { recursive: true });
  for (const nombre of opciones.sinteticos ?? []) {
    await cp(join(CASOS_SINTETICOS, nombre), join(casosDir, nombre), { recursive: true });
  }
  await writeFile(join(raiz, "package.json"), '{ "name": "proyecto-temporal", "private": true }\n');
  return {
    raiz,
    casosDir,
    limpiar: () => rm(raiz, { recursive: true, force: true }),
  };
}

export async function copiarConocimiento(): Promise<ConocimientoTemporal> {
  const base = await mkdtemp(join(tmpdir(), "conocimiento-"));
  const directorio = join(base, "knowledge");
  await cp(CONOCIMIENTO, directorio, { recursive: true });
  return {
    directorio,
    limpiar: () => rm(base, { recursive: true, force: true }),
  };
}
