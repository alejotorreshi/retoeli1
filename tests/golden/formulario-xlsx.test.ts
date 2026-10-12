import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { FIXTURES_DIR } from "../../src/config/constantes.ts";
import type { FilaCelda } from "../../src/domain/formulario.ts";
import { leerRuta, type Maestro } from "../../src/domain/mapeo.ts";
import type { CampoCelda } from "../../src/domain/tipos.ts";
import { escribirXlsx } from "../../src/infra/salida/xlsx.ts";
import { crearHerramientas } from "../../src/tools/fabrica.ts";
import { generarCaso, type ItemProyectado } from "../helpers/flujo.ts";
import { crearProyectoTemporal, type ProyectoTemporal } from "../helpers/proyecto-temporal.ts";
import { celdaEn, leerCeldasXlsx, leerMetadatosXlsx } from "../helpers/xlsx-leer.ts";

const RELLENO_FALTANTE = "FFFFC7CE";
const RELLENO_POR_CONFIRMAR = "FFFFEB9C";
const NOTA_FALTANTE = "Faltante: no existe en el maestro";
const NOTA_EXTRANJERO = "Identificador extranjero: confirmar si el cliente acepta el NIT colombiano";

const herramientas = crearHerramientas();
const proyectos: ProyectoTemporal[] = [];
const fechaPrevia = process.env.FECHA_EJECUCION;
let compartido: ProyectoTemporal;
let maestro: Maestro;

async function nuevoProyecto(): Promise<ProyectoTemporal> {
  const proyecto = await crearProyectoTemporal();
  proyectos.push(proyecto);
  return proyecto;
}

beforeAll(async () => {
  process.env.FECHA_EJECUCION = "2026-09-03";
  compartido = await nuevoProyecto();
  maestro = JSON.parse(
    await readFile(join(compartido.raiz, FIXTURES_DIR, "repositorio", "maestro.json"), "utf8"),
  );
});

afterAll(async () => {
  if (fechaPrevia === undefined) delete process.env.FECHA_EJECUCION;
  else process.env.FECHA_EJECUCION = fechaPrevia;
  await Promise.all(proyectos.map((proyecto) => proyecto.limpiar()));
});

function ctx(raiz: string = compartido.raiz) {
  return { directory: raiz, sessionId: "golden-xlsx" };
}

async function plantilla(raiz: string, caso: string): Promise<CampoCelda[]> {
  const ruta = join(raiz, FIXTURES_DIR, "casos", caso, "plantilla-celdas.json");
  return JSON.parse(await readFile(ruta, "utf8"));
}

function itemDe(mapeo: readonly ItemProyectado[], etiqueta: string): ItemProyectado {
  const item = mapeo.find((candidato) => candidato.etiqueta === etiqueta);
  if (item === undefined) throw new Error(`sin item ${etiqueta}`);
  return item;
}

async function generarOk(caso: string, raiz: string = compartido.raiz) {
  const flujo = await generarCaso(herramientas, ctx(raiz), caso);
  expect(flujo.respuesta.ok).toBe(true);
  return flujo;
}

