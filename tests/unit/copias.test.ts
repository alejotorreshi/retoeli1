import { afterAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FIXTURES_DIR, SOPORTES_DIR } from "../../src/config/constantes.ts";
import { esquemaIndiceSoportes } from "../../src/infra/fixtures/esquemas.ts";
import { reiniciarPaquete } from "../../src/infra/salida/archivos.ts";
import { copiarAlPaquete } from "../../src/infra/salida/copias.ts";

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
  await reiniciarPaquete(raiz, CASO);
  return { raiz, soportes, paquete: join(raiz, "out", CASO, "paquete") };
}

describe("reiniciarPaquete", () => {
  test("crea out/<caso>/paquete vacío, borra lo previo y devuelve la ruta relativa", async () => {
    const { raiz, paquete } = await escenario();
    await writeFile(join(paquete, "viejo.txt"), "x");
    expect(await reiniciarPaquete(raiz, CASO)).toBe(`out/${CASO}/paquete`);
    expect(await readdir(paquete)).toEqual([]);
  });

  test("rechaza un caso inválido", async () => {
    const { raiz } = await escenario();
    await expect(reiniciarPaquete(raiz, "../x")).rejects.toThrow(RangeError);
  });
});

describe("copiarAlPaquete (T-01-16)", () => {
  test("copia un soporte del repositorio y devuelve la ruta relativa", async () => {
    const { raiz, soportes, paquete } = await escenario();
    const ruta = await copiarAlPaquete(raiz, CASO, join(soportes, "rut-2026.txt"), "rut-2026.txt");
    expect(ruta).toBe(`out/${CASO}/paquete/rut-2026.txt`);
    expect(await readFile(join(paquete, "rut-2026.txt"), "utf8")).toBe("rut ficticio\n");
  });

  test("copia el formulario desde out/<caso>/", async () => {
    const { raiz, paquete } = await escenario();
    await writeFile(join(raiz, "out", CASO, "formulario.xlsx"), "xlsx");
    const origen = join(raiz, "out", CASO, "formulario.xlsx");
    expect(await copiarAlPaquete(raiz, CASO, origen, "formulario.xlsx")).toBe(
      `out/${CASO}/paquete/formulario.xlsx`,
    );
    expect(existsSync(join(paquete, "formulario.xlsx"))).toBe(true);
  });

  for (const nombre of ["../rut.txt", "checklist.md", "borrador-correo.md", "Rut.txt", "a/b.txt", ""]) {
    test(`rechaza el destino "${nombre}"`, async () => {
      const { raiz, soportes } = await escenario();
      await expect(copiarAlPaquete(raiz, CASO, join(soportes, "rut-2026.txt"), nombre)).rejects.toThrow(
        RangeError,
      );
    });
  }

  test("rechaza un origen fuera de los soportes y de out/<caso>", async () => {
    const { raiz, paquete } = await escenario();
    await writeFile(join(raiz, "secreto.txt"), "no");
    await expect(copiarAlPaquete(raiz, CASO, join(raiz, "secreto.txt"), "secreto.txt")).rejects.toThrow(
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
    await expect(copiarAlPaquete(raiz, CASO, join(soportes, "enlace.txt"), "enlace.txt")).rejects.toThrow(
      RangeError,
    );
    expect(existsSync(join(paquete, "enlace.txt"))).toBe(false);
  });

  test("rechaza un origen dentro del propio paquete", async () => {
    const { raiz, paquete } = await escenario();
    await writeFile(join(paquete, "rut-2026.txt"), "x");
    await expect(copiarAlPaquete(raiz, CASO, join(paquete, "rut-2026.txt"), "otro.txt")).rejects.toThrow(
      RangeError,
    );
  });

  test("rechaza un caso inválido", async () => {
    const { raiz, soportes } = await escenario();
    await expect(copiarAlPaquete(raiz, "CO", join(soportes, "rut-2026.txt"), "rut-2026.txt")).rejects.toThrow(
      RangeError,
    );
  });
});

describe("esquemaIndiceSoportes (T-01-16)", () => {
  const valida = {
    tipo: "rut",
    archivo: "rut-2026.txt",
    vigencia_hasta: null,
    pais_emisor: "CO",
    descripcion: "Registro Único Tributario",
  };

  test("acepta una entrada válida con y sin vigencia", () => {
    expect(
      esquemaIndiceSoportes.safeParse([valida, { ...valida, vigencia_hasta: "2026-09-30" }]).success,
    ).toBe(true);
  });

  for (const archivo of [
    "../maestro.json",
    "a..b.txt",
    "checklist.md",
    "formulario.xlsx",
    "Rut.txt",
    "a/b",
  ]) {
    test(`rechaza el archivo "${archivo}"`, () => {
      expect(esquemaIndiceSoportes.safeParse([{ ...valida, archivo }]).success).toBe(false);
    });
  }

  test("rechaza una fecha inexistente, un país en minúsculas y claves extra", () => {
    expect(esquemaIndiceSoportes.safeParse([{ ...valida, vigencia_hasta: "2026-02-31" }]).success).toBe(
      false,
    );
    expect(esquemaIndiceSoportes.safeParse([{ ...valida, pais_emisor: "co" }]).success).toBe(false);
    expect(esquemaIndiceSoportes.safeParse([{ ...valida, extra: 1 }]).success).toBe(false);
  });
});
