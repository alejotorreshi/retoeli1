import { afterAll, describe, expect, test } from "bun:test";
import { chmod, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { directorioSoportes, soportesPresentes } from "@/infra/fixtures/fixtures-reader.adapter.ts";

const SOLO_ESCRITURA_Y_PASO = 0o300;
const LECTURA_COMPLETA = 0o755;
const proyectos: ProyectoTemporal[] = [];
const sueltos: string[] = [];

afterAll(async () => {
  await Promise.all(proyectos.map((proyecto) => proyecto.limpiar()));
  await Promise.all(sueltos.map((ruta) => rm(ruta, { recursive: true, force: true })));
});

async function proyecto(): Promise<ProyectoTemporal> {
  const creado = await crearProyectoTemporal();
  proyectos.push(creado);
  return creado;
}

describe("soportesPresentes distingue un repositorio ilegible de uno vacío (IN-08)", () => {
  test("lista los archivos de soportes sin el índice", async () => {
    const lectura = await soportesPresentes((await proyecto()).raiz);
    expect(lectura.estado).toBe("ok");
    if (lectura.estado !== "ok") return;
    expect(lectura.valor.has("rut-2026.txt")).toBe(true);
    expect(lectura.valor.has("index.json")).toBe(false);
  });

  test("sin carpeta de soportes es no_encontrado", async () => {
    const vacia = await mkdtemp(join(tmpdir(), "sin-soportes-"));
    sueltos.push(vacia);
    expect(await soportesPresentes(vacia)).toEqual({ estado: "no_encontrado" });
  });

  test("una carpeta que no se puede listar es invalido, no un conjunto vacío", async () => {
    const creado = await proyecto();
    const carpeta = directorioSoportes(creado.raiz);
    await chmod(carpeta, SOLO_ESCRITURA_Y_PASO);
    try {
      expect(await soportesPresentes(creado.raiz)).toEqual({ estado: "invalido" });
    } finally {
      await chmod(carpeta, LECTURA_COMPLETA);
    }
  });
});
