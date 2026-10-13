import { afterAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { escribirArchivoSalida, limpiarArtefactosPrevios } from "@/infra/salida/archivos.ts";
import { conCandadoCaso } from "@/infra/salida/mutex.ts";

const temporales: string[] = [];

afterAll(async () => {
  await Promise.all(temporales.map((ruta) => rm(ruta, { recursive: true, force: true })));
});

async function raizTemporal(): Promise<string> {
  const raiz = await mkdtemp(join(tmpdir(), "salida-"));
  temporales.push(raiz);
  return raiz;
}

function esperar(milisegundos: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, milisegundos));
}

describe("escribirArchivoSalida (D-33.3)", () => {
  test("escribe dentro de out/<caso>/ creando carpetas y devuelve la ruta relativa", async () => {
    const raiz = await raizTemporal();
    const ruta = await escribirArchivoSalida(raiz, "co-industrias-delta", "mapeo.json", "{}\n");
    expect(ruta).toBe("out/co-industrias-delta/mapeo.json");
    expect(await readFile(join(raiz, "out", "co-industrias-delta", "mapeo.json"), "utf8")).toBe("{}\n");
  });

  test("acepta nombres anidados de la lista blanca", async () => {
    const raiz = await raizTemporal();
    const ruta = await escribirArchivoSalida(raiz, "ec-corp-andina", "paquete/checklist.md", "# x\n");
    expect(ruta).toBe("out/ec-corp-andina/paquete/checklist.md");
  });

  for (const nombre of ["otro.json", "../mapeo.json", "paquete/../../x.md", ""]) {
    test(`rechaza el nombre "${nombre}" fuera de la lista blanca sin escribir`, async () => {
      const raiz = await raizTemporal();
      await expect(escribirArchivoSalida(raiz, "co-industrias-delta", nombre, "x")).rejects.toThrow(
        RangeError,
      );
      expect(existsSync(join(raiz, "out"))).toBe(false);
    });
  }

  for (const caso of ["../x", "CO", "a/b", ""]) {
    test(`rechaza el caso "${caso}"`, async () => {
      const raiz = await raizTemporal();
      await expect(escribirArchivoSalida(raiz, caso, "mapeo.json", "x")).rejects.toThrow(RangeError);
    });
  }

  test("rechaza out/<caso> cuando es un symlink que sale de out/", async () => {
    const raiz = await raizTemporal();
    const afuera = await raizTemporal();
    await mkdir(join(raiz, "out"), { recursive: true });
    await symlink(afuera, join(raiz, "out", "escape"));
    await expect(escribirArchivoSalida(raiz, "escape", "mapeo.json", "x")).rejects.toThrow(RangeError);
    expect(existsSync(join(afuera, "mapeo.json"))).toBe(false);
  });
});

describe("limpiarArtefactosPrevios (D-12)", () => {
  test("no falla cuando out/<caso> no existe", async () => {
    const raiz = await raizTemporal();
    await limpiarArtefactosPrevios(raiz, "co-industrias-delta");
    expect(existsSync(join(raiz, "out"))).toBe(false);
  });

  test("borra paquete/, ENVIO-SIMULADO.md y los formularios previos y deja log.jsonl y mapeo.json (WR-07)", async () => {
    const raiz = await raizTemporal();
    const caso = join(raiz, "out", "co-industrias-delta");
    const borrados = ["ENVIO-SIMULADO.md", "formulario.xlsx", "formulario.pdf", "valores-portal.md"];
    await mkdir(join(caso, "paquete"), { recursive: true });
    for (const nombre of ["paquete/x.txt", "log.jsonl", "mapeo.json", ...borrados]) {
      await writeFile(join(caso, nombre), "x");
    }
    await limpiarArtefactosPrevios(raiz, "co-industrias-delta");
    expect(existsSync(join(caso, "paquete"))).toBe(false);
    for (const nombre of borrados) expect(existsSync(join(caso, nombre))).toBe(false);
    for (const nombre of ["log.jsonl", "mapeo.json"]) expect(existsSync(join(caso, nombre))).toBe(true);
  });

  test("rechaza out/<caso> cuando es un symlink que sale de out/ sin borrar afuera", async () => {
    const raiz = await raizTemporal();
    const afuera = await raizTemporal();
    await mkdir(join(afuera, "paquete"), { recursive: true });
    await writeFile(join(afuera, "paquete", "x.txt"), "ajeno");
    await mkdir(join(raiz, "out"), { recursive: true });
    await symlink(afuera, join(raiz, "out", "escape"));
    await expect(limpiarArtefactosPrevios(raiz, "escape")).rejects.toThrow(RangeError);
    expect(existsSync(join(afuera, "paquete", "x.txt"))).toBe(true);
  });

  for (const caso of ["../x", "a/b", ""]) {
    test(`rechaza el caso "${caso}"`, async () => {
      const raiz = await raizTemporal();
      await expect(limpiarArtefactosPrevios(raiz, caso)).rejects.toThrow(RangeError);
    });
  }
});

describe("conCandadoCaso", () => {
  test("serializa las secciones críticas de una misma clave", async () => {
    const eventos: string[] = [];
    const tarea = (nombre: string, demora: number) =>
      conCandadoCaso("caso-a", async () => {
        eventos.push(`inicio ${nombre}`);
        await esperar(demora);
        eventos.push(`fin ${nombre}`);
        return nombre;
      });
    const resultados = await Promise.all([tarea("uno", 20), tarea("dos", 1), tarea("tres", 1)]);
    expect(resultados).toEqual(["uno", "dos", "tres"]);
    expect(eventos).toEqual(["inicio uno", "fin uno", "inicio dos", "fin dos", "inicio tres", "fin tres"]);
  });

  test("libera el candado cuando la sección crítica falla", async () => {
    const fallida = conCandadoCaso("caso-b", async () => {
      throw new Error("falla");
    });
    await expect(fallida).rejects.toThrow("falla");
    expect(await conCandadoCaso("caso-b", async () => "siguiente")).toBe("siguiente");
  });

  test("claves distintas no se esperan entre sí", async () => {
    const eventos: string[] = [];
    const lenta = conCandadoCaso("caso-c", async () => {
      await esperar(20);
      eventos.push("lenta");
    });
    const rapida = conCandadoCaso("caso-d", async () => {
      eventos.push("rapida");
    });
    await Promise.all([lenta, rapida]);
    expect(eventos).toEqual(["rapida", "lenta"]);
  });
});
