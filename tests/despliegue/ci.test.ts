import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const RAIZ = join(import.meta.dir, "..", "..");

const RUTA_FLUJO = ".github/workflows/ci.yml";

const ARCHIVO_VERSION_BUN = ".bun-version";

const ACCION_CHECKOUT = "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1";

const ACCION_SETUP_BUN = "oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6";

const ACCION_FIJADA_POR_SHA = /^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/;

const RUNNER = "ubuntu-24.04";

const RAMA_PRINCIPAL = "main";

const INSTALACION = "bun install --frozen-lockfile";

const COMANDOS_DE_VERIFICACION = [
  INSTALACION,
  "bun run check",
  "bun test",
  "bun run demo.ts",
  "bun run build:web",
];

const COMANDO_DE_AUDITORIA = "bun run audit";

const SCRIPT_DE_AUDITORIA = "bun audit --audit-level=moderate";

const PASOS_DEL_CHECK = ["tsc --noEmit", "tsc --noEmit -p web/tsconfig.json", "biome check ."];

const ANOTACION_DE_AVISO = "::warning";

const TEXTOS_DEL_MODELO_EN_VIVO = ["LLM_EN_VIVO", "COSTO_EN_VIVO", "test:vivo", "bun run costo"];

const CONTEXTO_DE_SECRETOS = "secrets";

const paso = z.object({
  name: z.string().optional(),
  id: z.string().optional(),
  if: z.string().optional(),
  uses: z.string().optional(),
  with: z.record(z.string(), z.string()).optional(),
  run: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
  "continue-on-error": z.boolean().optional(),
});

const trabajo = z.object({
  name: z.string(),
  "runs-on": z.string(),
  "timeout-minutes": z.number(),
  container: z.unknown().optional(),
  "continue-on-error": z.unknown().optional(),
  steps: z.array(paso),
});

const disparador = z.object({
  branches: z.array(z.string()).optional(),
  paths: z.unknown().optional(),
  "paths-ignore": z.unknown().optional(),
});

const flujoCi = z.object({
  name: z.string(),
  on: z.object({
    push: disparador,
    pull_request: disparador.nullable(),
    workflow_dispatch: z.null(),
  }),
  permissions: z.record(z.string(), z.string()),
  concurrency: z.object({ group: z.string(), "cancel-in-progress": z.boolean() }),
  jobs: z.object({ verificar: trabajo, auditoria: trabajo }),
});

type FlujoCi = z.output<typeof flujoCi>;

type Paso = z.output<typeof paso>;

function leer(relativa: string): string {
  const ruta = join(RAIZ, relativa);
  return existsSync(ruta) ? readFileSync(ruta, "utf8") : "";
}

function flujo(): FlujoCi {
  const leido = flujoCi.safeParse(Bun.YAML.parse(leer(RUTA_FLUJO)));
  if (!leido.success) throw new Error(`${RUTA_FLUJO} falta o no cumple la estructura esperada`);
  return leido.data;
}

function accionOComando(pasoDelTrabajo: Paso): string {
  return pasoDelTrabajo.uses ?? pasoDelTrabajo.run ?? "";
}

function scripts(): Record<string, string> {
  return z.object({ scripts: z.record(z.string(), z.string()) }).parse(JSON.parse(leer("package.json")))
    .scripts;
}

