import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { crearHerramientas } from "../../src/tools/fabrica.ts";
import { mapear_campos } from "../../src/tools/proveedor.ts";
import { crearProyectoTemporal, type ProyectoTemporal } from "../helpers/proyecto-temporal.ts";

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

const proyectos: ProyectoTemporal[] = [];
const sueltos: string[] = [];
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
  await Promise.all(sueltos.map((ruta) => rm(ruta, { recursive: true, force: true })));
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
    for (const sensible of ["03100012345", "71555123", "COLOCOBM", "900123456"]) {
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
  test("crearHerramientas con un reglas.json roto da REGLAS_INVALIDAS con la ruta de la llave", async () => {
    const directorio = await mkdtemp(join(tmpdir(), "conocimiento-"));
    sueltos.push(directorio);
    const reglas = JSON.parse(
      await readFile(join(import.meta.dir, "..", "..", "src", "knowledge", "reglas.json"), "utf8"),
    );
    reglas.confianza.umbral = 2;
    await writeFile(join(directorio, "reglas.json"), JSON.stringify(reglas));
    const { mapear_campos: mapearRoto } = crearHerramientas({ directorioConocimiento: directorio });
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
    const directorio = await mkdtemp(join(tmpdir(), "conocimiento-"));
    sueltos.push(directorio);
    const original = await readFile(
      join(import.meta.dir, "..", "..", "src", "knowledge", "reglas.json"),
      "utf8",
    );
    await writeFile(join(directorio, "reglas.json"), original);
    const { mapear_campos: mapearEditable } = crearHerramientas({ directorioConocimiento: directorio });
    const ctx = { directory: compartido.raiz };
    const antes: Respuesta = JSON.parse(
      await mapearEditable.execute({ caso: "ec-corp-andina", campos: [] }, ctx),
    );
    expect(antes.data?.conteo).toEqual({ lleno: 13, faltante: 1, requiere_confirmacion: 1 });
    const reglas = JSON.parse(original);
    reglas.confianza.regla_pais = 0.9;
    await writeFile(join(directorio, "reglas.json"), JSON.stringify(reglas));
    const despues: Respuesta = JSON.parse(
      await mapearEditable.execute({ caso: "ec-corp-andina", campos: [] }, ctx),
    );
    expect(despues.data?.conteo).toEqual({ lleno: 14, faltante: 1, requiere_confirmacion: 0 });
  });
});
