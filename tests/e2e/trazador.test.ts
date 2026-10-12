import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { leer_solicitud } from "../../src/tools/proveedor.ts";

const RAIZ = join(import.meta.dir, "..", "..");
const CTX = { directory: RAIZ, sessionId: "trazador" };

type Respuesta = {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: string;
  codigo?: string;
  parcial?: Record<string, unknown>;
  resumen?: string;
};

async function leer(args: unknown): Promise<Respuesta> {
  const crudo = await leer_solicitud.execute(args, CTX);
  expect(typeof crudo).toBe("string");
  return JSON.parse(crudo);
}

describe("trazador: proveedor_leer_solicitud de punta a punta", () => {
  test("co-industrias-delta devuelve xlsx, CO, 17 campos en orden y 4 soportes", async () => {
    const respuesta = await leer({ caso: "co-industrias-delta" });
    expect(respuesta.ok).toBe(true);
    expect(respuesta.data).toMatchObject({
      caso: "co-industrias-delta",
      pais: "CO",
      cliente: "Industrias Delta S.A.S.",
      formato: "xlsx",
      plantilla: "plantilla-celdas.json",
      soportes: ["camara_comercio", "rut", "certificacion_bancaria", "estados_financieros"],
    });
    const campos = respuesta.data?.campos as { etiqueta: string; obligatorio: boolean | null }[];
    expect(campos).toHaveLength(17);
    expect(campos[0]).toEqual({ etiqueta: "Razón social", obligatorio: null });
    expect(campos.at(-1)).toEqual({ etiqueta: "Titular de la cuenta", obligatorio: null });
    expect(respuesta.resumen).toBe("co-industrias-delta: xlsx, CO, 17 campos, 4 soportes exigidos");
  });

  test("ec-corp-andina devuelve pdf con plantilla-campos.json", async () => {
    const respuesta = await leer({ caso: "ec-corp-andina" });
    expect(respuesta.ok).toBe(true);
    expect(respuesta.data).toMatchObject({ formato: "pdf", plantilla: "plantilla-campos.json", pais: "EC" });
    const campos = respuesta.data?.campos as { etiqueta: string; obligatorio: boolean | null }[];
    expect(campos[0]).toEqual({ etiqueta: "Nombre de la empresa", obligatorio: true });
  });

  test("pa-logistica-istmo devuelve portal con plantilla-campos.json", async () => {
    const respuesta = await leer({ caso: "pa-logistica-istmo" });
    expect(respuesta.ok).toBe(true);
    expect(respuesta.data).toMatchObject({
      formato: "portal",
      plantilla: "plantilla-campos.json",
      pais: "PA",
    });
  });

  test("la ejecución no escribe una carpeta out/ en el repositorio", async () => {
    await leer({ caso: "co-industrias-delta" });
    expect(existsSync(join(RAIZ, "out"))).toBe(false);
  });
});
