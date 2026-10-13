import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  type ConocimientoTemporal,
  copiarConocimiento,
  crearProyectoTemporal,
  type ProyectoTemporal,
} from "@tests/helpers/proyecto-temporal.ts";
import { crearHerramientas } from "@/tools/fabrica.ts";
import { mapear_campos } from "@/tools/proveedor.ts";

const NOTA_EXTRANJERO = "Identificador extranjero: confirmar si el cliente acepta el NIT colombiano";
const CLAVES_ITEM = [
  "confianza",
  "estado",
  "etiqueta",
  "nota",
  "propuesta",
  "regla",
  "ruta",
  "valor_enmascarado",
].sort();

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
  mapeo: string;
};

type Respuesta = {
  ok: boolean;
  data?: DatosMapeo;
  error?: string;
  codigo?: string;
  parcial?: Record<string, unknown>;
  resumen?: string;
};

const RUTA_REGLAS_REPO = join(import.meta.dir, "..", "..", "src", "knowledge", "reglas.json");
const SENSIBLES = ["03100012345", "71555123", "COLOCOBM", "900123456"];

const proyectos: ProyectoTemporal[] = [];
const conocimientos: ConocimientoTemporal[] = [];
let compartido: ProyectoTemporal;
const fechaPrevia = process.env.FECHA_EJECUCION;

async function nuevoProyecto(): Promise<ProyectoTemporal> {
  const proyecto = await crearProyectoTemporal();
  proyectos.push(proyecto);
  return proyecto;
}

beforeAll(async () => {
  process.env.FECHA_EJECUCION = "2026-09-03";
  compartido = await nuevoProyecto();
});

afterAll(async () => {
  if (fechaPrevia === undefined) delete process.env.FECHA_EJECUCION;
  else process.env.FECHA_EJECUCION = fechaPrevia;
  await Promise.all(proyectos.map((proyecto) => proyecto.limpiar()));
  await Promise.all(conocimientos.map((conocimiento) => conocimiento.limpiar()));
});

async function mapearCrudo(args: unknown, raiz: string = compartido.raiz): Promise<string> {
  const crudo = await mapear_campos.execute(args, { directory: raiz, sessionId: "golden" });
  expect(typeof crudo).toBe("string");
  return crudo;
}

async function mapear(caso: string, campos: readonly string[] = []): Promise<Respuesta> {
  return JSON.parse(await mapearCrudo({ caso, campos }));
}

async function mapearOk(caso: string, campos: readonly string[] = []): Promise<DatosMapeo> {
  const respuesta = await mapear(caso, campos);
  expect(respuesta.ok).toBe(true);
  if (respuesta.data === undefined) throw new Error(`sin data para ${caso}`);
  return respuesta.data;
}

function todos(datos: DatosMapeo): Item[] {
  return [...datos.llenos, ...datos.faltantes, ...datos.requiere_confirmacion];
}

function item(datos: DatosMapeo, etiqueta: string): Item {
  const encontrado = todos(datos).find((candidato) => candidato.etiqueta === etiqueta);
  if (encontrado === undefined) throw new Error(`sin item ${etiqueta}`);
  return encontrado;
}

async function nuevoConocimiento(): Promise<ConocimientoTemporal> {
  const conocimiento = await copiarConocimiento();
  conocimientos.push(conocimiento);
  return conocimiento;
}

type DocumentoMapeo = {
  caso: string;
  pais: string;
  fecha_ejecucion: string;
  campos: Item[];
};

async function leerMapeo(raiz: string, caso: string): Promise<{ texto: string; documento: DocumentoMapeo }> {
  const texto = await readFile(join(raiz, "out", caso, "mapeo.json"), "utf8");
  return { texto, documento: JSON.parse(texto) };
}

function tieneLlave(valor: unknown, llave: string): boolean {
  if (Array.isArray(valor)) return valor.some((elemento) => tieneLlave(elemento, llave));
  if (typeof valor !== "object" || valor === null) return false;
  return Object.entries(valor).some(([clave, hijo]) => clave === llave || tieneLlave(hijo, llave));
}

async function lineas(ruta: string): Promise<string[]> {
  return (await readFile(ruta, "utf8")).trim().split("\n");
}

