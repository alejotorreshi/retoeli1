import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  acumular,
  casosEn,
  clavesLlm,
  costoUsd,
  escenarioDesdeUsos,
  evidenciaMedida,
  evidenciaPendiente,
  formatoUsd,
  fugasDeEvidencia,
  preciosEvidencia,
  redondear,
} from "@tests/helpers/costo.helper.ts";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
import type { CostoAcumulado, EvidenciaCosto, Tarifa, UsoAgregado } from "@tests/helpers/types/costo.type.ts";
import { z } from "zod";
import {
  ESCENARIO_GUION,
  ESTADO_EVIDENCIA_COSTO,
  PRECIOS_DEEPSEEK_FLASH,
  RUTA_EVIDENCIA_COSTO,
} from "@/config/constants/costo.constants.ts";
import { CASOS_DIR, FIXTURES_DIR } from "@/config/constants/files.constants.ts";

const RAIZ = join(import.meta.dir, "..", "..");
const MILLON = 1_000_000;
const PROVEEDOR = "deepseek";
const MODELO = "deepseek-flash";
const FECHA_CORRIDA = "2026-10-16T05:00:00.000Z";
const USOS_DE_PRUEBA: readonly UsoAgregado[] = [
  { entrada: 20_000, cacheHit: 15_000, salida: 500 },
  { entrada: 22_000, cacheHit: 19_000, salida: 300 },
];
const USOS_GUION: readonly UsoAgregado[] = [
  { entrada: 30_000, cacheHit: 0, salida: 1_000 },
  { entrada: 31_000, cacheHit: 29_000, salida: 200 },
  { entrada: 32_000, cacheHit: 31_000, salida: 100 },
];

const entero = z.number().int().nonnegative();
const usd = z.number().nonnegative();
const tarifaSchema = z.strictObject({ cacheHit: usd, cacheMiss: usd, salida: usd });
const preciosSchema = z.strictObject({
  fuente: z.url(),
  consultado: z.iso.date(),
  moneda: z.string().min(1),
  tokensPorUnidad: z.number().int().positive(),
  pico: tarifaSchema,
  valle: tarifaSchema,
});
const camposCosto = {
  turnos: entero,
  llamadas: entero,
  entrada: entero,
  cacheHit: entero,
  cacheMiss: entero,
  salida: entero,
  costoPicoUsd: usd,
  costoValleUsd: usd,
};
const costoSchema = z.strictObject(camposCosto);
const escenarioSchema = z.strictObject({ id: z.string().min(1), ...camposCosto });
const evidenciaSchema = z.discriminatedUnion("estado", [
  z.strictObject({
    estado: z.literal(ESTADO_EVIDENCIA_COSTO.MEDIDO),
    fechaCorridaUtc: z.iso.datetime(),
    proveedor: z.string().min(1),
    modelo: z.string().min(1),
    precios: preciosSchema,
    escenarios: z.array(escenarioSchema).min(1),
    total: costoSchema,
  }),
  z.strictObject({
    estado: z.literal(ESTADO_EVIDENCIA_COSTO.PENDIENTE),
    fechaCorridaUtc: z.null(),
    proveedor: z.null(),
    modelo: z.null(),
    precios: preciosSchema,
    escenarios: z.array(escenarioSchema).length(0),
    total: z.null(),
  }),
]) satisfies z.ZodType<EvidenciaCosto>;

function tarifaDe(tarifa: {
  readonly CACHE_HIT: number;
  readonly CACHE_MISS: number;
  readonly SALIDA: number;
}): Tarifa {
  return { cacheHit: tarifa.CACHE_HIT, cacheMiss: tarifa.CACHE_MISS, salida: tarifa.SALIDA };
}

const PICO = tarifaDe(PRECIOS_DEEPSEEK_FLASH.PICO);
const VALLE = tarifaDe(PRECIOS_DEEPSEEK_FLASH.VALLE);

async function leerEvidencia(): Promise<EvidenciaCosto> {
  return evidenciaSchema.parse(await Bun.file(join(RAIZ, RUTA_EVIDENCIA_COSTO)).json());
}

function recalculado(costo: CostoAcumulado): CostoAcumulado {
  return {
    ...costo,
    cacheMiss: costo.entrada - costo.cacheHit,
    costoPicoUsd: costoUsd(costo, PICO),
    costoValleUsd: costoUsd(costo, VALLE),
  };
}

