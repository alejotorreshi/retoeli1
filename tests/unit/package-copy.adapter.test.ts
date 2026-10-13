import { afterAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FIXTURES_DIR, SOPORTES_DIR } from "@/config/constants/files.constants.ts";
import { resetPackage } from "@/infra/output/output-files.adapter.ts";
import { copyIntoPackage } from "@/infra/output/package-copy.adapter.ts";

const CASO = "co-industrias-delta";
const temporales: string[] = [];

afterAll(async () => {
  await Promise.all(temporales.map((ruta) => rm(ruta, { recursive: true, force: true })));
});

type Escenario = { readonly raiz: string; readonly soportes: string; readonly paquete: string };

async function escenario(): Promise<Escenario> {
  const raiz = await mkdtemp(join(tmpdir(), "copias-"));
  temporales.push(raiz);
  const soportes = join(raiz, FIXTURES_DIR, SOPORTES_DIR);
  await mkdir(soportes, { recursive: true });
  await writeFile(join(soportes, "rut-2026.txt"), "rut ficticio\n");
  await resetPackage(raiz, CASO);
  return { raiz, soportes, paquete: join(raiz, "out", CASO, "paquete") };
}

describe("resetPackage", () => {
  test("crea out/<caso>/paquete vacío, borra lo previo y devuelve la ruta relativa", async () => {
    const { raiz, paquete } = await escenario();
    await writeFile(join(paquete, "viejo.txt"), "x");
    expect(await resetPackage(raiz, CASO)).toBe(`out/${CASO}/paquete`);
    expect(await readdir(paquete)).toEqual([]);
  });

  test("rechaza un caso inválido", async () => {
    const { raiz } = await escenario();
    await expect(resetPackage(raiz, "../x")).rejects.toThrow(RangeError);
  });
});

describe("copyIntoPackage (T-01-16)", () => {
  test("copia un soporte del repositorio y devuelve la ruta relativa", async () => {
    const { raiz, soportes, paquete } = await escenario();
    const ruta = await copyIntoPackage(raiz, CASO, join(soportes, "rut-2026.txt"), "rut-2026.txt");
    expect(ruta).toBe(`out/${CASO}/paquete/rut-2026.txt`);
    expect(await readFile(join(paquete, "rut-2026.txt"), "utf8")).toBe("rut ficticio\n");
  });

  test("copia el formulario desde out/<caso>/", async () => {
    const { raiz, paquete } = await escenario();
    await writeFile(join(raiz, "out", CASO, "formulario.xlsx"), "xlsx");
    const origen = join(raiz, "out", CASO, "formulario.xlsx");
    expect(await copyIntoPackage(raiz, CASO, origen, "formulario.xlsx")).toBe(
      `out/${CASO}/paquete/formulario.xlsx`,
    );
    expect(existsSync(join(paquete, "formulario.xlsx"))).toBe(true);
  });

  for (const nombre of ["../rut.txt", "checklist.md", "borrador-correo.md", "Rut.txt", "a/b.txt", ""]) {
    test(`rechaza el destino "${nombre}"`, async () => {
      const { raiz, soportes } = await escenario();
      await expect(copyIntoPackage(raiz, CASO, join(soportes, "rut-2026.txt"), nombre)).rejects.toThrow(
        RangeError,
      );
    });
  }

  test("rechaza un origen fuera de los soportes y de out/<caso>", async () => {
    const { raiz, paquete } = await escenario();
    await writeFile(join(raiz, "secreto.txt"), "no");
    await expect(copyIntoPackage(raiz, CASO, join(raiz, "secreto.txt"), "secreto.txt")).rejects.toThrow(
      RangeError,
    );
    expect(existsSync(join(paquete, "secreto.txt"))).toBe(false);
  });

  test("rechaza un soporte que es un symlink hacia afuera del repositorio", async () => {
    const { raiz, soportes, paquete } = await escenario();
    const afuera = await mkdtemp(join(tmpdir(), "afuera-"));
    temporales.push(afuera);
    await writeFile(join(afuera, "clave.txt"), "no");
    await symlink(join(afuera, "clave.txt"), join(soportes, "enlace.txt"));
    await expect(copyIntoPackage(raiz, CASO, join(soportes, "enlace.txt"), "enlace.txt")).rejects.toThrow(
      RangeError,
    );
    expect(existsSync(join(paquete, "enlace.txt"))).toBe(false);
  });

  test("rechaza un origen dentro del propio paquete", async () => {
    const { raiz, paquete } = await escenario();
    await writeFile(join(paquete, "rut-2026.txt"), "x");
    await expect(copyIntoPackage(raiz, CASO, join(paquete, "rut-2026.txt"), "otro.txt")).rejects.toThrow(
      RangeError,
    );
  });

  test("rechaza un caso inválido", async () => {
    const { raiz, soportes } = await escenario();
    await expect(copyIntoPackage(raiz, "CO", join(soportes, "rut-2026.txt"), "rut-2026.txt")).rejects.toThrow(
      RangeError,
    );
  });
});
