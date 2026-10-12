import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { z } from "zod";
import type { Lectura } from "../../application/puertos.ts";
import {
  ARCHIVOS_REPOSITORIO,
  FIXTURES_DIR,
  INDICE_SOPORTES,
  LIMITE_LECTURA_BYTES,
  PATRON_ARCHIVO_SOPORTE,
  SOPORTES_DIR,
} from "../../config/constantes.ts";
import type { SoporteIndice } from "../../domain/checklist.ts";
import type { Glosario, Maestro } from "../../domain/mapeo.ts";
import { esquemaGlosario, esquemaIndiceSoportes, esquemaMaestro } from "./esquemas.ts";

const NO_ENCONTRADO = { estado: "no_encontrado" } as const;
const INVALIDO = { estado: "invalido" } as const;
const CODIGOS_NO_ENCONTRADO: ReadonlySet<string> = new Set(["ENOENT", "ENOTDIR"]);

function esNoEncontrado(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) return false;
  return typeof error.code === "string" && CODIGOS_NO_ENCONTRADO.has(error.code);
}

function parsearJson(texto: string): { readonly ok: true; readonly valor: unknown } | { readonly ok: false } {
  try {
    return { ok: true, valor: JSON.parse(texto) };
  } catch {
    return { ok: false };
  }
}

export function resolverRaiz(directorio: string): string {
  return resolve(directorio);
}

export function rutaEnCaso(directorioCaso: string, archivo: string): string {
  return join(directorioCaso, archivo);
}

export async function existeArchivo(rutaAbs: string): Promise<boolean> {
  try {
    return (await stat(rutaAbs)).isFile();
  } catch {
    return false;
  }
}

export async function leerJsonValidado<T>(rutaAbs: string, esquema: z.ZodType<T>): Promise<Lectura<T>> {
  try {
    const info = await stat(rutaAbs);
    if (!info.isFile() || info.size > LIMITE_LECTURA_BYTES) return INVALIDO;
    const json = parsearJson(await readFile(rutaAbs, "utf8"));
    if (!json.ok) return INVALIDO;
    const validado = esquema.safeParse(json.valor);
    return validado.success ? { estado: "ok", valor: validado.data } : INVALIDO;
  } catch (error) {
    return esNoEncontrado(error) ? NO_ENCONTRADO : INVALIDO;
  }
}

export function leerMaestro(raiz: string): Promise<Lectura<Maestro>> {
  return leerJsonValidado(resolve(raiz, FIXTURES_DIR, ARCHIVOS_REPOSITORIO.maestro), esquemaMaestro);
}

export function leerGlosario(raiz: string): Promise<Lectura<Glosario>> {
  return leerJsonValidado(resolve(raiz, FIXTURES_DIR, ARCHIVOS_REPOSITORIO.glosario), esquemaGlosario);
}

export function directorioSoportes(raiz: string): string {
  return resolve(raiz, FIXTURES_DIR, SOPORTES_DIR);
}

export function leerIndiceSoportes(raiz: string): Promise<Lectura<readonly SoporteIndice[]>> {
  return leerJsonValidado(join(directorioSoportes(raiz), INDICE_SOPORTES), esquemaIndiceSoportes);
}

export async function soportesPresentes(raiz: string): Promise<ReadonlySet<string>> {
  try {
    const entradas = await readdir(directorioSoportes(raiz), { withFileTypes: true });
    return new Set(
      entradas
        .filter(
          (entrada) =>
            entrada.isFile() && entrada.name !== INDICE_SOPORTES && PATRON_ARCHIVO_SOPORTE.test(entrada.name),
        )
        .map((entrada) => entrada.name),
    );
  } catch {
    return new Set();
  }
}
