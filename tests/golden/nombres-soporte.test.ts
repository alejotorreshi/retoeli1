import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { generarCaso } from "@tests/helpers/flujo.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import {
  ARCHIVO_BITACORA,
  ARCHIVOS_CASO,
  CASOS_DIR,
  FIXTURES_DIR,
  INDICE_SOPORTES,
  SOPORTES_DIR,
} from "@/config/constants/files.constants.ts";
import { NOMBRE_SOPORTE, TEXTO_SOPORTE } from "@/config/strings.ts";
import { crearHerramientas } from "@/tools/factories/herramientas.factory.ts";

const CO = "co-industrias-delta";
const EC = "ec-corp-andina";
const HN = "hn-agroexport-sula";
const PA = "pa-logistica-istmo";
const CASOS = [CO, EC, HN, PA] as const;
const SALIDAS_LEGIBLES = ["paquete/borrador-correo.md", "paquete/checklist.md", "ENVIO-SIMULADO.md"];
const BLOQUEOS_CRUDOS: Readonly<Record<string, readonly string[]>> = {
  [CO]: [],
  [EC]: ["ausente: certificado_cumplimiento_tributario"],
  [HN]: ["vencido: parafiscales (2026-08-31)"],
  [PA]: [],
};
const IDS_SNAKE = Object.keys(NOMBRE_SOPORTE).filter((tipo) => tipo.includes("_"));
const TODOS_LOS_IDS = Object.keys(NOMBRE_SOPORTE);

function formasRenderizadas(tipo: string): readonly string[] {
  return [
    `ausente: ${tipo}`,
    `vencido: ${tipo} (`,
    `| ${tipo} |`,
    `- ${tipo}\n`,
    `- ${tipo} (`,
    `soporte ${tipo}`,
  ];
}

function idsRenderizadosEn(texto: string): readonly string[] {
  return TODOS_LOS_IDS.flatMap((tipo) => formasRenderizadas(tipo).filter((forma) => texto.includes(forma)));
}

type Respuesta = {
  readonly ok: boolean;
  readonly data?: {
    readonly bloqueos: readonly string[];
    readonly checklist?: { readonly soportes: readonly { readonly tipo: string }[] };
  };
  readonly resumen?: string;
};

type Corrida = { readonly paquete: Respuesta; readonly envio: Respuesta };

const herramientas = crearHerramientas();
const fechaPrevia = process.env.FECHA_EJECUCION;
const corridas = new Map<string, Corrida>();
let proyecto: ProyectoTemporal;

function ctx(raiz: string) {
  return { directory: raiz, sessionId: "golden-nombres-soporte" };
}

async function ejecutar(nombre: "armar_paquete" | "simular_envio", args: unknown): Promise<Respuesta> {
  return JSON.parse(await herramientas[nombre].execute(args, ctx(proyecto.raiz)));
}

function corridaDe(caso: string): Corrida {
  const corrida = corridas.get(caso);
  if (corrida === undefined) throw new Error(`sin corrida para ${caso}`);
  return corrida;
}

function leerSalida(caso: string, archivo: string): Promise<string> {
  return readFile(join(proyecto.raiz, "out", caso, archivo), "utf8");
}

async function leerJson<T>(ruta: string): Promise<T> {
  return JSON.parse(await readFile(ruta, "utf8"));
}

async function tiposDeFixtures(): Promise<ReadonlySet<string>> {
  const fixtures = join(proyecto.raiz, FIXTURES_DIR);
  const indice = await leerJson<readonly { readonly tipo: string }[]>(
    join(fixtures, SOPORTES_DIR, INDICE_SOPORTES),
  );
  const tipos = new Set(indice.map(({ tipo }) => tipo));
  const entradas = await readdir(join(fixtures, CASOS_DIR), { withFileTypes: true });
  for (const caso of entradas.filter((entrada) => entrada.isDirectory()).map((entrada) => entrada.name)) {
    const exigidos = await leerJson<readonly string[]>(
      join(fixtures, CASOS_DIR, caso, ARCHIVOS_CASO.soportesExigidos),
    );
    for (const tipo of exigidos) tipos.add(tipo);
  }
  return tipos;
}

async function exigidosDe(caso: string): Promise<readonly string[]> {
  return leerJson<readonly string[]>(
    join(proyecto.raiz, FIXTURES_DIR, CASOS_DIR, caso, ARCHIVOS_CASO.soportesExigidos),
  );
}

async function resumenesDeBitacora(caso: string): Promise<readonly string[]> {
  const texto = await leerSalida(caso, ARCHIVO_BITACORA);
  return texto
    .split("\n")
    .filter((linea) => linea !== "")
    .map((linea): { readonly resumen: string } => JSON.parse(linea))
    .map(({ resumen }) => resumen);
}

beforeAll(async () => {
  process.env.FECHA_EJECUCION = "2026-09-03";
  proyecto = await crearProyectoTemporal();
  for (const caso of CASOS) {
    const flujo = await generarCaso(herramientas, ctx(proyecto.raiz), caso);
    if (!flujo.respuesta.ok) throw new Error(`generar_formulario falló para ${caso}`);
    const paquete = await ejecutar("armar_paquete", { caso });
    const envio = await ejecutar("simular_envio", { caso, confirmado: true });
    if (!paquete.ok || !envio.ok) throw new Error(`armar_paquete o simular_envio falló para ${caso}`);
    corridas.set(caso, { paquete, envio });
  }
});