describe("golden: proveedor_generar_formulario xlsx (FORM-01, D-01, D-02, D-04)", () => {
  test("co-industrias-delta escribe las 17 filas de la plantilla con el valor del maestro como texto", async () => {
    const { respuesta, mapeo } = await generarOk("co-industrias-delta");
    expect(respuesta.data).toEqual({ ruta: "out/co-industrias-delta/formulario.xlsx", formato: "xlsx" });
    expect(respuesta.resumen).toBe(
      "co-industrias-delta: formulario xlsx generado (17 llenos, 0 faltantes, 0 por confirmar)",
    );

    const archivo = join(compartido.raiz, "out", "co-industrias-delta", "formulario.xlsx");
    const metadatos = await leerMetadatosXlsx(archivo);
    expect(metadatos.hojas).toEqual(["Datos Proveedor", "Datos Bancarios"]);
    expect(metadatos.creado).toBe("2026-09-03T00:00:00.000Z");
    expect(metadatos.modificado).toBe("2026-09-03T00:00:00.000Z");
    expect(metadatos.creador).toBe("registro-proveedor");
    expect(metadatos.modificadoPor).toBe("registro-proveedor");

    const celdas = await leerCeldasXlsx(archivo);
    const filas = await plantilla(compartido.raiz, "co-industrias-delta");
    expect(filas).toHaveLength(17);
    expect(celdas).toHaveLength(34);
    for (const fila of filas) {
      const etiqueta = celdaEn(celdas, fila.hoja, fila.celda_etiqueta);
      expect(etiqueta.valor).toBe(fila.etiqueta);
      expect(etiqueta.negrita).toBe(true);
      const ruta = itemDe(mapeo, fila.etiqueta).ruta;
      if (ruta === null) throw new Error(`sin ruta para ${fila.etiqueta}`);
      const valor = celdaEn(celdas, fila.hoja, fila.celda_valor);
      expect(valor.valor).toBe(leerRuta(maestro, ruta));
      expect(valor.tipo).toBe("texto");
      expect(valor.formato).toBe("@");
      expect(valor.relleno).toBeNull();
    }

    const cuenta = celdaEn(celdas, "Datos Bancarios", "C5");
    expect(cuenta.valor).toBe("03100012345");
    expect(cuenta.tipo).toBe("texto");
    const postal = celdaEn(celdas, "Datos Proveedor", "C8");
    expect(postal.valor).toBe("050021");
    expect(postal.tipo).toBe("texto");
  });

  test("hn-agroexport-sula marca el faltante, el por confirmar y las notas de contexto", async () => {
    const { respuesta } = await generarOk("hn-agroexport-sula");
    expect(respuesta.data).toEqual({ ruta: "out/hn-agroexport-sula/formulario.xlsx", formato: "xlsx" });
    expect(respuesta.resumen).toBe(
      "hn-agroexport-sula: formulario xlsx generado (9 llenos, 1 faltantes, 1 por confirmar)",
    );

    const archivo = join(compartido.raiz, "out", "hn-agroexport-sula", "formulario.xlsx");
    expect((await leerMetadatosXlsx(archivo)).hojas).toEqual(["Registro"]);
    const celdas = await leerCeldasXlsx(archivo);

    const faltante = celdaEn(celdas, "Registro", "B12");
    expect(faltante.valor).toBeNull();
    expect(faltante.relleno).toBe(RELLENO_FALTANTE);
    expect(faltante.nota).toBe(NOTA_FALTANTE);
    expect(celdaEn(celdas, "Registro", "A12").valor).toBe("Referencias comerciales");

    const rtn = celdaEn(celdas, "Registro", "B3");
    expect(rtn.valor).toBe("900123456");
    expect(rtn.tipo).toBe("texto");
    expect(rtn.relleno).toBe(RELLENO_POR_CONFIRMAR);
    expect(rtn.nota).toBe(NOTA_EXTRANJERO);

    const ingresos = celdaEn(celdas, "Registro", "B11");
    expect(ingresos.valor).toBe("98000000000");
    expect(ingresos.tipo).toBe("texto");
    expect(ingresos.nota).toBe("COP, año 2025");
    expect(ingresos.relleno).toBeNull();

    const empleados = celdaEn(celdas, "Registro", "B10");
    expect(empleados.valor).toBe("480");
    expect(empleados.tipo).toBe("texto");

    const pais = celdaEn(celdas, "Registro", "B4");
    expect(pais.valor).toBe("CO");
    expect(pais.nota).toBe("Código ISO del país de constitución de Periferia");
    expect(pais.relleno).toBeNull();
  });

  test("generar co dos veces sobrescribe formulario.xlsx y mapeo.json con el mismo contenido", async () => {
    const proyecto = await nuevoProyecto();
    const archivo = join(proyecto.raiz, "out", "co-industrias-delta", "formulario.xlsx");
    const mapeoJson = join(proyecto.raiz, "out", "co-industrias-delta", "mapeo.json");

    await generarOk("co-industrias-delta", proyecto.raiz);
    const primera = await leerCeldasXlsx(archivo);
    const mapeoPrimero = await readFile(mapeoJson, "utf8");

    await writeFile(archivo, "basura");
    await writeFile(mapeoJson, "basura");
    await generarOk("co-industrias-delta", proyecto.raiz);

    expect(await leerCeldasXlsx(archivo)).toEqual(primera);
    const mapeoSegundo = await readFile(mapeoJson, "utf8");
    expect(mapeoSegundo).toBe(mapeoPrimero);
    expect(mapeoSegundo).not.toContain("03100012345");
    expect(mapeoSegundo).not.toContain('"valor"');
  });
});

describe("escribirXlsx (D-33.5)", () => {
  test("una cadena con forma de fórmula queda como texto, sin fórmula ni apóstrofo", async () => {
    const proyecto = await nuevoProyecto();
    const filas: FilaCelda[] = [
      {
        etiqueta: "Razón social",
        obligatorio: null,
        hoja: "Hoja",
        celda_etiqueta: "A1",
        celda_valor: "B1",
        estado: "lleno",
        valor: "=1+1",
        nota: null,
      },
    ];
    const ruta = join(proyecto.raiz, "formula.xlsx");
    await writeFile(ruta, await escribirXlsx(filas, "2026-09-03"));
    const celda = celdaEn(await leerCeldasXlsx(ruta), "Hoja", "B1");
    expect(celda.tipo).toBe("texto");
    expect(celda.valor).toBe("=1+1");
    expect(typeof celda.valor).toBe("string");
  });
});
