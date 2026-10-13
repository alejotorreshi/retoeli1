import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { copyFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { generar_formulario, leer_solicitud, mapear_campos } from "../../src/tools/proveedor.ts";
import { generarCaso } from "../helpers/flujo.ts";
import { extraerTrazos } from "../helpers/pdf-texto.ts";
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

type DatosSolicitud = {
  caso: string;
  pais: string;
  plantilla: string;
  campos: { etiqueta: string }[];
  ambiguos: Ambiguo[];
};

type Respuesta<D> = {
  ok: boolean;
  data?: D;
  error?: string;
  codigo?: string;
  parcial?: Record<string, unknown>;
};

const CASOS_REALES = ["co-industrias-delta", "ec-corp-andina", "hn-agroexport-sula", "pa-logistica-istmo"];
const SINTETICOS = ["zz-generica-co", "zz-generica-ec", "zz-plantilla-corrupta"];

let proyecto: ProyectoTemporal;
const adicionales: ProyectoTemporal[] = [];
const fechaPrevia = process.env.FECHA_EJECUCION;

beforeAll(async () => {
  process.env.FECHA_EJECUCION = "2026-09-03";
  proyecto = await crearProyectoTemporal({ sinteticos: SINTETICOS });
});

afterAll(async () => {
  if (fechaPrevia === undefined) delete process.env.FECHA_EJECUCION;
  else process.env.FECHA_EJECUCION = fechaPrevia;
  await proyecto.limpiar();
  await Promise.all(adicionales.map((adicional) => adicional.limpiar()));
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
      ["Gran contribuyente", "requiere_confirmacion", "clave_directa", 0.85, "gran_contribuyente"],
      ["constructor", "faltante", "sin_fuente", 0, null],
    ];
    for (const [etiqueta, estado, regla, confianza, ruta] of esperado) {
      expect(item(datos, etiqueta)).toMatchObject({ estado, regla, confianza, ruta });
    }
    expect(datos.conteo).toEqual({ lleno: 3, faltante: 1, requiere_confirmacion: 2 });
  });

  test("la etiqueta genérica en CO también pide confirmación y propone NIT sin nota de extranjero", async () => {
    const generica = item(await mapearOk("zz-generica-co"), "Identificación tributaria");
    expect(generica.propuesta).toBe("NIT");
    expect(generica.nota).toContain("el equivalente en CO es NIT");
    expect(generica.nota).not.toContain("Identificador extranjero");
  });

  test("un booleano del maestro pide confirmación y una clave del prototipo queda faltante, ambos sin valor", async () => {
    const datos = await mapearOk("zz-generica-co");
    expect(item(datos, "Gran contribuyente")).toMatchObject({
      estado: "requiere_confirmacion",
      valor_enmascarado: null,
      nota: "El maestro tiene este dato, pero no como texto: confirmar qué valor escribir",
    });
    expect(item(datos, "constructor")).toMatchObject({ estado: "faltante", valor_enmascarado: null });
  });

  test("generar_formulario acepta el booleano por confirmar y lo deja sin valor en el PDF", async () => {
    const flujo = await generarCaso({ mapear_campos, generar_formulario }, ctx(), "zz-generica-co");
    expect(flujo.respuesta.ok).toBe(true);
    const bytes = await readFile(join(proyecto.raiz, "out", "zz-generica-co", "formulario.pdf"));
    const textos = (await extraerTrazos(new Uint8Array(bytes))).map((trazo) => trazo.texto);
    expect(textos[textos.indexOf("Gran contribuyente *") + 1]).toBe("[POR CONFIRMAR]");
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

describe("sintéticos: un caso con las dos plantillas elige por formato (HU-1, IN-07)", () => {
  test("co (xlsx) usa plantilla-celdas.json y ec (pdf) usa plantilla-campos.json", async () => {
    const aislado = await crearProyectoTemporal();
    adicionales.push(aislado);
    const co = join(aislado.casosDir, "co-industrias-delta");
    const ec = join(aislado.casosDir, "ec-corp-andina");
    await copyFile(join(ec, "plantilla-campos.json"), join(co, "plantilla-campos.json"));
    await copyFile(join(co, "plantilla-celdas.json"), join(ec, "plantilla-celdas.json"));
    const leidaCo = await leer("co-industrias-delta", aislado.raiz);
    const leidaEc = await leer("ec-corp-andina", aislado.raiz);
    expect(leidaCo.data).toMatchObject({ plantilla: "plantilla-celdas.json" });
    expect(leidaCo.data?.campos).toHaveLength(17);
    expect(leidaEc.data).toMatchObject({ plantilla: "plantilla-campos.json" });
    expect(leidaEc.data?.campos).toHaveLength(15);
  });
});

describe("sintéticos: plantilla con forma inválida (D-17)", () => {
  const parcialEsperado = {
    pais: "CO",
    cliente: "Cliente Sintético Plantilla Corrupta S.A.S.",
    formato: "xlsx",
    soportes: ["camara_comercio", "rut"],
  };

  test("leer_solicitud da PLANTILLA_INVALIDA con país, cliente, formato y soportes", async () => {
    const respuesta = await leer("zz-plantilla-corrupta");
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("PLANTILLA_INVALIDA");
    expect(respuesta.parcial).toEqual(parcialEsperado);
  });

  test("mapear_campos da PLANTILLA_INVALIDA con el mismo parcial", async () => {
    const respuesta = await mapear("zz-plantilla-corrupta");
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("PLANTILLA_INVALIDA");
    expect(respuesta.parcial).toEqual(parcialEsperado);
  });
});

describe("sintéticos: concurrencia sobre el mismo caso (SEG-02)", () => {
  test("dos mapear_campos simultáneos sobre co dejan un mapeo.json completo y dos líneas de log válidas", async () => {
    const aislado = await crearProyectoTemporal();
    adicionales.push(aislado);
    const respuestas = await Promise.all([
      mapear("co-industrias-delta", aislado.raiz),
      mapear("co-industrias-delta", aislado.raiz),
    ]);
    for (const respuesta of respuestas) expect(respuesta.ok).toBe(true);
    const carpeta = join(aislado.raiz, "out", "co-industrias-delta");
    const mapeo = JSON.parse(await readFile(join(carpeta, "mapeo.json"), "utf8"));
    expect(mapeo.campos).toHaveLength(17);
    const lineas = (await readFile(join(carpeta, "log.jsonl"), "utf8"))
      .split("\n")
      .filter((linea) => linea !== "");
    expect(lineas).toHaveLength(2);
    for (const linea of lineas) expect(() => JSON.parse(linea)).not.toThrow();
  });
});
