import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { LIMITE_LECTURA_BYTES, MAX_ISSUES_ARGS } from "../../src/config/constantes.ts";
import { exito } from "../../src/domain/resultado.ts";
import { relojFijo, relojSistema } from "../../src/infra/reloj.ts";
import { type ContextoHerramienta, defineTool, normalizarContexto } from "../../src/tools/define-tool.ts";
import { leer_solicitud } from "../../src/tools/proveedor.ts";
import { crearProyectoTemporal, type ProyectoTemporal } from "../helpers/proyecto-temporal.ts";

const RAIZ_REPO = join(import.meta.dir, "..", "..");
const CASOS_REALES = ["co-industrias-delta", "ec-corp-andina", "hn-agroexport-sula", "pa-logistica-istmo"];

const proyectos: ProyectoTemporal[] = [];
let compartido: ProyectoTemporal;
let CTX: ContextoHerramienta;

async function nuevoProyecto(): Promise<ProyectoTemporal> {
  const proyecto = await crearProyectoTemporal();
  proyectos.push(proyecto);
  return proyecto;
}

beforeAll(async () => {
  compartido = await nuevoProyecto();
  CTX = { directory: compartido.raiz, sessionId: "trazador" };
});

afterAll(async () => {
  await Promise.all(proyectos.map((proyecto) => proyecto.limpiar()));
});

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

  test("la ejecución nunca escribe en la carpeta out/ del repositorio", async () => {
    const rutaLog = join(RAIZ_REPO, "out", "log.jsonl");
    const antes = existsSync(rutaLog) ? await readFile(rutaLog, "utf8") : null;
    await leer({ caso: "co-industrias-delta" });
    const despues = existsSync(rutaLog) ? await readFile(rutaLog, "utf8") : null;
    expect(despues).toBe(antes);
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

  test("un symlink dentro de casos/ que apunta fuera da CASO_INVALIDO", async () => {
    const proyecto = await nuevoProyecto();
    await symlink(tmpdir(), join(proyecto.casosDir, "escape"));
    const respuesta = await ejecutarCon({ caso: "escape" }, { directory: proyecto.raiz });
    expect(respuesta.codigo).toBe("CASO_INVALIDO");
  });
});

