import { afterAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Corrida, correrDemo } from "../helpers/correr-demo.ts";
import { listarSalida } from "../helpers/instantanea.ts";
import { crearProyectoTemporal, type ProyectoTemporal } from "../helpers/proyecto-temporal.ts";

const CASOS_REALES = ["co-industrias-delta", "ec-corp-andina", "hn-agroexport-sula", "pa-logistica-istmo"];
const proyectos: ProyectoTemporal[] = [];
const sueltos: string[] = [];

afterAll(async () => {
  await Promise.all(proyectos.map((proyecto) => proyecto.limpiar()));
  await Promise.all(sueltos.map((ruta) => rm(ruta, { recursive: true, force: true })));
});

async function proyecto(sinteticos: readonly string[] = []): Promise<ProyectoTemporal> {
  const creado = await crearProyectoTemporal({ sinteticos });
  proyectos.push(creado);
  return creado;
}

function bloque(lineas: readonly string[], caso: string): string {
  const inicio = lineas.indexOf(`== ${caso} ==`);
  if (inicio < 0) throw new Error(`sin bloque para ${caso}`);
  const fin = lineas.indexOf("", inicio);
  return lineas.slice(inicio, fin < 0 ? undefined : fin).join("\n");
}

function filasResumen(lineas: readonly string[]): string[] {
  const inicio = lineas.indexOf("Resumen");
  return lineas.slice(inicio + 3).filter((linea) => linea.startsWith("| "));
}

describe("demo de los cuatro casos (DEMO-01, DEMO-02)", () => {
  let corrida: Corrida;
  let base: ProyectoTemporal;

  test("limpia out/, imprime la fecha efectiva y no falla", async () => {
    base = await proyecto();
    await mkdir(join(base.raiz, "out"), { recursive: true });
    await writeFile(join(base.raiz, "out", "basura.txt"), "residuo");
    corrida = await correrDemo(base.raiz);
    expect(corrida.fallido).toBe(false);
    expect(corrida.lineas[0]).toBe("Fecha de ejecución efectiva: 2026-09-03");
    expect(existsSync(join(base.raiz, "out", "basura.txt"))).toBe(false);
  });

  test("co: 17/0/0 y LISTO", () => {
    const texto = bloque(corrida.lineas, "co-industrias-delta");
    expect(texto).toContain("17 llenos · 0 faltantes · 0 por confirmar");
    expect(texto).toContain("Estado: LISTO");
    expect(texto).toContain("Formato: xlsx");
    expect(texto).toContain("Salida: out/co-industrias-delta/formulario.xlsx");
  });

  test("ec: 13/1/1 y BLOQUEADO por el certificado ausente", () => {
    const texto = bloque(corrida.lineas, "ec-corp-andina");
    expect(texto).toContain("13 llenos · 1 faltantes · 1 por confirmar");
    expect(texto).toContain("Estado: BLOQUEADO (ausente: certificado_cumplimiento_tributario)");
    expect(texto).toContain("Soportes ausentes: certificado_cumplimiento_tributario · Vencidos: ninguno");
  });

  test("hn: 9/1/1 y BLOQUEADO por parafiscales vencido", () => {
    const texto = bloque(corrida.lineas, "hn-agroexport-sula");
    expect(texto).toContain("9 llenos · 1 faltantes · 1 por confirmar");
    expect(texto).toContain("Estado: BLOQUEADO (vencido: parafiscales (2026-08-31))");
    expect(texto).toContain("Soportes ausentes: ninguno · Vencidos: parafiscales");
  });

  test("pa: 8/0/1, portal con formato no soportado y LISTO", () => {
    const texto = bloque(corrida.lineas, "pa-logistica-istmo");
    expect(texto).toContain("8 llenos · 0 faltantes · 1 por confirmar");
    expect(texto).toContain("Formato: portal (formato no soportado)");
    expect(texto).toContain("Estado: LISTO");
  });

  test("cada caso muestra el envío rechazado sin confirmación (RN4)", () => {
    for (const caso of CASOS_REALES) {
      expect(bloque(corrida.lineas, caso)).toContain(
        "Envío: requiere confirmación explícita (no se envía nada)",
      );
    }
  });

  test("la tabla Resumen trae una fila por caso, en orden", () => {
    const filas = filasResumen(corrida.lineas);
    expect(filas).toEqual([
      "| co-industrias-delta | xlsx | 17 | 0 | 0 | LISTO |",
      "| ec-corp-andina | pdf | 13 | 1 | 1 | BLOQUEADO |",
      "| hn-agroexport-sula | xlsx | 9 | 1 | 1 | BLOQUEADO |",
      "| pa-logistica-istmo | portal | 8 | 0 | 1 | LISTO |",
    ]);
  });

  test("deja formularios, mapeo, checklist y borrador por caso y ningún ENVIO-SIMULADO.md", async () => {
    const out = join(base.raiz, "out");
    for (const archivo of [
      "co-industrias-delta/formulario.xlsx",
      "ec-corp-andina/formulario.pdf",
      "hn-agroexport-sula/formulario.xlsx",
      "pa-logistica-istmo/valores-portal.md",
    ]) {
      expect(existsSync(join(out, archivo))).toBe(true);
    }
    for (const caso of CASOS_REALES) {
      for (const archivo of ["paquete/checklist.md", "paquete/borrador-correo.md", "mapeo.json"]) {
        expect(existsSync(join(out, caso, archivo))).toBe(true);
      }
    }
    const todos = await listarSalida(base.raiz);
    expect(todos.filter((ruta) => ruta.endsWith("ENVIO-SIMULADO.md"))).toEqual([]);
  });

  test("nunca imprime valores del maestro", () => {
    const salida = corrida.lineas.join("\n");
    for (const valor of [
      "Periferia IT Group",
      "900123456",
      "03100012345",
      "COLOCOBM",
      "Medellín",
      "+57 604",
    ]) {
      expect(salida).not.toContain(valor);
    }
  });
});