describe("cálculo del costo por caso (D-86)", () => {
  test("costoUsd cobra el cache hit, el cache miss y la salida por millón con la tarifa dada", () => {
    expect(costoUsd({ entrada: MILLON, cacheHit: MILLON, salida: 0 }, PICO)).toBe(0.006);
    expect(costoUsd({ entrada: MILLON, cacheHit: MILLON, salida: 0 }, VALLE)).toBe(0.003);
    expect(costoUsd({ entrada: MILLON, cacheHit: 0, salida: MILLON }, PICO)).toBe(1.5);
    expect(costoUsd({ entrada: MILLON, cacheHit: 0, salida: MILLON }, VALLE)).toBe(0.75);
  });

  test("redondear deja seis decimales y formatoUsd cuatro", () => {
    expect(redondear(0.1234567)).toBe(0.123457);
    expect(redondear(0.000_000_4)).toBe(0);
    expect(formatoUsd(0.003564)).toBe("0.0036");
    expect(formatoUsd(1.5)).toBe("1.5000");
  });

  test("escenarioDesdeUsos suma las llamadas y deriva el cache miss y los dos costos", () => {
    expect(escenarioDesdeUsos("co-industrias-delta", 1, USOS_DE_PRUEBA)).toEqual({
      id: "co-industrias-delta",
      turnos: 1,
      llamadas: 2,
      entrada: 42_000,
      cacheHit: 34_000,
      cacheMiss: 8_000,
      salida: 800,
      costoPicoUsd: 0.003564,
      costoValleUsd: 0.001782,
    });
  });

  test("evidenciaMedida agrega los precios de las constantes y un total igual a las sumas", () => {
    const caso = escenarioDesdeUsos("co-industrias-delta", 1, USOS_DE_PRUEBA);
    const guion = escenarioDesdeUsos(ESCENARIO_GUION, 2, USOS_GUION);
    const evidencia = evidenciaMedida([caso, guion], FECHA_CORRIDA, PROVEEDOR, MODELO);

    expect(evidencia.estado).toBe(ESTADO_EVIDENCIA_COSTO.MEDIDO);
    expect(evidencia.fechaCorridaUtc).toBe(FECHA_CORRIDA);
    expect(evidencia.proveedor).toBe(PROVEEDOR);
    expect(evidencia.modelo).toBe(MODELO);
    expect(evidencia.precios).toEqual(preciosEvidencia());
    expect(evidencia.escenarios).toEqual([caso, guion]);
    expect(evidencia.total).toEqual({
      turnos: 3,
      llamadas: 5,
      entrada: 135_000,
      cacheHit: 94_000,
      cacheMiss: 41_000,
      salida: 2_100,
      costoPicoUsd: costoUsd({ entrada: 135_000, cacheHit: 94_000, salida: 2_100 }, PICO),
      costoValleUsd: costoUsd({ entrada: 135_000, cacheHit: 94_000, salida: 2_100 }, VALLE),
    });
    expect(evidencia.total).toEqual(acumular([caso, guion]));
    expect(evidenciaSchema.safeParse(evidencia).success).toBe(true);
  });

  test("evidenciaPendiente no trae fecha, modelo, escenarios ni total", () => {
    expect(evidenciaPendiente()).toEqual({
      estado: ESTADO_EVIDENCIA_COSTO.PENDIENTE,
      fechaCorridaUtc: null,
      proveedor: null,
      modelo: null,
      precios: preciosEvidencia(),
      escenarios: [],
      total: null,
    });
    expect(evidenciaSchema.safeParse(evidenciaPendiente()).success).toBe(true);
  });

  test("preciosEvidencia copia las tarifas de deepseek-flash con su fuente y su fecha", () => {
    expect(preciosEvidencia()).toEqual({
      fuente: PRECIOS_DEEPSEEK_FLASH.FUENTE,
      consultado: PRECIOS_DEEPSEEK_FLASH.CONSULTADO,
      moneda: PRECIOS_DEEPSEEK_FLASH.MONEDA,
      tokensPorUnidad: PRECIOS_DEEPSEEK_FLASH.TOKENS_POR_UNIDAD,
      pico: PICO,
      valle: VALLE,
    });
  });

  test("fugasDeEvidencia detecta un valor del maestro y una clave plantados", () => {
    const hoja = { ruta: "razon_social", valor: "Valor Plantado S.A.S." };
    const clave = "sk-clave-plantada";
    const limpia = JSON.stringify(evidenciaPendiente());
    expect(fugasDeEvidencia(limpia, [hoja], [clave])).toEqual([]);
    expect(fugasDeEvidencia(`${limpia}${hoja.valor}${clave}`, [hoja], [clave])).toEqual([hoja.ruta, "clave"]);
  });

  test("clavesLlm toma solo las claves no vacías del entorno", () => {
    expect(clavesLlm({ LLM_API_KEY: " ", DEEPSEEK_API_KEY: "sk-uno" })).toEqual(["sk-uno"]);
    expect(clavesLlm({})).toEqual([]);
  });
});

describe(`${RUTA_EVIDENCIA_COSTO} (D-98)`, () => {
  test("la evidencia commiteada cumple el esquema y cita los precios de las constantes", async () => {
    const evidencia = await leerEvidencia();
    expect(evidencia.precios).toEqual(preciosEvidencia());
  });

  test("pendiente no trae escenarios; medido trae los casos del fixture más el guion y cuadra cada costo", async () => {
    const evidencia = await leerEvidencia();
    if (evidencia.estado === ESTADO_EVIDENCIA_COSTO.PENDIENTE) {
      expect(evidencia.escenarios).toEqual([]);
      expect(evidencia.total).toBeNull();
      return;
    }
    const casos = await casosEn(join(RAIZ, FIXTURES_DIR, CASOS_DIR));
    expect(casos.length).toBeGreaterThan(0);
    expect(evidencia.escenarios.map((escenario) => escenario.id)).toEqual([...casos, ESCENARIO_GUION]);
    for (const escenario of evidencia.escenarios) {
      expect(escenario).toEqual({ ...recalculado(escenario), id: escenario.id });
      expect(escenario.turnos).toBeGreaterThan(0);
      expect(escenario.llamadas).toBeGreaterThanOrEqual(escenario.turnos);
    }
    expect(evidencia.total).toEqual(acumular(evidencia.escenarios));
  });

  test("la evidencia no lleva valores del maestro ni la clave del proveedor", async () => {
    const serializada = await Bun.file(join(RAIZ, RUTA_EVIDENCIA_COSTO)).text();
    const sensibles = await sensiblesDelProyecto(RAIZ);
    expect(sensibles.length).toBeGreaterThan(10);
    expect(fugasDeEvidencia(serializada, sensibles, clavesLlm(process.env))).toEqual([]);
  });
});
