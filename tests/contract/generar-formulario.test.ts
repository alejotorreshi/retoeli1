import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { mapearProyectado } from "@tests/helpers/flujo.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { ItemProyectado, RespuestaGenerar } from "@tests/helpers/types/flujo.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { generar_formulario, mapear_campos } from "@/tools/proveedor.ts";

const CO = "co-industrias-delta";
const HN = "hn-agroexport-sula";
const herramientas = { mapear_campos, generar_formulario };
const proyectos: ProyectoTemporal[] = [];
const fechaPrevia = process.env.FECHA_EJECUCION;
let compartido: ProyectoTemporal;
let mapeoCo: ItemProyectado[];
let mapeoHn: ItemProyectado[];

async function nuevoProyecto(): Promise<ProyectoTemporal> {
  const proyecto = await crearProyectoTemporal();
  proyectos.push(proyecto);
  return proyecto;
}

function ctx(raiz: string) {
  return { directory: raiz, sessionId: "contrato-generar" };
}

beforeAll(async () => {
  process.env.FECHA_EJECUCION = "2026-09-03";
  compartido = await nuevoProyecto();
  mapeoCo = await mapearProyectado(herramientas, ctx(compartido.raiz), CO);
  mapeoHn = await mapearProyectado(herramientas, ctx(compartido.raiz), HN);
});

afterAll(async () => {
  if (fechaPrevia === undefined) delete process.env.FECHA_EJECUCION;
  else process.env.FECHA_EJECUCION = fechaPrevia;
  await Promise.all(proyectos.map((proyecto) => proyecto.limpiar()));
});

async function generarCrudo(raiz: string, caso: string, mapeo: unknown): Promise<string> {
  const crudo = await generar_formulario.execute({ caso, mapeo }, ctx(raiz));
  expect(typeof crudo).toBe("string");
  return crudo;
}

function cambiar(
  items: readonly ItemProyectado[],
  etiqueta: string,
  cambio: Partial<ItemProyectado>,
): ItemProyectado[] {
  return items.map((item) => (item.etiqueta === etiqueta ? { ...item, ...cambio } : item));
}

function salida(raiz: string, caso: string, ...partes: string[]): string {
  return join(raiz, "out", caso, ...partes);
}

async function lineas(ruta: string): Promise<string[]> {
  return (await readFile(ruta, "utf8")).trim().split("\n");
}

describe("contrato: generar_formulario rechaza mapeos adulterados (D-11, FORM-04, CA2)", () => {
  const casos: readonly [string, string, () => ItemProyectado[], readonly string[]][] = [
    [
      "una ruta cambiada",
      CO,
      () => cambiar(mapeoCo, "Número de cuenta", { ruta: "banco.swift" }),
      ["ruta distinta: Número de cuenta"],
    ],
    [
      "una ruta hacia una clave del prototipo",
      CO,
      () => cambiar(mapeoCo, "Banco", { ruta: "__proto__.x" }),
      ["ruta distinta: Banco"],
    ],
    [
      "un estado subido de requiere_confirmacion a lleno",
      HN,
      () => cambiar(mapeoHn, "RTN", { estado: "lleno" }),
      ["estado distinto: RTN"],
    ],
    [
      "un faltante convertido en lleno con ruta",
      HN,
      () => cambiar(mapeoHn, "Referencias comerciales", { estado: "lleno", ruta: "sitio_web" }),
      ["ruta distinta: Referencias comerciales", "estado distinto: Referencias comerciales"],
    ],
    ["un item ausente", CO, () => mapeoCo.filter((item) => item.etiqueta !== "Banco"), ["falta: Banco"]],
    [
      "un item duplicado",
      CO,
      () => [...mapeoCo, ...mapeoCo.filter((item) => item.etiqueta === "Banco")],
      ["duplicado: Banco"],
    ],
    [
      "un item extra con un valor como etiqueta",
      CO,
      () => [...mapeoCo, { etiqueta: "03100012345", estado: "lleno", ruta: "banco.numero_cuenta" }],
      ["sobrante: #17"],
    ],
    [
      "un mapeo vacío",
      HN,
      () => [],
      [
        "falta: Razón social",
        "falta: RTN",
        "falta: País",
        "falta: Dirección",
        "falta: Teléfono",
        "falta: Correo electrónico",
        "falta: Representante legal",
        "falta: Fecha de constitución",
        "falta: Número de empleados",
        "falta: Ingresos anuales",
        "falta: Referencias comerciales",
      ],
    ],
  ];

  for (const [nombre, caso, construir, diferencias] of casos) {
    test(`${nombre} da MAPEO_INCONSISTENTE y no escribe nada`, async () => {
      const proyecto = await nuevoProyecto();
      const paquete = salida(proyecto.raiz, caso, "paquete", "x.txt");
      await mkdir(salida(proyecto.raiz, caso, "paquete"), { recursive: true });
      await writeFile(paquete, "previo");

      const crudo = await generarCrudo(proyecto.raiz, caso, construir());
      const respuesta: RespuestaGenerar = JSON.parse(crudo);
      expect(respuesta.ok).toBe(false);
      expect(respuesta.codigo).toBe("MAPEO_INCONSISTENTE");
      expect(respuesta.parcial?.diferencias).toEqual([...diferencias]);
      expect(respuesta.resumen).toBe("generar_formulario: MAPEO_INCONSISTENTE");
      expect(respuesta.error).toBe(
        "El mapeo recibido no coincide con el mapeo canónico del caso; pasa el resultado completo de proveedor_mapear_campos.",
      );
      expect(crudo).not.toContain("03100012345");
      expect(crudo).not.toContain("900123456");

      expect(existsSync(salida(proyecto.raiz, caso, "formulario.xlsx"))).toBe(false);
      expect(existsSync(salida(proyecto.raiz, caso, "mapeo.json"))).toBe(false);
      expect(existsSync(paquete)).toBe(true);
    });
  }

  test("un item con la llave valor da ARGS_INVALIDOS sin repetir el valor", async () => {
    const proyecto = await nuevoProyecto();
    const mapeo = mapeoCo.map((item) =>
      item.etiqueta === "Número de cuenta" ? { ...item, valor: "99999999999" } : item,
    );
    const crudo = await generarCrudo(proyecto.raiz, CO, mapeo);
    const respuesta: RespuestaGenerar = JSON.parse(crudo);
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("ARGS_INVALIDOS");
    expect(respuesta.error).toContain("valor");
    expect(crudo).not.toContain("99999999999");
    expect(existsSync(salida(proyecto.raiz, CO, "formulario.xlsx"))).toBe(false);
  });

  test("una ruta fuera del patrón da ARGS_INVALIDOS", async () => {
    const proyecto = await nuevoProyecto();
    const crudo = await generarCrudo(proyecto.raiz, CO, cambiar(mapeoCo, "Banco", { ruta: "Banco.Nombre" }));
    expect(JSON.parse(crudo).codigo).toBe("ARGS_INVALIDOS");
  });

  test("el mapeo exacto en otro orden genera el formulario", async () => {
    const proyecto = await nuevoProyecto();
    const respuesta: RespuestaGenerar = JSON.parse(
      await generarCrudo(proyecto.raiz, CO, [...mapeoCo].reverse()),
    );
    expect(respuesta.ok).toBe(true);
    expect(respuesta.data).toEqual({ ruta: `out/${CO}/formulario.xlsx`, formato: "xlsx" });
  });
});

