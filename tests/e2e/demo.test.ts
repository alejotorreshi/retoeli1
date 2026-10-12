import { afterAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ejecutarDemo } from "../../src/demo/ejecutar-demo.ts";
import { crearProyectoTemporal, type ProyectoTemporal } from "../helpers/proyecto-temporal.ts";

const CASOS_REALES = ["co-industrias-delta", "ec-corp-andina", "hn-agroexport-sula", "pa-logistica-istmo"];
const proyectos: ProyectoTemporal[] = [];
const sueltos: string[] = [];

afterAll(async () => {
  await Promise.all(proyectos.map((proyecto) => proyecto.limpiar()));
  await Promise.all(sueltos.map((ruta) => rm(ruta, { recursive: true, force: true })));
});

async function demoEn(directorio: string): Promise<{ lineas: string[]; hayFallos: boolean }> {
  const previa = process.env.FECHA_EJECUCION;
  const lineas: string[] = [];
  try {
    const resultado = await ejecutarDemo({ directorio, escribir: (linea) => lineas.push(linea) });
    return { lineas, hayFallos: resultado.hayFallos };
  } finally {
    if (previa === undefined) delete process.env.FECHA_EJECUCION;
    else process.env.FECHA_EJECUCION = previa;
  }
}

describe("ejecutarDemo", () => {
  test("limpia out/, imprime la fecha efectiva y una línea por caso real", async () => {
    const proyecto = await crearProyectoTemporal();
    proyectos.push(proyecto);
    await mkdir(join(proyecto.raiz, "out"), { recursive: true });
    await writeFile(join(proyecto.raiz, "out", "viejo.txt"), "residuo");

    const { lineas, hayFallos } = await demoEn(proyecto.raiz);

    expect(hayFallos).toBe(false);
    expect(lineas[0]).toBe("Fecha de ejecución efectiva: 2026-09-03");
    expect(lineas).toHaveLength(1 + CASOS_REALES.length);
    CASOS_REALES.forEach((caso, indice) => {
      expect(lineas[indice + 1]?.startsWith(`${caso}: formato `)).toBe(true);
    });
    expect(existsSync(join(proyecto.raiz, "out", "viejo.txt"))).toBe(false);
    const global = (await readFile(join(proyecto.raiz, "out", "log.jsonl"), "utf8")).trim().split("\n");
    expect(global).toHaveLength(1 + CASOS_REALES.length);
  });

  test("nunca imprime valores del maestro", async () => {
    const proyecto = await crearProyectoTemporal();
    proyectos.push(proyecto);
    const { lineas } = await demoEn(proyecto.raiz);
    const salida = lineas.join("\n");
    for (const valor of ["Periferia IT Group", "900123456", "Medellín", "+57 604"]) {
      expect(salida).not.toContain(valor);
    }
  });

  test("se niega a correr donde no hay package.json y no borra nada", async () => {
    const raiz = await mkdtemp(join(tmpdir(), "demo-sin-paquete-"));
    sueltos.push(raiz);
    await mkdir(join(raiz, "out"), { recursive: true });
    await writeFile(join(raiz, "out", "conservar.txt"), "x");
    await expect(demoEn(raiz)).rejects.toThrow("package.json");
    expect(existsSync(join(raiz, "out", "conservar.txt"))).toBe(true);
  });

  test("un caso roto se reporta en español y la demo sigue con los demás", async () => {
    const proyecto = await crearProyectoTemporal();
    proyectos.push(proyecto);
    const roto = join(proyecto.casosDir, "zz-roto");
    await mkdir(roto, { recursive: true });
    await writeFile(join(roto, "solicitud.json"), "{ no es json");
    const { lineas, hayFallos } = await demoEn(proyecto.raiz);
    expect(hayFallos).toBe(true);
    expect(lineas.at(-1)).toStartWith("zz-roto: ERROR DATOS_INVALIDOS: ");
    expect(lineas.filter((linea) => linea.includes(": formato "))).toHaveLength(CASOS_REALES.length);
  });
});
