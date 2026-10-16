import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type {
  CostoAcumulado,
  EscenarioCosto,
  EvidenciaCosto,
  PreciosEvidencia,
  Tarifa,
  UsoAgregado,
} from "@tests/helpers/types/costo.type.ts";
import type { HojaMaestro } from "@tests/helpers/types/pii.type.ts";
import {
  DECIMALES_COSTO,
  ESTADO_EVIDENCIA_COSTO,
  PRECIOS_DEEPSEEK_FLASH,
  RUTA_EVIDENCIA_COSTO,
} from "@/config/constants/costo.constants.ts";
import { ARCHIVOS_SISTEMA_IGNORADOS } from "@/config/constants/files.constants.ts";

const RAIZ_REPO = join(import.meta.dir, "..", "..");
const BIOME = join(RAIZ_REPO, "node_modules", ".bin", "biome");
const DECIMALES_USD = 4;
const SANGRIA_JSON = 2;
const ETIQUETA_CLAVE = "clave";
const VARIABLES_CLAVE = ["LLM_API_KEY", "DEEPSEEK_API_KEY"] as const;
const SIN_USO: UsoAgregado = { entrada: 0, cacheHit: 0, salida: 0 };

function tarifaDe(tarifa: {
  readonly CACHE_HIT: number;
  readonly CACHE_MISS: number;
  readonly SALIDA: number;
}): Tarifa {
  return { cacheHit: tarifa.CACHE_HIT, cacheMiss: tarifa.CACHE_MISS, salida: tarifa.SALIDA };
}

export function preciosEvidencia(): PreciosEvidencia {
  return {
    fuente: PRECIOS_DEEPSEEK_FLASH.FUENTE,
    consultado: PRECIOS_DEEPSEEK_FLASH.CONSULTADO,
    moneda: PRECIOS_DEEPSEEK_FLASH.MONEDA,
    tokensPorUnidad: PRECIOS_DEEPSEEK_FLASH.TOKENS_POR_UNIDAD,
    pico: tarifaDe(PRECIOS_DEEPSEEK_FLASH.PICO),
    valle: tarifaDe(PRECIOS_DEEPSEEK_FLASH.VALLE),
  };
}

export function redondear(valor: number): number {
  const factor = 10 ** DECIMALES_COSTO;
  return Math.round(valor * factor) / factor;
}

export function costoUsd(uso: UsoAgregado, tarifa: Tarifa): number {
  const cacheMiss = uso.entrada - uso.cacheHit;
  const bruto = uso.cacheHit * tarifa.cacheHit + cacheMiss * tarifa.cacheMiss + uso.salida * tarifa.salida;
  return redondear(bruto / PRECIOS_DEEPSEEK_FLASH.TOKENS_POR_UNIDAD);
}

function sumar(usos: readonly UsoAgregado[]): UsoAgregado {
  return usos.reduce(
    (suma, uso) => ({
      entrada: suma.entrada + uso.entrada,
      cacheHit: suma.cacheHit + uso.cacheHit,
      salida: suma.salida + uso.salida,
    }),
    SIN_USO,
  );
}

function costoDe(turnos: number, llamadas: number, uso: UsoAgregado): CostoAcumulado {
  const precios = preciosEvidencia();
  return {
    turnos,
    llamadas,
    entrada: uso.entrada,
    cacheHit: uso.cacheHit,
    cacheMiss: uso.entrada - uso.cacheHit,
    salida: uso.salida,
    costoPicoUsd: costoUsd(uso, precios.pico),
    costoValleUsd: costoUsd(uso, precios.valle),
  };
}

export function acumular(escenarios: readonly EscenarioCosto[]): CostoAcumulado {
  const turnos = escenarios.reduce((suma, escenario) => suma + escenario.turnos, 0);
  const llamadas = escenarios.reduce((suma, escenario) => suma + escenario.llamadas, 0);
  return costoDe(turnos, llamadas, sumar(escenarios));
}

export function escenarioDesdeUsos(id: string, turnos: number, usos: readonly UsoAgregado[]): EscenarioCosto {
  return { id, ...costoDe(turnos, usos.length, sumar(usos)) };
}

export function evidenciaMedida(
  escenarios: readonly EscenarioCosto[],
  fechaCorridaUtc: string,
  proveedor: string,
  modelo: string,
): EvidenciaCosto {
  return {
    estado: ESTADO_EVIDENCIA_COSTO.MEDIDO,
    fechaCorridaUtc,
    proveedor,
    modelo,
    precios: preciosEvidencia(),
    escenarios,
    total: acumular(escenarios),
  };
}

export function evidenciaPendiente(): EvidenciaCosto {
  return {
    estado: ESTADO_EVIDENCIA_COSTO.PENDIENTE,
    fechaCorridaUtc: null,
    proveedor: null,
    modelo: null,
    precios: preciosEvidencia(),
    escenarios: [],
    total: null,
  };
}

export function formatoUsd(valor: number): string {
  return valor.toFixed(DECIMALES_USD);
}

export async function escribirEvidencia(raiz: string, evidencia: EvidenciaCosto): Promise<void> {
  const ruta = join(raiz, RUTA_EVIDENCIA_COSTO);
  await mkdir(dirname(ruta), { recursive: true });
  await writeFile(ruta, `${JSON.stringify(evidencia, null, SANGRIA_JSON)}\n`);
  const formato = Bun.spawn([BIOME, "format", "--write", ruta], {
    cwd: raiz,
    stdout: "ignore",
    stderr: "pipe",
  });
  const codigo = await formato.exited;
  if (codigo !== 0) {
    throw new Error(`biome format salió con ${codigo}: ${await new Response(formato.stderr).text()}`);
  }
}

export async function casosEn(casosDir: string): Promise<string[]> {
  const entradas = await readdir(casosDir, { withFileTypes: true });
  return entradas
    .filter((entrada) => entrada.isDirectory() && !ARCHIVOS_SISTEMA_IGNORADOS.has(entrada.name))
    .map((entrada) => entrada.name)
    .sort();
}

export function clavesLlm(entorno: Readonly<Record<string, string | undefined>>): string[] {
  return VARIABLES_CLAVE.map((variable) => entorno[variable]?.trim() ?? "").filter((clave) => clave !== "");
}

export function fugasDeEvidencia(
  serializada: string,
  sensibles: readonly HojaMaestro[],
  claves: readonly string[],
): string[] {
  const maestro = sensibles.filter((hoja) => serializada.includes(hoja.valor)).map((hoja) => hoja.ruta);
  const clave = claves.some((valor) => serializada.includes(valor)) ? [ETIQUETA_CLAVE] : [];
  return [...maestro, ...clave];
}