describe(".github/workflows/ci.yml (DEMO-05, D-90)", () => {
  test("corre en cada push a main, en cada pull request y a mano, sin filtros de rutas", () => {
    const { on } = flujo();
    expect(on.push.branches).toEqual([RAMA_PRINCIPAL]);
    for (const evento of [on.push, on.pull_request]) {
      expect(evento?.paths).toBeUndefined();
      expect(evento?.["paths-ignore"]).toBeUndefined();
    }
    expect(on.workflow_dispatch).toBeNull();
  });

  test("solo pide permiso de lectura del contenido y cancela la corrida anterior de la misma rama", () => {
    const { permissions, concurrency } = flujo();
    expect(permissions).toEqual({ contents: "read" });
    expect(concurrency["cancel-in-progress"]).toBe(true);
  });

  test("los dos trabajos corren en el runner hospedado de GitHub, sin contenedor y sin continue-on-error de trabajo", () => {
    for (const trabajoDelFlujo of Object.values(flujo().jobs)) {
      expect(trabajoDelFlujo["runs-on"]).toBe(RUNNER);
      expect(trabajoDelFlujo.container).toBeUndefined();
      expect(trabajoDelFlujo["continue-on-error"]).toBeUndefined();
    }
  });

  test("verificar instala con Bun de .bun-version y corre check, test, demo y build en ese orden", () => {
    const { steps } = flujo().jobs.verificar;
    expect(steps.map(accionOComando)).toEqual([
      ACCION_CHECKOUT,
      ACCION_SETUP_BUN,
      ...COMANDOS_DE_VERIFICACION,
    ]);
    expect(steps[1]?.with).toEqual({ "bun-version-file": ARCHIVO_VERSION_BUN });
  });

  test("verificar no corre la auditoría de dependencias", () => {
    expect(JSON.stringify(flujo().jobs.verificar.steps)).not.toContain("audit");
  });

  test("auditoria corre bun run audit con continue-on-error en el paso y avisa con una anotación si falla", () => {
    const { steps } = flujo().jobs.auditoria;
    expect(steps.map(accionOComando).slice(0, 4)).toEqual([
      ACCION_CHECKOUT,
      ACCION_SETUP_BUN,
      INSTALACION,
      COMANDO_DE_AUDITORIA,
    ]);
    expect(steps[1]?.with).toEqual({ "bun-version-file": ARCHIVO_VERSION_BUN });
    const auditoria = steps[3];
    const aviso = steps[4];
    expect(auditoria?.["continue-on-error"]).toBe(true);
    expect(auditoria?.id).toBeDefined();
    expect(aviso?.if).toBe(`steps.${auditoria?.id}.outcome == 'failure'`);
    expect(aviso?.run).toContain(ANOTACION_DE_AVISO);
  });

  test("cada acción de terceros está fijada por el SHA completo de su commit", () => {
    const acciones = Object.values(flujo().jobs).flatMap((t) => t.steps.flatMap((p) => p.uses ?? []));
    expect(acciones.length).toBeGreaterThan(0);
    for (const accion of acciones) expect(accion).toMatch(ACCION_FIJADA_POR_SHA);
  });

  test("no lleva comentarios", () => {
    expect(
      leer(RUTA_FLUJO)
        .split("\n")
        .filter((linea) => linea.trim().startsWith("#")),
    ).toEqual([]);
  });

  test("no usa secretos ni corre el modelo en vivo, así que un push nunca gasta la clave", () => {
    const texto = leer(RUTA_FLUJO);
    expect(texto).not.toBe("");
    expect(texto).not.toContain(CONTEXTO_DE_SECRETOS);
    for (const vivo of TEXTOS_DEL_MODELO_EN_VIVO) expect(texto).not.toContain(vivo);
  });
});

describe("scripts de package.json para la CI (D-90)", () => {
  test("check corre tsc de la api y del front y Biome, sin la auditoría", () => {
    const { check = "" } = scripts();
    for (const pasoDelCheck of PASOS_DEL_CHECK) expect(check).toContain(pasoDelCheck);
    expect(check).not.toContain("audit");
  });

  test("audit queda como script propio con el nivel moderado", () => {
    expect(scripts().audit).toBe(SCRIPT_DE_AUDITORIA);
  });

  test(".bun-version fija la misma versión de Bun que engines de package.json", () => {
    const { engines } = z
      .object({ engines: z.object({ bun: z.string() }) })
      .parse(JSON.parse(leer("package.json")));
    expect(leer(ARCHIVO_VERSION_BUN).trim()).toBe(engines.bun);
  });
});
