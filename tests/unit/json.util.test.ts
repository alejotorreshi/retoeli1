import { describe, expect, test } from "bun:test";
import { esRegistro, parsearJson } from "@/domain/utils/json.util.ts";

describe("parsearJson", () => {
  test("devuelve el valor de un JSON válido", () => {
    expect(parsearJson('{"a":1}')).toEqual({ ok: true, valor: { a: 1 } });
    expect(parsearJson("null")).toEqual({ ok: true, valor: null });
  });

  test("marca como fallido un texto que no es JSON", () => {
    expect(parsearJson("{a")).toEqual({ ok: false });
  });
});

describe("esRegistro", () => {
  test("acepta solo objetos planos", () => {
    expect(esRegistro({ a: 1 })).toBe(true);
    expect(esRegistro([])).toBe(false);
    expect(esRegistro(null)).toBe(false);
    expect(esRegistro("texto")).toBe(false);
  });
});
