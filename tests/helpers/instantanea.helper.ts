import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import type { Instantanea, LineaBitacora, ValorComparable } from "@tests/helpers/types/instantanea.type.ts";
import { leerCeldasXlsx, leerMetadatosXlsx } from "@tests/helpers/xlsx-leer.helper.ts";
import { OUT_DIR } from "@/config/constants/files.constants.ts";

const CLAVE_MARCA_TIEMPO = "ts";

function comparar(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function sinMarcaDeTiempo(linea: string): LineaBitacora {
  const registro: LineaBitacora = JSON.parse(linea);
  delete registro[CLAVE_MARCA_TIEMPO];
  return registro;
}

async function celdasXlsx(ruta: string): Promise<ValorComparable> {
  const { hojas } = await leerMetadatosXlsx(ruta);
  const celdas = (await leerCeldasXlsx(ruta))
    .map(({ hoja, celda, valor, tipo, relleno, nota }) => ({ hoja, celda, valor, tipo, relleno, nota }))
    .sort((a, b) => comparar(a.hoja, b.hoja) || comparar(a.celda, b.celda));
  return { tipo: "xlsx", hojas, celdas };
}

async function valorComparable(ruta: string): Promise<ValorComparable> {
  const extension = extname(ruta);
  if (extension === ".xlsx") return celdasXlsx(ruta);
  const texto = await readFile(ruta);
  if (extension === ".jsonl") {
    const lineas = texto.toString("utf8").split("\n").filter(Boolean).map(sinMarcaDeTiempo);
    return { tipo: "jsonl", lineas };
  }
  return { tipo: "bytes", bytes: new Uint8Array(texto) };
}

export async function listarSalida(raiz: string): Promise<string[]> {
  const out = join(raiz, OUT_DIR);
  const entradas = await readdir(out, { recursive: true, withFileTypes: true });
  return entradas
    .filter((entrada) => entrada.isFile())
    .map((entrada) =>
      join(entrada.parentPath, entrada.name)
        .slice(out.length + 1)
        .split("\\")
        .join("/"),
    )
    .sort(comparar);
}

export async function tomarInstantanea(raiz: string): Promise<Instantanea> {
  const instantanea = new Map<string, ValorComparable>();
  for (const relativa of await listarSalida(raiz)) {
    instantanea.set(relativa, await valorComparable(join(raiz, OUT_DIR, relativa)));
  }
  return instantanea;
}