describe("trazador: listado de casos (D-14)", () => {
  for (const caso of ["no-existe", ""]) {
    test(`"${caso}" da CASO_NO_ENCONTRADO con los casos disponibles`, async () => {
      const respuesta = await leer({ caso });
      expect(respuesta.ok).toBe(false);
      expect(respuesta.codigo).toBe("CASO_NO_ENCONTRADO");
      expect(respuesta.parcial).toEqual({ casos_disponibles: CASOS_REALES });
    });
  }

  test("un caso inexistente no crea out/<caso>", async () => {
    await leer({ caso: "no-existe" });
    expect(existsSync(join(compartido.raiz, "out", "no-existe"))).toBe(false);
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

  test("importar proveedor.ts con el entorno vacío expone las herramientas sin leer el entorno", async () => {
    const proceso = Bun.spawn(
      [
        process.execPath,
        "-e",
        'const m = await import("./src/tools/proveedor.ts"); console.log(Object.keys(m).join(","));',
      ],
      { cwd: RAIZ_REPO, env: {}, stdout: "pipe", stderr: "pipe" },
    );
    const salida = await new Response(proceso.stdout).text();
    expect(await proceso.exited).toBe(0);
    expect(salida.trim()).toBe("armar_paquete,generar_formulario,leer_solicitud,mapear_campos,simular_envio");
  });
});

describe("trazador: fixtures inválidos en un proyecto temporal", () => {
  async function proyectoCon(archivos: Readonly<Record<string, string>>): Promise<string> {
    const proyecto = await nuevoProyecto();
    const caso = join(proyecto.casosDir, "roto");
    await mkdir(caso, { recursive: true });
    await Promise.all(
      Object.entries(archivos).map(([nombre, contenido]) => writeFile(join(caso, nombre), contenido)),
    );
    return proyecto.raiz;
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

  test("una copia de co con plantilla-celdas.json corrupta da PLANTILLA_INVALIDA con soportes (D-17)", async () => {
    const proyecto = await nuevoProyecto();
    const rota = join(proyecto.casosDir, "zz-plantilla-rota");
    await cp(join(proyecto.casosDir, "co-industrias-delta"), rota, { recursive: true });
    await writeFile(join(rota, "plantilla-celdas.json"), "[{ esto no es json");
    const respuesta = await ejecutarCon({ caso: "zz-plantilla-rota" }, { directory: proyecto.raiz });
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("PLANTILLA_INVALIDA");
    expect(respuesta.parcial?.pais).toBe("CO");
    expect(respuesta.parcial?.formato).toBe("xlsx");
    expect(respuesta.parcial?.soportes).toHaveLength(4);
  });
});

type LineaLog = Record<string, unknown>;

async function lineasDe(ruta: string): Promise<LineaLog[]> {
  if (!existsSync(ruta)) return [];
  const texto = await readFile(ruta, "utf8");
  return texto
    .split("\n")
    .filter((linea) => linea !== "")
    .map((linea) => JSON.parse(linea));
}

function logGlobal(proyecto: ProyectoTemporal): Promise<LineaLog[]> {
  return lineasDe(join(proyecto.raiz, "out", "log.jsonl"));
}

function logCaso(proyecto: ProyectoTemporal, caso: string): Promise<LineaLog[]> {
  return lineasDe(join(proyecto.raiz, "out", caso, "log.jsonl"));
}

async function conVariables<T>(
  variables: Readonly<Record<string, string>>,
  accion: () => Promise<T>,
): Promise<T> {
  const previas = Object.fromEntries(Object.keys(variables).map((clave) => [clave, process.env[clave]]));
  Object.assign(process.env, variables);
  try {
    return await accion();
  } finally {
    for (const [clave, valor] of Object.entries(previas)) {
      if (valor === undefined) delete process.env[clave];
      else process.env[clave] = valor;
    }
  }
}

describe("trazador: bitácora global y por caso", () => {
  test("una llamada a co agrega una línea a cada log y la del caso solo trae ts, herramienta, ok, resumen y sesion", async () => {
    const proyecto = await nuevoProyecto();
    await ejecutarCon({ caso: "co-industrias-delta" }, { directory: proyecto.raiz, sessionId: "s-1" });
    const global = await logGlobal(proyecto);
    const delCaso = await logCaso(proyecto, "co-industrias-delta");
    expect(global).toHaveLength(1);
    expect(delCaso).toHaveLength(1);
    expect(global[0]).toMatchObject({
      herramienta: "proveedor_leer_solicitud",
      ok: true,
      sesion: "s-1",
      caso: "co-industrias-delta",
    });
    expect(Object.keys(delCaso[0] ?? {}).sort()).toEqual(["herramienta", "ok", "resumen", "sesion", "ts"]);
    expect(delCaso[0]?.herramienta).toBe("proveedor_leer_solicitud");
    expect(typeof delCaso[0]?.ts).toBe("string");
  });

  test("una llave extra deja una línea global con ARGS_INVALIDOS, sin caso y sin log del caso", async () => {
    const proyecto = await nuevoProyecto();
    await ejecutarCon({ caso: "co-industrias-delta", extra: 1 }, { directory: proyecto.raiz });
    const global = await logGlobal(proyecto);
    expect(global).toHaveLength(1);
    expect(global[0]?.codigo).toBe("ARGS_INVALIDOS");
    expect(global[0]?.ok).toBe(false);
    expect("caso" in (global[0] ?? {})).toBe(false);
    expect(existsSync(join(proyecto.raiz, "out", "co-industrias-delta"))).toBe(false);
  });

  test("un ctx con solo sessionID registra esa sesion", async () => {
    const proyecto = await nuevoProyecto();
    await ejecutarCon({ caso: "co-industrias-delta" }, { directory: proyecto.raiz, sessionID: "s-7" });
    const global = await logGlobal(proyecto);
    const delCaso = await logCaso(proyecto, "co-industrias-delta");
    expect(global[0]?.sesion).toBe("s-7");
    expect(delCaso[0]?.sesion).toBe("s-7");
  });

  test("un caso inexistente se registra solo en el log global con su código", async () => {
    const proyecto = await nuevoProyecto();
    await ejecutarCon({ caso: "no-existe" }, { directory: proyecto.raiz });
    const global = await logGlobal(proyecto);
    expect(global).toHaveLength(1);
    expect(global[0]).toMatchObject({ ok: false, codigo: "CASO_NO_ENCONTRADO", caso: "no-existe" });
    expect(existsSync(join(proyecto.raiz, "out", "no-existe"))).toBe(false);
  });

  test("ningún log contiene el valor crudo de un argumento", async () => {
    const proyecto = await nuevoProyecto();
    await ejecutarCon({ caso: "co-industrias-delta", extra: "zzz-marca" }, { directory: proyecto.raiz });
    await ejecutarCon({ caso: "co-industrias-delta" }, { directory: proyecto.raiz });
    const archivos = [...new Bun.Glob("out/**/*.jsonl").scanSync({ cwd: proyecto.raiz })];
    expect(archivos.length).toBeGreaterThan(0);
    for (const archivo of archivos) {
      expect(await readFile(join(proyecto.raiz, archivo), "utf8")).not.toContain("zzz-marca");
    }
  });

  test("un ctx inválido no escribe ningún log", async () => {
    const respuesta = await ejecutarCon({ caso: "co-industrias-delta" }, { directory: "" });
    expect(respuesta.codigo).toBe("CONFIGURACION_INVALIDA");
  });
});

describe("trazador: configuración por ejecución", () => {
  test('FECHA_EJECUCION "" equivale a no definida', async () => {
    const respuesta = await conVariables({ FECHA_EJECUCION: "" }, () =>
      leer({ caso: "co-industrias-delta" }),
    );
    expect(respuesta.ok).toBe(true);
  });

  test('FECHA_EJECUCION "2026-02-30" da CONFIGURACION_INVALIDA', async () => {
    const respuesta = await conVariables({ FECHA_EJECUCION: "2026-02-30" }, () =>
      leer({ caso: "co-industrias-delta" }),
    );
    expect(respuesta.codigo).toBe("CONFIGURACION_INVALIDA");
  });

  test("una zona horaria inexistente da CONFIGURACION_INVALIDA", async () => {
    const respuesta = await conVariables({ TZ_NEGOCIO: "Marte/Olimpo" }, () =>
      leer({ caso: "co-industrias-delta" }),
    );
    expect(respuesta.codigo).toBe("CONFIGURACION_INVALIDA");
  });

  test("la configuración inválida también queda en el log global", async () => {
    const proyecto = await nuevoProyecto();
    await conVariables({ FECHA_EJECUCION: "2026-13-01" }, () =>
      ejecutarCon({ caso: "co-industrias-delta" }, { directory: proyecto.raiz }),
    );
    const global = await logGlobal(proyecto);
    expect(global).toHaveLength(1);
    expect(global[0]?.codigo).toBe("CONFIGURACION_INVALIDA");
  });
});

describe("reloj inyectable", () => {
  test('relojFijo("2026-09-03").hoy() es 2026-09-03', () => {
    expect(relojFijo("2026-09-03").hoy()).toBe("2026-09-03");
  });

  test("relojSistema en America/Bogota da una fecha YYYY-MM-DD e instanteReal() es ISO", () => {
    const reloj = relojSistema("America/Bogota");
    expect(reloj.hoy()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(reloj.instanteReal()))).toBe(false);
  });
});
