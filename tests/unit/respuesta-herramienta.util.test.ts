import { describe, expect, test } from "bun:test";
import { cuerpoDeFallo } from "@/domain/utils/respuesta-herramienta.util.ts";

const FALLO = { codigo: "CASO_NO_ENCONTRADO", error: "No existe." };

describe("cuerpoDeFallo", () => {
  test("arma el sobre con ok, error, codigo y resumen en ese orden", () => {
    expect(JSON.stringify(cuerpoDeFallo(FALLO, "leer_solicitud: CASO_NO_ENCONTRADO"))).toBe(
      '{"ok":false,"error":"No existe.","codigo":"CASO_NO_ENCONTRADO","resumen":"leer_solicitud: CASO_NO_ENCONTRADO"}',
    );
  });

  test("sin resumen omite la clave", () => {
    expect(cuerpoDeFallo(FALLO, null)).toEqual({
      ok: false,
      error: "No existe.",
      codigo: "CASO_NO_ENCONTRADO",
    });
    expect(Object.hasOwn(cuerpoDeFallo(FALLO, null), "resumen")).toBe(false);
  });

  test("conserva el parcial antes del resumen", () => {
    const parcial = { casos_disponibles: ["co-a"] };
    expect(Object.keys(cuerpoDeFallo({ ...FALLO, parcial }, "r"))).toEqual([
      "ok",
      "error",
      "codigo",
      "parcial",
      "resumen",
    ]);
  });
});
