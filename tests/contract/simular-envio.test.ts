import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { generarCaso } from "@tests/helpers/flujo.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { crearHerramientas } from "@/tools/herramientas.factory.ts";

const CO = "co-industrias-delta";
const EC = "ec-corp-andina";
const LITERAL = "requiere confirmación explícita";
const BLOQUEO_EC = "ausente: certificado_cumplimiento_tributario";

type RespuestaEnvio = {
  readonly ok: boolean;
  readonly data?: { readonly ruta: string; readonly bloqueos: readonly string[] };
  readonly error?: string;
  readonly codigo?: string;
  readonly resumen?: string;
};

const herramientas = crearHerramientas();
const proyectos: ProyectoTemporal[] = [];
const fechaPrevia = process.env.FECHA_EJECUCION;

async function nuevoProyecto(): Promise<ProyectoTemporal> {
  const proyecto = await crearProyectoTemporal();
  proyectos.push(proyecto);
  return proyecto;
}

function ctx(raiz: string) {
  return { directory: raiz, sessionId: "contrato-envio" };
}

async function simular(raiz: string, args: unknown): Promise<RespuestaEnvio> {
  return JSON.parse(await herramientas.simular_envio.execute(args, ctx(raiz)));
}

async function armado(caso: string): Promise<ProyectoTemporal> {
  const proyecto = await nuevoProyecto();
  await generarCaso(herramientas, ctx(proyecto.raiz), caso);
  const respuesta = JSON.parse(await herramientas.armar_paquete.execute({ caso }, ctx(proyecto.raiz)));
  if (respuesta.ok !== true) throw new Error(`armar_paquete falló para ${caso}`);
  return proyecto;
}

function envioSimulado(raiz: string, caso: string): string {
  return join(raiz, "out", caso, "ENVIO-SIMULADO.md");
}

async function archivosBajo(directorio: string): Promise<string[]> {
  const entradas = await readdir(directorio, { recursive: true, withFileTypes: true });
  return entradas
    .filter((entrada) => entrada.isFile())
    .map((entrada) => relative(directorio, join(entrada.parentPath, entrada.name)))
    .sort();
}

async function lineasDe(ruta: string): Promise<number> {
  if (!existsSync(ruta)) return 0;
  return (await readFile(ruta, "utf8")).split("\n").filter((linea) => linea !== "").length;
}

beforeAll(() => {
  process.env.FECHA_EJECUCION = "2026-09-03";
});

afterAll(async () => {
  if (fechaPrevia === undefined) delete process.env.FECHA_EJECUCION;
  else process.env.FECHA_EJECUCION = fechaPrevia;
  await Promise.all(proyectos.map((proyecto) => proyecto.limpiar()));
});