afterAll(async () => {
  if (fechaPrevia === undefined) delete process.env.FECHA_EJECUCION;
  else process.env.FECHA_EJECUCION = fechaPrevia;
  await proyecto.limpiar();
});

describe("guardián de nombres de soporte en salidas legibles (GC-2, G-01-H4c)", () => {
  test("la lista de ids prohibidos sale de NOMBRE_SOPORTE y no está vacía", () => {
    expect(IDS_SNAKE.length).toBeGreaterThan(0);
    for (const tipo of IDS_SNAKE) expect(Object.hasOwn(NOMBRE_SOPORTE, tipo)).toBe(true);
  });

  test("el guardián vigila también rut y parafiscales (WR-04)", () => {
    expect(TODOS_LOS_IDS).toContain("rut");
    expect(TODOS_LOS_IDS).toContain("parafiscales");
  });

  test("el detector muerde con ids sin guion bajo y deja pasar los nombres de archivo (WR-04)", () => {
    expect(idsRenderizadosEn("- ausente: rut\n")).toEqual(["ausente: rut"]);
    expect(idsRenderizadosEn("- vencido: parafiscales (2026-08-31)\n")).toEqual(["vencido: parafiscales ("]);
    expect(idsRenderizadosEn("| rut | rut-2026.txt |")).toEqual(["| rut |"]);
    expect(idsRenderizadosEn("Quedan pendientes estos soportes:\n- parafiscales\n")).toEqual([
      "- parafiscales\n",
    ]);
    expect(idsRenderizadosEn("- Conseguir el soporte rut y agregarlo")).toEqual(["soporte rut"]);
    expect(
      idsRenderizadosEn("- Registro Único Tributario (rut-2026.txt)\n- paquete/parafiscales-2026-07.txt\n"),
    ).toEqual([]);
  });

  for (const caso of CASOS) {
    for (const archivo of SALIDAS_LEGIBLES) {
      test(`${caso}: ${archivo} no contiene ids de soporte, ni snake_case ni en las formas renderizadas`, async () => {
        const texto = await leerSalida(caso, archivo);
        expect(texto.length).toBeGreaterThan(0);
        expect(IDS_SNAKE.filter((tipo) => texto.includes(tipo))).toEqual([]);
        expect(idsRenderizadosEn(texto)).toEqual([]);
      });
    }
  }

  test("ec y hn nombran en español sus bloqueos en ENVIO-SIMULADO.md", async () => {
    expect(await leerSalida(EC, "ENVIO-SIMULADO.md")).toContain(
      `- ausente: ${TEXTO_SOPORTE.nombre("certificado_cumplimiento_tributario")}`,
    );
    expect(await leerSalida(HN, "ENVIO-SIMULADO.md")).toContain(
      `- vencido: ${TEXTO_SOPORTE.nombre("parafiscales")} (2026-08-31)`,
    );
  });
});

describe("cobertura de la tabla de nombres sobre los fixtures (GC-2)", () => {
  test("cada tipo de index.json y de soportes-exigidos.json tiene un nombre propio distinto del id", async () => {
    const tipos = [...(await tiposDeFixtures())];
    expect(tipos.length).toBeGreaterThan(0);
    for (const tipo of tipos) {
      expect(Object.hasOwn(NOMBRE_SOPORTE, tipo)).toBe(true);
      const nombre = TEXTO_SOPORTE.nombre(tipo);
      expect(nombre.trim().length).toBeGreaterThan(0);
      expect(nombre).not.toBe(tipo);
    }
  });
});

describe("los datos de herramienta y la bitácora conservan los ids crudos (contrato v1, D-21)", () => {
  for (const caso of CASOS) {
    test(`${caso}: armar_paquete y simular_envio devuelven los bloqueos con ids crudos`, () => {
      const { paquete, envio } = corridaDe(caso);
      expect(paquete.data?.bloqueos).toEqual([...(BLOQUEOS_CRUDOS[caso] ?? [])]);
      expect(envio.data?.bloqueos).toEqual([...(BLOQUEOS_CRUDOS[caso] ?? [])]);
    });

    test(`${caso}: checklist.soportes[].tipo de armar_paquete son los ids exigidos`, async () => {
      const tipos = corridaDe(caso).paquete.data?.checklist?.soportes.map(({ tipo }) => tipo) ?? [];
      expect([...tipos].sort()).toEqual([...(await exigidosDe(caso))].sort());
    });
  }

  test("los resúmenes de ec y hn en log.jsonl conservan los ids crudos", async () => {
    for (const caso of [EC, HN]) {
      const [bloqueo = ""] = BLOQUEOS_CRUDOS[caso] ?? [];
      const resumenes = await resumenesDeBitacora(caso);
      expect(resumenes).toContain(`${caso}: BLOQUEADO (${bloqueo})`);
      expect(resumenes).toContain(`${caso}: envío simulado registrado con bloqueos (${bloqueo})`);
      expect(corridaDe(caso).envio.resumen).toBe(
        `${caso}: envío simulado registrado con bloqueos (${bloqueo})`,
      );
    }
  });
});
