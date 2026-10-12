import { afterAll, describe, expect, spyOn, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { LIMITE_LECTURA_BYTES, MAX_ISSUES_ARGS } from "../../src/config/constantes.ts";
import { exito } from "../../src/domain/resultado.ts";
import { type ContextoHerramienta, defineTool, normalizarContexto } from "../../src/tools/define-tool.ts";
import { leer_solicitud } from "../../src/tools/proveedor.ts";

const RAIZ = join(import.meta.dir, "..", "..");
const CTX = { directory: RAIZ, sessionId: "trazador" };

type Respuesta = {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: string;
  codigo?: string;
  parcial?: Record<string, unknown>;
  resumen?: string;
};

async function leer(args: unknown): Promise<Respuesta> {
  const crudo = await leer_solicitud.execute(args, CTX);
  expect(typeof crudo).toBe("string");
  return JSON.parse(crudo);
}

describe("trazador: proveedor_leer_solicitud de punta a punta", () => {
  test("co-industrias-delta devuelve xlsx, CO, 17 campos en orden y 4 soportes", async () => {
    const respuesta = await leer({ caso: "co-industrias-delta" });
    expect(respuesta.ok).toBe(true);
    expect(respuesta.data).toMatchObject({
      caso: "co-industrias-delta",
      pais: "CO",
      cliente: "Industrias Delta S.A.S.",
      formato: "xlsx",
      plantilla: "plantilla-celdas.json",
      soportes: ["camara_comercio", "rut", "certificacion_bancaria", "estados_financieros"],
    });
    const campos = respuesta.data?.campos as { etiqueta: string; obligatorio: boolean | null }[];
    expect(campos).toHaveLength(17);
    expect(campos[0]).toEqual({ etiqueta: "Razón social", obligatorio: null });
    expect(campos.at(-1)).toEqual({ etiqueta: "Titular de la cuenta", obligatorio: null });
    expect(respuesta.resumen).toBe("co-industrias-delta: xlsx, CO, 17 campos, 4 soportes exigidos");
  });

  test("ec-corp-andina devuelve pdf con plantilla-campos.json", async () => {
    const respuesta = await leer({ caso: "ec-corp-andina" });
    expect(respuesta.ok).toBe(true);
    expect(respuesta.data).toMatchObject({ formato: "pdf", plantilla: "plantilla-campos.json", pais: "EC" });
    const campos = respuesta.data?.campos as { etiqueta: string; obligatorio: boolean | null }[];
    expect(campos[0]).toEqual({ etiqueta: "Nombre de la empresa", obligatorio: true });
  });

  test("pa-logistica-istmo devuelve portal con plantilla-campos.json", async () => {
    const respuesta = await leer({ caso: "pa-logistica-istmo" });
    expect(respuesta.ok).toBe(true);
    expect(respuesta.data).toMatchObject({
      formato: "portal",
      plantilla: "plantilla-campos.json",
      pais: "PA",
    });
  });

  test("la ejecución no escribe una carpeta out/ en el repositorio", async () => {
    await leer({ caso: "co-industrias-delta" });
    expect(existsSync(join(RAIZ, "out"))).toBe(false);
  });
});

function comoContexto(valor: unknown): ContextoHerramienta {
  return valor as ContextoHerramienta;
}

async function ejecutarCon(args: unknown, ctx: unknown): Promise<Respuesta> {
  return JSON.parse(await leer_solicitud.execute(args, comoContexto(ctx)));
}

describe("trazador: argumentos basura", () => {
  const basura: readonly [string, unknown][] = [
    ["undefined", undefined],
    ["null", null],
    ["42", 42],
    ["texto", "x"],
    ["arreglo", []],
    ["objeto vacío", {}],
    ["caso numérico", { caso: 5 }],
  ];

  for (const [nombre, args] of basura) {
    test(`${nombre} da ARGS_INVALIDOS sin lanzar`, async () => {
      const respuesta = await leer(args);
      expect(respuesta.ok).toBe(false);
      expect(respuesta.codigo).toBe("ARGS_INVALIDOS");
    });
  }

  test("una llave extra da ARGS_INVALIDOS con Llave desconocida", async () => {
    const respuesta = await leer({ caso: "co-industrias-delta", extra: 1 });
    expect(respuesta.codigo).toBe("ARGS_INVALIDOS");
    expect(respuesta.error).toContain("Llave desconocida");
  });

  test("el detalle usa ruta: mensaje y nunca repite el valor recibido", async () => {
    const crudo = await leer_solicitud.execute({ caso: 987654 }, CTX);
    const respuesta: Respuesta = JSON.parse(crudo);
    expect(respuesta.codigo).toBe("ARGS_INVALIDOS");
    expect(respuesta.error).toContain("caso: ");
    expect(crudo).not.toContain("987654");
  });

  test("un error en la raíz se reporta como (raíz)", async () => {
    const respuesta = await leer(undefined);
    expect(respuesta.error).toContain("(raíz): ");
  });

  test("el detalle se limita a MAX_ISSUES_ARGS problemas", async () => {
    const muchos = defineTool({
      nombre: "muchos",
      description: "Herramienta de prueba con muchos argumentos.",
      args: {
        a: z.string(),
        b: z.string(),
        c: z.string(),
        d: z.string(),
        e: z.string(),
        f: z.string(),
        g: z.string(),
      },
      ejecutar: async () => exito(null),
      presentar: (datos) => datos,
      resumir: () => "muchos",
    });
    const respuesta: Respuesta = JSON.parse(await muchos.execute({}, CTX));
    expect(respuesta.codigo).toBe("ARGS_INVALIDOS");
    const problemas = (respuesta.error ?? "").split("; ");
    expect(problemas).toHaveLength(MAX_ISSUES_ARGS);
  });
});

describe("trazador: casos con forma de recorrido", () => {
  for (const caso of ["../x", "a/b", "CO"]) {
    test(`"${caso}" da CASO_INVALIDO`, async () => {
      const respuesta = await leer({ caso });
      expect(respuesta.codigo).toBe("CASO_INVALIDO");
    });
  }

  test("un caso bien formado sin carpeta da CASO_NO_ENCONTRADO", async () => {
    const respuesta = await leer({ caso: "no-existe" });
    expect(respuesta.codigo).toBe("CASO_NO_ENCONTRADO");
  });
});

describe("trazador: contexto de ejecución", () => {
  test("ctx vacío da CONFIGURACION_INVALIDA", async () => {
    const respuesta = await ejecutarCon({ caso: "co-industrias-delta" }, {});
    expect(respuesta.codigo).toBe("CONFIGURACION_INVALIDA");
  });

  test("directory vacío da CONFIGURACION_INVALIDA", async () => {
    const respuesta = await ejecutarCon({ caso: "co-industrias-delta" }, { directory: "" });
    expect(respuesta.codigo).toBe("CONFIGURACION_INVALIDA");
  });

  test("ctx ausente da CONFIGURACION_INVALIDA", async () => {
    const respuesta = await ejecutarCon({ caso: "co-industrias-delta" }, undefined);
    expect(respuesta.codigo).toBe("CONFIGURACION_INVALIDA");
  });

  test("normalizarContexto acepta sessionID", () => {
    const contexto = normalizarContexto(comoContexto({ directory: "x", sessionID: "s-1" }));
    expect(contexto.ok && contexto.data.sesion).toBe("s-1");
  });

  test("normalizarContexto usa sin-sesion si no hay sesión", () => {
    const contexto = normalizarContexto({ directory: "x" });
    expect(contexto.ok && contexto.data.sesion).toBe("sin-sesion");
  });
});

describe("trazador: excepciones internas", () => {
  test("una herramienta que lanza da ERROR_INTERNO sin traza y solo el nombre del error a stderr", async () => {
    const espia = spyOn(console, "error").mockImplementation(() => undefined);
    const rota = defineTool({
      nombre: "rota",
      description: "Herramienta de prueba que siempre lanza.",
      args: {},
      ejecutar: async () => {
        throw new TypeError("secreto-123");
      },
      presentar: (datos) => datos,
      resumir: () => "rota",
    });
    const crudo = await rota.execute({}, CTX);
    const llamadas = espia.mock.calls.map((llamada) => llamada.map(String).join(" "));
    espia.mockRestore();
    const respuesta: Respuesta = JSON.parse(crudo);
    expect(respuesta.codigo).toBe("ERROR_INTERNO");
    expect(crudo.split("\n").some((linea) => linea.startsWith("    at "))).toBe(false);
    expect(crudo).not.toContain("secreto-123");
    expect(llamadas.length).toBeGreaterThan(0);
    expect(llamadas.join("\n")).toContain("TypeError");
    expect(llamadas.join("\n")).not.toContain("secreto-123");
  });

  test("importar proveedor.ts con el entorno vacío expone leer_solicitud", async () => {
    const proceso = Bun.spawn(
      [
        process.execPath,
        "-e",
        'const m = await import("./src/tools/proveedor.ts"); console.log(Object.keys(m).join(","));',
      ],
      { cwd: RAIZ, env: {}, stdout: "pipe", stderr: "pipe" },
    );
    const salida = await new Response(proceso.stdout).text();
    expect(await proceso.exited).toBe(0);
    expect(salida.trim()).toBe("leer_solicitud");
  });
});

describe("trazador: fixtures inválidos en un proyecto temporal", () => {
  const temporales: string[] = [];

  afterAll(async () => {
    await Promise.all(temporales.map((ruta) => rm(ruta, { recursive: true, force: true })));
  });

  async function proyectoCon(archivos: Readonly<Record<string, string>>): Promise<string> {
    const raiz = await mkdtemp(join(tmpdir(), "trazador-"));
    temporales.push(raiz);
    const caso = join(raiz, "reto-01", "fixtures", "reto-01", "casos", "roto");
    await mkdir(caso, { recursive: true });
    await Promise.all(
      Object.entries(archivos).map(([nombre, contenido]) => writeFile(join(caso, nombre), contenido)),
    );
    return raiz;
  }

  const solicitudValida = JSON.stringify({
    id: "roto",
    de: "a@b.test",
    para: "c@d.test",
    asunto: "Asunto",
    fecha: "2026-08-25",
    pais: "CO",
    cliente: "Cliente Ficticio",
    formato: "xlsx",
    cuerpo: "Cuerpo",
    adjuntos: [],
  });

  test("un solicitud.json inválido da DATOS_INVALIDOS", async () => {
    const raiz = await proyectoCon({ "solicitud.json": "{no es json", "soportes-exigidos.json": "[]" });
    const respuesta = await ejecutarCon({ caso: "roto" }, { directory: raiz });
    expect(respuesta.codigo).toBe("DATOS_INVALIDOS");
  });

  test("un solicitud.json mayor al límite da DATOS_INVALIDOS", async () => {
    const raiz = await proyectoCon({
      "solicitud.json": `${" ".repeat(LIMITE_LECTURA_BYTES + 1)}{}`,
      "soportes-exigidos.json": "[]",
    });
    const respuesta = await ejecutarCon({ caso: "roto" }, { directory: raiz });
    expect(respuesta.codigo).toBe("DATOS_INVALIDOS");
  });

  test("xlsx con solo plantilla-campos.json da PLANTILLA_INVALIDA con parcial", async () => {
    const raiz = await proyectoCon({
      "solicitud.json": solicitudValida,
      "soportes-exigidos.json": '["rut"]',
      "plantilla-campos.json": '[{"etiqueta":"NIT","obligatorio":true}]',
    });
    const respuesta = await ejecutarCon({ caso: "roto" }, { directory: raiz });
    expect(respuesta.codigo).toBe("PLANTILLA_INVALIDA");
    expect(respuesta.parcial).toEqual({
      pais: "CO",
      cliente: "Cliente Ficticio",
      formato: "xlsx",
      soportes: ["rut"],
    });
  });
});
