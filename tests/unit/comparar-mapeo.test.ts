import { describe, expect, test } from "bun:test";
import { compararMapeo, type ItemMapeo } from "../../src/domain/comparar-mapeo.ts";
import type { CampoMapeado } from "../../src/domain/mapeo.ts";
import type { EstadoCampo } from "../../src/domain/reglas.ts";

function campo(etiqueta: string, ruta: string | null, estado: EstadoCampo): CampoMapeado {
  return {
    etiqueta,
    ruta,
    estado,
    regla: ruta === null ? "sin_fuente" : "glosario_exacto",
    confianza: estado === "lleno" ? 1 : 0.6,
    valor: ruta === null ? null : `valor de ${ruta}`,
    nota: null,
    propuesta: null,
  };
}

const RELLENO: readonly CampoMapeado[] = Array.from({ length: 12 }, (_, indice) =>
  campo(`Campo ${indice + 1}`, `campo_${"x".repeat(indice + 1)}`, "lleno"),
);

const CANONICO: readonly CampoMapeado[] = [
  campo("Banco", "banco.nombre", "lleno"),
  campo("Número de cuenta", "banco.numero_cuenta", "lleno"),
  campo("RTN", "nit", "requiere_confirmacion"),
  campo("Referencias comerciales", null, "faltante"),
  ...RELLENO,
  campo("Titular de la cuenta", "banco.titular", "lleno"),
];

function proyectar(campos: readonly CampoMapeado[]): ItemMapeo[] {
  return campos.map(({ etiqueta, estado, ruta }) => ({ etiqueta, estado, ruta }));
}

function cambiar(items: readonly ItemMapeo[], etiqueta: string, cambio: Partial<ItemMapeo>): ItemMapeo[] {
  return items.map((item) => (item.etiqueta === etiqueta ? { ...item, ...cambio } : item));
}

const EXACTO = proyectar(CANONICO);

describe("compararMapeo (D-11)", () => {
  test("el canónico tiene 17 campos", () => {
    expect(CANONICO).toHaveLength(17);
  });

  test("la proyección exacta es igual", () => {
    expect(compararMapeo(CANONICO, EXACTO)).toEqual({ iguales: true });
  });

  test("el orden no importa", () => {
    expect(compararMapeo(CANONICO, [...EXACTO].reverse())).toEqual({ iguales: true });
  });

  test("una ruta distinta se reporta con la etiqueta canónica", () => {
    const recibido = cambiar(EXACTO, "Número de cuenta", { ruta: "banco.swift" });
    expect(compararMapeo(CANONICO, recibido)).toEqual({
      iguales: false,
      diferencias: ["ruta distinta: Número de cuenta"],
    });
  });

  test("una ruta null en un campo lleno es una ruta distinta", () => {
    const recibido = cambiar(EXACTO, "Banco", { ruta: null });
    expect(compararMapeo(CANONICO, recibido)).toEqual({
      iguales: false,
      diferencias: ["ruta distinta: Banco"],
    });
  });

  test("subir RTN de requiere_confirmacion a lleno es un estado distinto", () => {
    const recibido = cambiar(EXACTO, "RTN", { estado: "lleno" });
    expect(compararMapeo(CANONICO, recibido)).toEqual({
      iguales: false,
      diferencias: ["estado distinto: RTN"],
    });
  });

  test("un faltante con ruta inventada es una ruta distinta y un estado distinto", () => {
    const recibido = cambiar(EXACTO, "Referencias comerciales", { estado: "lleno", ruta: "sitio_web" });
    expect(compararMapeo(CANONICO, recibido)).toEqual({
      iguales: false,
      diferencias: ["ruta distinta: Referencias comerciales", "estado distinto: Referencias comerciales"],
    });
  });

  test("un campo ausente se reporta como falta", () => {
    const recibido = EXACTO.filter((item) => item.etiqueta !== "Banco");
    expect(compararMapeo(CANONICO, recibido)).toEqual({ iguales: false, diferencias: ["falta: Banco"] });
  });

  test("un item extra con etiqueta ajena se reporta por índice sin repetir su texto", () => {
    const recibido = [
      ...EXACTO,
      { etiqueta: "03100012345", estado: "lleno" as const, ruta: "banco.numero_cuenta" },
    ];
    const resultado = compararMapeo(CANONICO, recibido);
    expect(resultado).toEqual({ iguales: false, diferencias: ["sobrante: #17"] });
    expect(JSON.stringify(resultado)).not.toContain("03100012345");
  });

  test("una etiqueta repetida se reporta como duplicado", () => {
    const banco = EXACTO.find((item) => item.etiqueta === "Banco");
    if (banco === undefined) throw new Error("sin Banco");
    expect(compararMapeo(CANONICO, [...EXACTO, banco])).toEqual({
      iguales: false,
      diferencias: ["duplicado: Banco"],
    });
  });

  test("una etiqueta que difiere solo en mayúsculas no es canónica", () => {
    const recibido = EXACTO.map((item) =>
      item.etiqueta === "Banco" ? { ...item, etiqueta: "banco" } : item,
    );
    expect(compararMapeo(CANONICO, recibido)).toEqual({
      iguales: false,
      diferencias: ["falta: Banco", "sobrante: #0"],
    });
  });

  test("las diferencias van primero por etiqueta canónica y luego por índice", () => {
    const recibido = [
      { etiqueta: "intruso", estado: "lleno" as const, ruta: "pais" },
      ...cambiar(
        EXACTO.filter((item) => item.etiqueta !== "Titular de la cuenta"),
        "RTN",
        { estado: "lleno" },
      ),
      { etiqueta: "otro intruso", estado: "faltante" as const, ruta: null },
    ];
    expect(compararMapeo(CANONICO, recibido)).toEqual({
      iguales: false,
      diferencias: ["estado distinto: RTN", "falta: Titular de la cuenta", "sobrante: #0", "sobrante: #17"],
    });
  });
});
