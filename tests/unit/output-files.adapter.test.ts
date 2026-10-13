import { afterAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { link, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isNotFound } from "@/infra/fs/fs.util.ts";
import { withCaseLock } from "@/infra/output/case-lock.adapter.ts";
import {
  clearPreviousArtifacts,
  listPackage,
  readPackageFile,
  writeOutputFile,
} from "@/infra/output/output-files.adapter.ts";

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

describe("writeOutputFile (D-33.3)", () => {
  test("escribe dentro de out/<caso>/ creando carpetas y devuelve la ruta relativa", async () => {
    const raiz = await raizTemporal();
    const ruta = await writeOutputFile(raiz, "co-industrias-delta", "mapeo.json", "{}\n");
    expect(ruta).toBe("out/co-industrias-delta/mapeo.json");
    expect(await readFile(join(raiz, "out", "co-industrias-delta", "mapeo.json"), "utf8")).toBe("{}\n");
  });

  test("acepta nombres anidados de la lista blanca", async () => {
    const raiz = await raizTemporal();
    const ruta = await writeOutputFile(raiz, "ec-corp-andina", "paquete/checklist.md", "# x\n");
    expect(ruta).toBe("out/ec-corp-andina/paquete/checklist.md");
  });

  for (const nombre of ["otro.json", "../mapeo.json", "paquete/../../x.md", "", "paquete", "log.jsonl"]) {
    test(`rechaza el nombre "${nombre}" fuera de la lista blanca sin escribir`, async () => {
      const raiz = await raizTemporal();
      await expect(writeOutputFile(raiz, "co-industrias-delta", nombre, "x")).rejects.toThrow(RangeError);
      expect(existsSync(join(raiz, "out"))).toBe(false);
    });
  }

  for (const caso of ["../x", "CO", "a/b", ""]) {
    test(`rechaza el caso "${caso}"`, async () => {
      const raiz = await raizTemporal();
      await expect(writeOutputFile(raiz, caso, "mapeo.json", "x")).rejects.toThrow(RangeError);
    });
  }

  test("rechaza out/<caso> cuando es un symlink que sale de out/", async () => {
    const raiz = await raizTemporal();
    const afuera = await raizTemporal();
    await mkdir(join(raiz, "out"), { recursive: true });
    await symlink(afuera, join(raiz, "out", "escape"));
    await expect(writeOutputFile(raiz, "escape", "mapeo.json", "x")).rejects.toThrow(RangeError);
    expect(existsSync(join(afuera, "mapeo.json"))).toBe(false);
  });
});

describe("clearPreviousArtifacts (D-12)", () => {
  test("no falla cuando out/<caso> no existe", async () => {
    const raiz = await raizTemporal();
    await clearPreviousArtifacts(raiz, "co-industrias-delta");
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
    await clearPreviousArtifacts(raiz, "co-industrias-delta");
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
    await expect(clearPreviousArtifacts(raiz, "escape")).rejects.toThrow(RangeError);
    expect(existsSync(join(afuera, "paquete", "x.txt"))).toBe(true);
  });

  for (const caso of ["../x", "a/b", ""]) {
    test(`rechaza el caso "${caso}"`, async () => {
      const raiz = await raizTemporal();
      await expect(clearPreviousArtifacts(raiz, caso)).rejects.toThrow(RangeError);
    });
  }
});

describe("listPackage y readPackageFile (T-01-33)", () => {
  const CASO = "co-industrias-delta";

  async function paqueteCon(raiz: string, archivos: Readonly<Record<string, string>>): Promise<string> {
    const paquete = join(raiz, "out", CASO, "paquete");
    await mkdir(paquete, { recursive: true });
    for (const [nombre, contenido] of Object.entries(archivos))
      await writeFile(join(paquete, nombre), contenido);
    return paquete;
  }

  test("lista solo los archivos regulares de paquete/, ordenados", async () => {
    const raiz = await raizTemporal();
    const paquete = await paqueteCon(raiz, { "checklist.md": "c", "borrador-correo.md": "b" });
    await mkdir(join(paquete, "sub"));
    expect(await listPackage(raiz, CASO)).toEqual(["borrador-correo.md", "checklist.md"]);
  });

  test("falla cerrado cuando paquete/ es un symlink que sale del caso", async () => {
    const raiz = await raizTemporal();
    const afuera = await raizTemporal();
    await writeFile(join(afuera, "secreto-ajeno.txt"), "x");
    await mkdir(join(raiz, "out", CASO), { recursive: true });
    await symlink(afuera, join(raiz, "out", CASO, "paquete"));
    await expect(listPackage(raiz, CASO)).rejects.toThrow(RangeError);
  });

  test("no crea out/<caso> al listar un caso sin salida", async () => {
    const raiz = await raizTemporal();
    await expect(listPackage(raiz, CASO)).rejects.toThrow();
    expect(existsSync(join(raiz, "out", CASO))).toBe(false);
  });

  test("lee el borrador del paquete y devuelve null si no existe", async () => {
    const raiz = await raizTemporal();
    await paqueteCon(raiz, { "borrador-correo.md": "Hola\n" });
    expect(await readPackageFile(raiz, CASO, "borrador-correo.md")).toBe("Hola\n");
    expect(await readPackageFile(raiz, CASO, "checklist.md")).toBeNull();
  });

  test("rechaza un borrador que es un symlink a un archivo de afuera", async () => {
    const raiz = await raizTemporal();
    const afuera = await raizTemporal();
    const ajeno = join(afuera, "ajeno.md");
    await writeFile(ajeno, "contenido ajeno\n");
    const paquete = await paqueteCon(raiz, {});
    await symlink(ajeno, join(paquete, "borrador-correo.md"));
    await expect(readPackageFile(raiz, CASO, "borrador-correo.md")).rejects.toThrow(RangeError);
  });

  test("rechaza un borrador que es un enlace duro a otro archivo", async () => {
    const raiz = await raizTemporal();
    const ajeno = join(raiz, "ajeno.md");
    await writeFile(ajeno, "contenido ajeno\n");
    const paquete = await paqueteCon(raiz, {});
    await link(ajeno, join(paquete, "borrador-correo.md"));
    await expect(readPackageFile(raiz, CASO, "borrador-correo.md")).rejects.toThrow(RangeError);
  });
});

describe("withCaseLock", () => {
  test("serializa las secciones críticas de una misma clave", async () => {
    const eventos: string[] = [];
    const tarea = (nombre: string, demora: number) =>
      withCaseLock("caso-a", async () => {
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
    const fallida = withCaseLock("caso-b", async () => {
      throw new Error("falla");
    });
    await expect(fallida).rejects.toThrow("falla");
    expect(await withCaseLock("caso-b", async () => "siguiente")).toBe("siguiente");
  });

  test("claves distintas no se esperan entre sí", async () => {
    const eventos: string[] = [];
    const lenta = withCaseLock("caso-c", async () => {
      await esperar(20);
      eventos.push("lenta");
    });
    const rapida = withCaseLock("caso-d", async () => {
      eventos.push("rapida");
    });
    await Promise.all([lenta, rapida]);
    expect(eventos).toEqual(["rapida", "lenta"]);
  });
});

describe("isNotFound (WR-19)", () => {
  test("trata ENOENT y ENOTDIR como no encontrado y nada más", () => {
    const conCodigo = (code: string) => Object.assign(new Error("x"), { code });
    expect(isNotFound(conCodigo("ENOENT"))).toBe(true);
    expect(isNotFound(conCodigo("ENOTDIR"))).toBe(true);
    expect(isNotFound(conCodigo("EACCES"))).toBe(false);
    expect(isNotFound("ENOENT")).toBe(false);
  });
});