describe("contrato: reprocesar limpia el paquete previo y conserva la bitácora (D-12)", () => {
  test("generar borra paquete/ y ENVIO-SIMULADO.md y agrega una sola línea al log del caso", async () => {
    const proyecto = await nuevoProyecto();
    const paquete = salida(proyecto.raiz, CO, "paquete");
    const envio = salida(proyecto.raiz, CO, "ENVIO-SIMULADO.md");
    const bitacora = salida(proyecto.raiz, CO, "log.jsonl");
    await mkdir(join(paquete, "anidado"), { recursive: true });
    await writeFile(join(paquete, "x.txt"), "viejo");
    await writeFile(join(paquete, "anidado", "y.txt"), "viejo");
    await writeFile(envio, "# envío viejo\n");
    const previas = ['{"previa":1}', '{"previa":2}'];
    await writeFile(bitacora, `${previas.join("\n")}\n`);

    const respuesta: RespuestaGenerar = JSON.parse(await generarCrudo(proyecto.raiz, CO, mapeoCo));
    expect(respuesta.ok).toBe(true);

    expect(existsSync(paquete)).toBe(false);
    expect(existsSync(envio)).toBe(false);
    expect(existsSync(salida(proyecto.raiz, CO, "formulario.xlsx"))).toBe(true);
    const actuales = await lineas(bitacora);
    expect(actuales).toHaveLength(previas.length + 1);
    expect(actuales.slice(0, previas.length)).toEqual(previas);
    expect(JSON.parse(actuales.at(-1) ?? "{}")).toMatchObject({
      herramienta: "proveedor_generar_formulario",
      ok: true,
    });
  });

  test("generar sin artefactos previos no falla", async () => {
    const proyecto = await nuevoProyecto();
    const respuesta: RespuestaGenerar = JSON.parse(await generarCrudo(proyecto.raiz, HN, mapeoHn));
    expect(respuesta.ok).toBe(true);
  });
});

describe("contrato: una plantilla que el xlsx no puede escribir se rechaza antes de borrar nada (WR-08)", () => {
  test("una hoja llamada History da PLANTILLA_INVALIDA y conserva el formulario anterior", async () => {
    const proyecto = await nuevoProyecto();
    expect(JSON.parse(await generarCrudo(proyecto.raiz, CO, mapeoCo)).ok).toBe(true);
    const rutaPlantilla = join(proyecto.casosDir, CO, "plantilla-celdas.json");
    const plantilla: { hoja: string }[] = JSON.parse(await readFile(rutaPlantilla, "utf8"));
    await writeFile(rutaPlantilla, JSON.stringify(plantilla.map((campo) => ({ ...campo, hoja: "History" }))));
    const respuesta: RespuestaGenerar = JSON.parse(await generarCrudo(proyecto.raiz, CO, mapeoCo));
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("PLANTILLA_INVALIDA");
    expect(existsSync(salida(proyecto.raiz, CO, "formulario.xlsx"))).toBe(true);
  });
});