describe("golden: proveedor_mapear_campos sobre los cuatro casos reales (D-21)", () => {
  const tabla: readonly [string, string, number, number, number][] = [
    ["co-industrias-delta", "CO", 17, 0, 0],
    ["ec-corp-andina", "EC", 13, 1, 1],
    ["hn-agroexport-sula", "HN", 9, 1, 1],
    ["pa-logistica-istmo", "PA", 8, 0, 1],
  ];

  for (const [caso, pais, lleno, faltante, requiere_confirmacion] of tabla) {
    test(`${caso} da ${lleno}/${faltante}/${requiere_confirmacion}`, async () => {
      const datos = await mapearOk(caso);
      expect(datos.caso).toBe(caso);
      expect(datos.pais).toBe(pais);
      expect(datos.conteo).toEqual({ lleno, faltante, requiere_confirmacion });
      expect(datos.llenos).toHaveLength(lleno);
      expect(datos.faltantes).toHaveLength(faltante);
      expect(datos.requiere_confirmacion).toHaveLength(requiere_confirmacion);
      expect(datos.mapeo).toBe(`out/${caso}/mapeo.json`);
    });
  }

  test("ec RUC queda por regla de país con la nota de identificador extranjero", async () => {
    const ruc = item(await mapearOk("ec-corp-andina"), "RUC");
    expect(ruc).toEqual({
      etiqueta: "RUC",
      ruta: "nit",
      estado: "requiere_confirmacion",
      regla: "regla_pais",
      confianza: 0.6,
      valor_enmascarado: "•••••3456",
      nota: NOTA_EXTRANJERO,
      propuesta: null,
    });
  });

  test("los faltantes de ec y hn tienen ruta null y sin valor", async () => {
    const especial = item(await mapearOk("ec-corp-andina"), "Número de contribuyente especial");
    const referencias = item(await mapearOk("hn-agroexport-sula"), "Referencias comerciales");
    for (const faltante of [especial, referencias]) {
      expect(faltante.estado).toBe("faltante");
      expect(faltante.ruta).toBeNull();
      expect(faltante.valor_enmascarado).toBeNull();
    }
  });

  test("las máscaras D-07 llegan así al llamador", async () => {
    const co = await mapearOk("co-industrias-delta");
    const ec = await mapearOk("ec-corp-andina");
    const pa = await mapearOk("pa-logistica-istmo");
    const hn = await mapearOk("hn-agroexport-sula");
    expect(item(co, "Número de cuenta").valor_enmascarado).toBe("•••••••2345");
    expect(item(ec, "SWIFT").valor_enmascarado).toBe("••••COBM");
    expect(item(pa, "Representante legal").valor_enmascarado).toBe("R. A. S.");
    expect(item(hn, "Correo electrónico").valor_enmascarado).toBe("l•••@periferia-ficticia.com");
    const ingresos = item(hn, "Ingresos anuales");
    expect(ingresos.valor_enmascarado).toBe("[monto oculto]");
    expect(ingresos.nota).toBe("COP, año 2025");
  });

  test("cada item tiene exactamente las ocho llaves del contrato y ninguna llamada valor", async () => {
    for (const caso of [
      "co-industrias-delta",
      "ec-corp-andina",
      "hn-agroexport-sula",
      "pa-logistica-istmo",
    ]) {
      const crudo = await mapearCrudo({ caso, campos: [] });
      expect(crudo).not.toContain('"valor":');
      const respuesta: Respuesta = JSON.parse(crudo);
      if (respuesta.data === undefined) throw new Error(`sin data para ${caso}`);
      for (const campo of todos(respuesta.data)) {
        expect(Object.keys(campo).sort()).toEqual(CLAVES_ITEM);
      }
    }
  });

  test("la respuesta nunca trae los valores crudos sensibles del maestro", async () => {
    const crudo = await mapearCrudo({ caso: "co-industrias-delta", campos: [] });
    for (const sensible of SENSIBLES) {
      expect(crudo).not.toContain(sensible);
    }
  });
});

describe("golden: bitácora de mapear_campos (SEG-04)", () => {
  test("cada llamada agrega una línea al log global y al del caso, sin valores", async () => {
    const proyecto = await nuevoProyecto();
    await mapearCrudo({ caso: "ec-corp-andina", campos: [] }, proyecto.raiz);
    const global = await lineas(join(proyecto.raiz, "out", "log.jsonl"));
    const delCaso = await lineas(join(proyecto.raiz, "out", "ec-corp-andina", "log.jsonl"));
    expect(global).toHaveLength(1);
    expect(delCaso).toHaveLength(1);
    const linea = JSON.parse(global[0] ?? "{}");
    expect(linea.herramienta).toBe("proveedor_mapear_campos");
    expect(linea.ok).toBe(true);
    expect(linea.resumen).toBe("ec-corp-andina: 13 llenos, 1 faltantes, 1 por confirmar");
    for (const sensible of ["900123456", "COLOCOBM", "3456"]) {
      expect(global.join("\n")).not.toContain(sensible);
      expect(delCaso.join("\n")).not.toContain(sensible);
    }
  });
});