describe("robustez de la demo", () => {
  test("sin package.json no borra nada y reporta fallo", async () => {
    const raiz = await mkdtemp(join(tmpdir(), "demo-sin-paquete-"));
    sueltos.push(raiz);
    await mkdir(join(raiz, "out"), { recursive: true });
    await writeFile(join(raiz, "out", "conservar.txt"), "x");
    const { lineas, fallido } = await correrDemo(raiz);
    expect(fallido).toBe(true);
    expect(lineas.join("\n")).toContain("package.json");
    expect(existsSync(join(raiz, "out", "conservar.txt"))).toBe(true);
  });

  test("corre sin ninguna variable de entorno con API_KEY", async () => {
    const quitadas = Object.entries(process.env).filter(([nombre]) => nombre.includes("API_KEY"));
    for (const [nombre] of quitadas) delete process.env[nombre];
    try {
      const { fallido } = await correrDemo((await proyecto()).raiz);
      expect(Object.keys(process.env).filter((nombre) => nombre.includes("API_KEY"))).toEqual([]);
      expect(fallido).toBe(false);
    } finally {
      for (const [nombre, valor] of quitadas) process.env[nombre] = valor;
    }
  });

  test("una plantilla corrupta se reporta en español, los cuatro casos reales terminan y la corrida falla", async () => {
    const { lineas, fallido } = await correrDemo((await proyecto(["zz-plantilla-corrupta"])).raiz);
    expect(fallido).toBe(true);
    expect(
      lineas.some((linea) => linea.startsWith("Error en zz-plantilla-corrupta (PLANTILLA_INVALIDA): ")),
    ).toBe(true);
    for (const caso of CASOS_REALES) {
      expect(bloque(lineas, caso)).toContain("Estado: ");
    }
    expect(filasResumen(lineas)).toHaveLength(CASOS_REALES.length + 1);
    expect(filasResumen(lineas).at(-1)).toBe(
      "| zz-plantilla-corrupta | — | — | — | — | ERROR (PLANTILLA_INVALIDA) |",
    );
  });
});