describe("contrato: proveedor_simular_envio (ENV-01, D-13, RN4)", () => {
  test("confirmado false responde exactamente CONFIRMACION_REQUERIDA y no escribe ENVIO-SIMULADO.md", async () => {
    const proyecto = await armado(CO);
    const crudo = await herramientas.simular_envio.execute(
      { caso: CO, confirmado: false },
      ctx(proyecto.raiz),
    );
    const respuesta: RespuestaEnvio = JSON.parse(crudo);
    expect(respuesta.ok).toBe(false);
    expect(respuesta.error).toBe(LITERAL);
    expect(Buffer.from(respuesta.error ?? "").equals(Buffer.from(LITERAL))).toBe(true);
    expect(respuesta.codigo).toBe("CONFIRMACION_REQUERIDA");
    expect(existsSync(envioSimulado(proyecto.raiz, CO))).toBe(false);
  });

  test("sin la clave confirmado también responde CONFIRMACION_REQUERIDA con el mismo literal", async () => {
    const proyecto = await armado(CO);
    const respuesta = await simular(proyecto.raiz, { caso: CO });
    expect(respuesta.ok).toBe(false);
    expect(respuesta.error).toBe(LITERAL);
    expect(respuesta.codigo).toBe("CONFIRMACION_REQUERIDA");
    expect(existsSync(envioSimulado(proyecto.raiz, CO))).toBe(false);
  });

  test('confirmado como texto "true" da ARGS_INVALIDOS', async () => {
    const proyecto = await armado(CO);
    const respuesta = await simular(proyecto.raiz, { caso: CO, confirmado: "true" });
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("ARGS_INVALIDOS");
    expect(existsSync(envioSimulado(proyecto.raiz, CO))).toBe(false);
  });

  test("el caso se valida antes que la confirmación", async () => {
    const proyecto = await nuevoProyecto();
    expect((await simular(proyecto.raiz, { caso: "../etc", confirmado: false })).codigo).toBe(
      "CASO_INVALIDO",
    );
    expect((await simular(proyecto.raiz, { caso: "zz-no-existe", confirmado: false })).codigo).toBe(
      "CASO_NO_ENCONTRADO",
    );
  });

  test("confirmado true antes de armar_paquete da PAQUETE_NO_ARMADO", async () => {
    const proyecto = await nuevoProyecto();
    await generarCaso(herramientas, ctx(proyecto.raiz), CO);
    const respuesta = await simular(proyecto.raiz, { caso: CO, confirmado: true });
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("PAQUETE_NO_ARMADO");
    expect(respuesta.error).toBe("Primero arma el paquete del caso con proveedor_armar_paquete.");
    expect(existsSync(envioSimulado(proyecto.raiz, CO))).toBe(false);
  });

  test("ec confirmado registra los bloqueos vigentes y solo agrega ENVIO-SIMULADO.md", async () => {
    const proyecto = await armado(EC);
    const carpeta = join(proyecto.raiz, "out", EC);
    const antes = await archivosBajo(carpeta);
    const respuesta = await simular(proyecto.raiz, { caso: EC, confirmado: true });
    expect(respuesta.ok).toBe(true);
    expect(respuesta.data?.ruta).toBe(`out/${EC}/ENVIO-SIMULADO.md`);
    expect(respuesta.data?.bloqueos).toEqual([BLOQUEO_EC]);
    expect(respuesta.resumen).toBe(`${EC}: envío simulado registrado con bloqueos (${BLOQUEO_EC})`);
    const despues = await archivosBajo(carpeta);
    expect(despues.filter((archivo) => !antes.includes(archivo))).toEqual(["ENVIO-SIMULADO.md"]);
    const registro = await readFile(envioSimulado(proyecto.raiz, EC), "utf8");
    expect(registro).toContain(`- ${BLOQUEO_EC}`);
    expect(registro).toContain("Fecha de ejecución: 2026-09-03");
    expect(registro).toContain("No se envió ningún correo real");
    expect(registro).toContain("Confirmado explícitamente por la usuaria");
    expect(registro).toContain("- paquete/checklist.md");
  });

  test("co confirmado no exige listo_para_firma y registra Sin bloqueos", async () => {
    const proyecto = await armado(CO);
    const respuesta = await simular(proyecto.raiz, { caso: CO, confirmado: true });
    expect(respuesta.ok).toBe(true);
    expect(respuesta.data?.bloqueos).toEqual([]);
    expect(await readFile(envioSimulado(proyecto.raiz, CO), "utf8")).toContain("Sin bloqueos.");
  });

  test("generar_formulario sobre ec después del envío borra paquete/ y ENVIO-SIMULADO.md (D-12)", async () => {
    const proyecto = await armado(EC);
    await simular(proyecto.raiz, { caso: EC, confirmado: true });
    expect(existsSync(envioSimulado(proyecto.raiz, EC))).toBe(true);
    await generarCaso(herramientas, ctx(proyecto.raiz), EC);
    expect(existsSync(envioSimulado(proyecto.raiz, EC))).toBe(false);
    expect(existsSync(join(proyecto.raiz, "out", EC, "paquete"))).toBe(false);
  });

  test("cada llamada agrega una línea a los dos log.jsonl con un resumen de estados y códigos (SEG-04)", async () => {
    const proyecto = await armado(EC);
    const global = join(proyecto.raiz, "out", "log.jsonl");
    const delCaso = join(proyecto.raiz, "out", EC, "log.jsonl");
    const llamadas = [{ caso: EC, confirmado: false }, { caso: EC }, { caso: EC, confirmado: true }];
    for (const args of llamadas) {
      const antes = { global: await lineasDe(global), caso: await lineasDe(delCaso) };
      await simular(proyecto.raiz, args);
      expect(await lineasDe(global)).toBe(antes.global + 1);
      expect(await lineasDe(delCaso)).toBe(antes.caso + 1);
    }
    const lineas = (await readFile(delCaso, "utf8")).trim().split("\n").slice(-3);
    const entradas = lineas.map((linea) => JSON.parse(linea));
    expect(entradas.map((entrada) => entrada.herramienta)).toEqual([
      "proveedor_simular_envio",
      "proveedor_simular_envio",
      "proveedor_simular_envio",
    ]);
    expect(entradas.map((entrada) => entrada.resumen)).toEqual([
      "simular_envio: CONFIRMACION_REQUERIDA",
      "simular_envio: CONFIRMACION_REQUERIDA",
      `${EC}: envío simulado registrado con bloqueos (${BLOQUEO_EC})`,
    ]);
  });
});