describe("golden: reglas cargadas en cada ejecución (D-28)", () => {
  test("copiarConocimiento devuelve una copia con reglas.json idéntico byte a byte", async () => {
    const conocimiento = await nuevoConocimiento();
    const copia = await readFile(join(conocimiento.directorio, "reglas.json"));
    const original = await readFile(RUTA_REGLAS_REPO);
    expect(copia.equals(original)).toBe(true);
  });

  test("crearHerramientas con un reglas.json roto da REGLAS_INVALIDAS con la ruta de la llave", async () => {
    const conocimiento = await nuevoConocimiento();
    const rutaReglas = join(conocimiento.directorio, "reglas.json");
    const reglas = JSON.parse(await readFile(rutaReglas, "utf8"));
    reglas.confianza.umbral = 2;
    await writeFile(rutaReglas, JSON.stringify(reglas));
    const { mapear_campos: mapearRoto } = crearHerramientas({
      directorioConocimiento: conocimiento.directorio,
    });
    const crudo = await mapearRoto.execute(
      { caso: "co-industrias-delta", campos: [] },
      { directory: compartido.raiz },
    );
    const respuesta: Respuesta = JSON.parse(crudo);
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("REGLAS_INVALIDAS");
    expect(respuesta.error).toContain("confianza.umbral");
    expect(crudo).not.toContain("    at ");
  });

  test("una edición de reglas.json entre dos llamadas se ve sin reiniciar", async () => {
    const conocimiento = await nuevoConocimiento();
    const rutaReglas = join(conocimiento.directorio, "reglas.json");
    const { mapear_campos: mapearEditable } = crearHerramientas({
      directorioConocimiento: conocimiento.directorio,
    });
    const ctx = { directory: compartido.raiz };
    const antes: Respuesta = JSON.parse(
      await mapearEditable.execute({ caso: "ec-corp-andina", campos: [] }, ctx),
    );
    expect(antes.data?.conteo).toEqual({ lleno: 13, faltante: 1, requiere_confirmacion: 1 });
    const reglas = JSON.parse(await readFile(rutaReglas, "utf8"));
    reglas.confianza.glosario_exacto = 0.7;
    await writeFile(rutaReglas, JSON.stringify(reglas));
    const despues: Respuesta = JSON.parse(
      await mapearEditable.execute({ caso: "ec-corp-andina", campos: [] }, ctx),
    );
    expect(despues.data?.conteo).toEqual({ lleno: 0, faltante: 1, requiere_confirmacion: 14 });
  });
});

describe("golden: out/<caso>/mapeo.json sin valores (MAP-06, SEG-02)", () => {
  test("co persiste 17 campos con caso, pais y fecha_ejecucion, sin llave valor ni valores crudos", async () => {
    const proyecto = await nuevoProyecto();
    await mapearCrudo({ caso: "co-industrias-delta", campos: [] }, proyecto.raiz);
    const { texto, documento } = await leerMapeo(proyecto.raiz, "co-industrias-delta");
    expect(Object.keys(documento).sort()).toEqual(["campos", "caso", "fecha_ejecucion", "pais"]);
    expect(documento.caso).toBe("co-industrias-delta");
    expect(documento.pais).toBe("CO");
    expect(documento.fecha_ejecucion).toBe("2026-09-03");
    expect(documento.campos).toHaveLength(17);
    expect(tieneLlave(documento, "valor")).toBe(false);
    for (const sensible of SENSIBLES) expect(texto).not.toContain(sensible);
    expect(texto).toBe(`${JSON.stringify(documento, null, 2)}\n`);
  });

  test("cada campo persistido trae ruta, regla y confianza en el orden de la plantilla", async () => {
    const proyecto = await nuevoProyecto();
    await mapearCrudo({ caso: "ec-corp-andina", campos: [] }, proyecto.raiz);
    const { documento } = await leerMapeo(proyecto.raiz, "ec-corp-andina");
    expect(documento.campos.map((campo) => campo.etiqueta).slice(0, 3)).toEqual([
      "Nombre de la empresa",
      "RUC",
      "Número de contribuyente especial",
    ]);
    for (const campo of documento.campos) {
      expect(Object.keys(campo).sort()).toEqual(CLAVES_ITEM);
    }
    const ruc = documento.campos.find((campo) => campo.etiqueta === "RUC");
    expect(ruc).toMatchObject({ ruta: "nit", regla: "regla_pais", confianza: 0.6 });
  });

  test("la ruta devuelta en data.mapeo apunta al archivo escrito", async () => {
    const proyecto = await nuevoProyecto();
    const respuesta: Respuesta = JSON.parse(
      await mapearCrudo({ caso: "pa-logistica-istmo", campos: [] }, proyecto.raiz),
    );
    expect(respuesta.data?.mapeo).toBe("out/pa-logistica-istmo/mapeo.json");
    expect(existsSync(join(proyecto.raiz, "out", "pa-logistica-istmo", "mapeo.json"))).toBe(true);
  });

  test("llamadas concurrentes sobre el mismo caso dejan un mapeo.json completo y válido", async () => {
    const proyecto = await nuevoProyecto();
    const respuestas = await Promise.all(
      Array.from({ length: 5 }, () => mapearCrudo({ caso: "hn-agroexport-sula", campos: [] }, proyecto.raiz)),
    );
    for (const crudo of respuestas) expect(JSON.parse(crudo).ok).toBe(true);
    const { documento } = await leerMapeo(proyecto.raiz, "hn-agroexport-sula");
    expect(documento.campos).toHaveLength(11);
  });
});

