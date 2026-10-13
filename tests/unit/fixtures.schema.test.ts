import { describe, expect, test } from "bun:test";
import { cellTemplateSchema, supportIndexSchema } from "@/infra/fixtures/schemas/fixtures.schema.ts";

type Entrada = { hoja: string; celda_etiqueta: string; etiqueta: string; celda_valor: string };

const CO = new URL(
  "../../reto-01/fixtures/reto-01/casos/co-industrias-delta/plantilla-celdas.json",
  import.meta.url,
);
const HN = new URL(
  "../../reto-01/fixtures/reto-01/casos/hn-agroexport-sula/plantilla-celdas.json",
  import.meta.url,
);

function entrada(cambios: Partial<Entrada> = {}): Entrada {
  return { hoja: "Datos", celda_etiqueta: "B3", etiqueta: "Razón social", celda_valor: "C3", ...cambios };
}

function valida(campos: readonly Entrada[]): boolean {
  return cellTemplateSchema.safeParse(campos).success;
}

describe("cellTemplateSchema acepta solo lo que el xlsx puede escribir (WR-08)", () => {
  test("las plantillas de co y hn son válidas", async () => {
    for (const ruta of [CO, HN]) expect(valida(JSON.parse(await Bun.file(ruta).text()))).toBe(true);
  });

  test("acepta un nombre de 31 caracteres, apóstrofes internos y la última celda de la hoja", () => {
    expect(valida([entrada({ hoja: "a".repeat(31) })])).toBe(true);
    expect(valida([entrada({ hoja: "Datos d'Ávila" })])).toBe(true);
    expect(valida([entrada({ celda_valor: "XFD1048576" })])).toBe(true);
  });

  for (const hoja of [
    "",
    "a".repeat(32),
    "Datos*",
    "A/B",
    "A\\B",
    "¿Qué?",
    "Hoja:1",
    "[x]",
    "'Datos",
    "Datos'",
  ]) {
    test(`rechaza el nombre de hoja ${JSON.stringify(hoja)}`, () => {
      expect(valida([entrada({ hoja })])).toBe(false);
    });
  }

  test("rechaza la hoja reservada History en cualquier grafía", () => {
    for (const hoja of ["History", "history", "HISTORY"]) expect(valida([entrada({ hoja })])).toBe(false);
  });

  test("rechaza columnas después de XFD y filas después de 1048576", () => {
    expect(valida([entrada({ celda_valor: "XFE1" })])).toBe(false);
    expect(valida([entrada({ celda_valor: "ZZZ1" })])).toBe(false);
    expect(valida([entrada({ celda_valor: "A1048577" })])).toBe(false);
  });

  test("rechaza la misma hoja escrita con mayúsculas distintas", () => {
    expect(valida([entrada(), entrada({ hoja: "datos", celda_etiqueta: "B4", celda_valor: "C4" })])).toBe(
      false,
    );
  });

  test("rechaza dos campos que escriben en la misma celda, sea de etiqueta o de valor", () => {
    expect(valida([entrada(), entrada({ etiqueta: "NIT", celda_etiqueta: "B4" })])).toBe(false);
    expect(valida([entrada(), entrada({ etiqueta: "NIT", celda_etiqueta: "C3", celda_valor: "C4" })])).toBe(
      false,
    );
    expect(valida([entrada({ celda_valor: "B3" })])).toBe(false);
  });

  test("la misma celda en hojas distintas no choca", () => {
    expect(valida([entrada(), entrada({ hoja: "Banco" })])).toBe(true);
  });
});

describe("supportIndexSchema (T-01-16)", () => {
  const valida = {
    tipo: "rut",
    archivo: "rut-2026.txt",
    vigencia_hasta: null,
    pais_emisor: "CO",
    descripcion: "Registro Único Tributario",
  };

  test("acepta una entrada válida con y sin vigencia", () => {
    expect(supportIndexSchema.safeParse([valida, { ...valida, vigencia_hasta: "2026-09-30" }]).success).toBe(
      true,
    );
  });

  for (const archivo of [
    "../maestro.json",
    "a..b.txt",
    "checklist.md",
    "formulario.xlsx",
    "Rut.txt",
    "a/b",
  ]) {
    test(`rechaza el archivo "${archivo}"`, () => {
      expect(supportIndexSchema.safeParse([{ ...valida, archivo }]).success).toBe(false);
    });
  }

  test("rechaza una fecha inexistente, un país en minúsculas y claves extra", () => {
    expect(supportIndexSchema.safeParse([{ ...valida, vigencia_hasta: "2026-02-31" }]).success).toBe(false);
    expect(supportIndexSchema.safeParse([{ ...valida, pais_emisor: "co" }]).success).toBe(false);
    expect(supportIndexSchema.safeParse([{ ...valida, extra: 1 }]).success).toBe(false);
  });
});
