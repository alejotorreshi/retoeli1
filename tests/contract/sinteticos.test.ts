import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { leer_solicitud, mapear_campos } from "../../src/tools/proveedor.ts";
import { crearProyectoTemporal, type ProyectoTemporal } from "../helpers/proyecto-temporal.ts";

type Item = {
  etiqueta: string;
  ruta: string | null;
  estado: string;
  regla: string;
  confianza: number;
  valor_enmascarado: string | null;
  nota: string | null;
  propuesta: string | null;
};

type DatosMapeo = {
  caso: string;
  pais: string;
  conteo: { lleno: number; faltante: number; requiere_confirmacion: number };
  llenos: Item[];
  faltantes: Item[];
  requiere_confirmacion: Item[];
};

type Ambiguo = { etiqueta: string; estado: string; propuesta: string | null };

type DatosSolicitud = { caso: string; pais: string; campos: { etiqueta: string }[]; ambiguos: Ambiguo[] };

type Respuesta<D> = {
  ok: boolean;
  data?: D;
  error?: string;
  codigo?: string;
  parcial?: Record<string, unknown>;
};

const CASOS_REALES = ["co-industrias-delta", "ec-corp-andina", "hn-agroexport-sula", "pa-logistica-istmo"];
const SINTETICOS = ["zz-generica-co", "zz-generica-ec"];

let proyecto: ProyectoTemporal;
const fechaPrevia = process.env.FECHA_EJECUCION;

beforeAll(async () => {
  process.env.FECHA_EJECUCION = "2026-09-03";
  proyecto = await crearProyectoTemporal({ sinteticos: SINTETICOS });
});

afterAll(async () => {
  if (fechaPrevia === undefined) delete process.env.FECHA_EJECUCION;
  else process.env.FECHA_EJECUCION = fechaPrevia;
  await proyecto.limpiar();
});

function ctx(raiz: string = proyecto.raiz) {
  return { directory: raiz, sessionId: "sinteticos" };
}

async function leer(caso: string, raiz?: string): Promise<Respuesta<DatosSolicitud>> {
  return JSON.parse(await leer_solicitud.execute({ caso }, ctx(raiz)));
}

async function mapear(caso: string, raiz?: string): Promise<Respuesta<DatosMapeo>> {
  return JSON.parse(await mapear_campos.execute({ caso, campos: [] }, ctx(raiz)));
}

async function mapearOk(caso: string): Promise<DatosMapeo> {
  const respuesta = await mapear(caso);
  expect(respuesta.ok).toBe(true);
  if (respuesta.data === undefined) throw new Error(`sin data para ${caso}`);
  return respuesta.data;
}

function item(datos: DatosMapeo, etiqueta: string): Item {
  const encontrado = [...datos.llenos, ...datos.faltantes, ...datos.requiere_confirmacion].find(
    (candidato) => candidato.etiqueta === etiqueta,
  );
  if (encontrado === undefined) throw new Error(`sin item ${etiqueta}`);
  return encontrado;
}

describe("sintéticos: leer_solicitud reporta etiquetas ambiguas (SOLI-02)", () => {
  test("zz-generica-co propone NIT para Identificación tributaria", async () => {
    const respuesta = await leer("zz-generica-co");
    expect(respuesta.ok).toBe(true);
    expect(respuesta.data?.campos).toHaveLength(6);
    expect(respuesta.data?.ambiguos).toEqual([
      { etiqueta: "Identificación tributaria", estado: "requiere_confirmacion", propuesta: "NIT" },
    ]);
  });

  test("zz-generica-ec propone RUC para Número de identificación fiscal", async () => {
    const respuesta = await leer("zz-generica-ec");
    expect(respuesta.ok).toBe(true);
    expect(respuesta.data?.ambiguos).toEqual([
      { etiqueta: "Número de identificación fiscal", estado: "requiere_confirmacion", propuesta: "RUC" },
    ]);
  });

  for (const caso of CASOS_REALES) {
    test(`${caso} no tiene etiquetas ambiguas`, async () => {
      const respuesta = await leer(caso);
      expect(respuesta.ok).toBe(true);
      expect(respuesta.data?.ambiguos).toEqual([]);
    });
  }
});

describe("sintéticos: mapear_campos ejercita las reglas que los casos reales no tocan (DEMO-04)", () => {
  test("zz-generica-co da cada regla con su confianza en el orden de la plantilla", async () => {
    const datos = await mapearOk("zz-generica-co");
    const esperado: readonly (readonly [string, string, string, number, string | null])[] = [
      ["Identificación tributaria", "requiere_confirmacion", "etiqueta_generica", 0.5, "nit"],
      ["RAZON SOCIAL:", "lleno", "glosario_normalizado", 0.95, "razon_social"],
      ["Teléfono *", "lleno", "glosario_normalizado", 0.95, "telefono"],
      ["Sitio web", "lleno", "clave_directa", 0.85, "sitio_web"],
      ["Gran contribuyente", "faltante", "sin_fuente", 0, null],
      ["constructor", "faltante", "sin_fuente", 0, null],
    ];
    for (const [etiqueta, estado, regla, confianza, ruta] of esperado) {
      expect(item(datos, etiqueta)).toMatchObject({ estado, regla, confianza, ruta });
    }
    expect(datos.conteo).toEqual({ lleno: 3, faltante: 2, requiere_confirmacion: 1 });
  });

  test("la etiqueta genérica en CO también pide confirmación y propone NIT sin nota de extranjero", async () => {
    const generica = item(await mapearOk("zz-generica-co"), "Identificación tributaria");
    expect(generica.propuesta).toBe("NIT");
    expect(generica.nota).toContain("el equivalente en CO es NIT");
    expect(generica.nota).not.toContain("Identificador extranjero");
  });

  test("un booleano del maestro y una clave del prototipo quedan faltantes sin valor", async () => {
    const datos = await mapearOk("zz-generica-co");
    for (const etiqueta of ["Gran contribuyente", "constructor"]) {
      expect(item(datos, etiqueta).valor_enmascarado).toBeNull();
    }
  });

  test("zz-generica-ec marca la etiqueta genérica con la nota de identificador extranjero", async () => {
    const datos = await mapearOk("zz-generica-ec");
    const generica = item(datos, "Número de identificación fiscal");
    expect(generica).toMatchObject({
      estado: "requiere_confirmacion",
      regla: "etiqueta_generica",
      confianza: 0.5,
      propuesta: "RUC",
    });
    expect(generica.nota).toContain("Identificador extranjero");
    expect(item(datos, "Nombre de la empresa")).toMatchObject({ estado: "lleno", regla: "glosario_exacto" });
  });
});