describe("golden: subconjuntos de etiquetas (D-15)", () => {
  test('ec con ["RUC"] devuelve un solo item mientras mapeo.json guarda los 15', async () => {
    const proyecto = await nuevoProyecto();
    const respuesta: Respuesta = JSON.parse(
      await mapearCrudo({ caso: "ec-corp-andina", campos: ["RUC"] }, proyecto.raiz),
    );
    expect(respuesta.ok).toBe(true);
    if (respuesta.data === undefined) throw new Error("sin data");
    expect(todos(respuesta.data)).toHaveLength(1);
    expect(respuesta.data.requiere_confirmacion[0]?.etiqueta).toBe("RUC");
    expect(respuesta.data.conteo).toEqual({ lleno: 0, faltante: 0, requiere_confirmacion: 1 });
    expect(respuesta.resumen).toBe("ec-corp-andina: 0 llenos, 0 faltantes, 1 por confirmar");
    const { documento } = await leerMapeo(proyecto.raiz, "ec-corp-andina");
    expect(documento.campos).toHaveLength(15);
  });

  test('["ruc"] coincide con "RUC" por la normalización del glosario', async () => {
    const datos = await mapearOk("ec-corp-andina", ["ruc"]);
    expect(todos(datos).map((campo) => campo.etiqueta)).toEqual(["RUC"]);
  });

  test("varias etiquetas con variantes de tildes y mayúsculas vuelven en el orden de la plantilla", async () => {
    const datos = await mapearOk("ec-corp-andina", ["SWIFT", "pais", "Nombre de la empresa:"]);
    expect(datos.llenos.map((campo) => campo.etiqueta)).toEqual(["Nombre de la empresa", "País", "SWIFT"]);
  });

  test("una etiqueta fuera de la plantilla da CAMPOS_FUERA_DE_PLANTILLA sin repetirla", async () => {
    const proyecto = await nuevoProyecto();
    const crudo = await mapearCrudo(
      { caso: "ec-corp-andina", campos: ["RUC", "Etiqueta inventada"] },
      proyecto.raiz,
    );
    const respuesta: Respuesta = JSON.parse(crudo);
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("CAMPOS_FUERA_DE_PLANTILLA");
    const esperadas = respuesta.parcial?.etiquetas_esperadas as string[];
    expect(esperadas).toHaveLength(15);
    expect(esperadas[0]).toBe("Nombre de la empresa");
    expect(respuesta.parcial?.indices_fuera_de_plantilla).toEqual([1]);
    expect(crudo).not.toContain("Etiqueta inventada");
    expect(existsSync(join(proyecto.raiz, "out", "ec-corp-andina", "mapeo.json"))).toBe(false);
  });

  test("la bitácora de una etiqueta fuera de la plantilla no la repite", async () => {
    const proyecto = await nuevoProyecto();
    await mapearCrudo({ caso: "ec-corp-andina", campos: ["Etiqueta inventada"] }, proyecto.raiz);
    const global = await lineas(join(proyecto.raiz, "out", "log.jsonl"));
    expect(global.join("\n")).not.toContain("Etiqueta inventada");
    expect(JSON.parse(global[0] ?? "{}").codigo).toBe("CAMPOS_FUERA_DE_PLANTILLA");
  });
});
