import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { ENTORNO_APP, RUTA_API, SALTOS_PROXY_RENDER } from "@/config/constants/http.constants.ts";
import { NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import { ZONA_HORARIA_POR_DEFECTO } from "@/config/constants/runtime.constants.ts";

const RAIZ = join(import.meta.dir, "..", "..");

const IMAGEN_BUN = "oven/bun:1.4.3-slim";

const PUERTO_RENDER = "10000";

const SECRETOS_DEL_PANEL = ["LLM_API_KEY", "ACCESS_CODE"];

const SECRETO_GENERADO = "ACCESS_TOKEN_SECRET";

const COPIAS_DE_EJECUCION = ["tsconfig.json", "src", "agent", "reto-01/fixtures"];

const DIRECTORIOS_DEL_BUILD_WEB = ["config/", "http/types/"];

const EXCLUSIONES_DOCKER = [
  "node_modules/",
  "out/",
  ".env",
  ".env.*",
  "!.env.example",
  ".git",
  ".planning",
  "tests",
  ".qa",
  ".codegraph",
  ".gsd",
  ".claude",
  ".agents",
  "web/node_modules",
];

type Instruccion = { readonly comando: string; readonly argumentos: string };

type Etapa = {
  readonly imagen: string;
  readonly alias: string | null;
  readonly instrucciones: Instruccion[];
};

const variableRender = z
  .object({
    key: z.string(),
    value: z.string().optional(),
    sync: z.boolean().optional(),
    generateValue: z.boolean().optional(),
  })
  .strict();

const servicioRender = z.object({
  type: z.string(),
  name: z.string(),
  runtime: z.string(),
  plan: z.string(),
  dockerfilePath: z.string(),
  healthCheckPath: z.string(),
  autoDeploy: z.boolean(),
  envVars: z.array(variableRender),
});

const blueprintRender = z.object({ services: z.array(servicioRender) });

function leer(relativa: string): string {
  const ruta = join(RAIZ, relativa);
  return existsSync(ruta) ? readFileSync(ruta, "utf8") : "";
}

function instruccionesDocker(texto: string): Instruccion[] {
  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea !== "")
    .map((linea) => {
      const espacio = linea.indexOf(" ");
      return {
        comando: (espacio === -1 ? linea : linea.slice(0, espacio)).toUpperCase(),
        argumentos: espacio === -1 ? "" : linea.slice(espacio + 1).trim(),
      };
    });
}

function etapasDocker(instrucciones: readonly Instruccion[]): Etapa[] {
  const etapas: Etapa[] = [];
  for (const instruccion of instrucciones) {
    if (instruccion.comando === "FROM") {
      const [imagen = "", , alias = null] = instruccion.argumentos.split(/\s+/);
      etapas.push({ imagen, alias, instrucciones: [] });
    } else {
      etapas.at(-1)?.instrucciones.push(instruccion);
    }
  }
  return etapas;
}

function argumentosDe(etapa: Etapa, comando: string): string[] {
  return etapa.instrucciones
    .filter((instruccion) => instruccion.comando === comando)
    .map((i) => i.argumentos);
}

function origenesCopiados(etapa: Etapa): string[] {
  return argumentosDe(etapa, "COPY")
    .filter((argumentos) => !argumentos.startsWith("--from"))
    .flatMap((argumentos) => argumentos.split(/\s+/).slice(0, -1));
}

function blueprint(): z.output<typeof blueprintRender> {
  const leido = blueprintRender.safeParse(Bun.YAML.parse(leer("render.yaml")));
  return leido.success ? leido.data : { services: [] };
}

function nombresDeEnvExample(): string[] {
  return leer(".env.example")
    .split("\n")
    .filter((linea) => linea.trim() !== "")
    .map((linea) => linea.split("=")[0] ?? "");
}

function importacionesDeValor(codigo: string): string[] {
  const importaciones = codigo.matchAll(/import\s+(type\s+)?[^;]*?from\s+"@\/([^"]+)"/g);
  return [...importaciones].filter((coincidencia) => coincidencia[1] === undefined).map((c) => c[2] ?? "");
}

function alcanceDesdeWeb(): string[] {
  const fuentesWeb = [...new Bun.Glob("web/src/**/*.{ts,tsx}").scanSync({ cwd: RAIZ }), "web/vite.config.ts"];
  const pendientes = fuentesWeb.flatMap((ruta) => importacionesDeValor(leer(ruta)));
  const visitados = new Set<string>();
  while (pendientes.length > 0) {
    const relativa = pendientes.pop() ?? "";
    if (visitados.has(relativa)) continue;
    visitados.add(relativa);
    pendientes.push(...importacionesDeValor(leer(join("src", relativa))));
  }
  return [...visitados].sort();
}

describe("Dockerfile (DEP-02)", () => {
  const instrucciones = instruccionesDocker(leer("Dockerfile"));
  const [build, ejecucion] = etapasDocker(instrucciones);

  test("tiene dos etapas, las dos sobre oven/bun:1.4.3-slim, y la primera se llama build", () => {
    expect(etapasDocker(instrucciones).map((etapa) => etapa.imagen)).toEqual([IMAGEN_BUN, IMAGEN_BUN]);
    expect(build?.alias).toBe("build");
  });

  test("no lleva comentarios", () => {
    expect(
      leer("Dockerfile")
        .split("\n")
        .filter((linea) => linea.trim().startsWith("#")),
    ).toEqual([]);
  });

  test("la etapa build instala con el lockfile congelado y construye la SPA con el script build:web", () => {
    if (build === undefined) throw new Error("falta la etapa build");
    const paquete = z
      .object({ scripts: z.record(z.string(), z.string()) })
      .parse(JSON.parse(leer("package.json")));
    expect(paquete.scripts["build:web"]).toBeDefined();
    expect(argumentosDe(build, "RUN")).toEqual(["bun install --frozen-lockfile", "bun run build:web"]);
    expect(origenesCopiados(build)).toEqual([
      "package.json",
      "bun.lock",
      "tsconfig.json",
      "web",
      "src/config",
      "src/http/types",
    ]);
  });

  test("todo lo que la SPA importa como valor desde src/ está dentro de lo que copia la etapa build", () => {
    const alcance = alcanceDesdeWeb();
    expect(alcance.length).toBeGreaterThan(0);
    expect(alcance.filter((ruta) => !DIRECTORIOS_DEL_BUILD_WEB.some((dir) => ruta.startsWith(dir)))).toEqual(
      [],
    );
  });

  test("la etapa de ejecución instala solo dependencias de producción con el lockfile congelado", () => {
    if (ejecucion === undefined) throw new Error("falta la etapa de ejecución");
    expect(argumentosDe(ejecucion, "RUN")).toContain("bun install --frozen-lockfile --production");
    expect(argumentosDe(ejecucion, "ENV")).toEqual([`NODE_ENV=${ENTORNO_APP.PRODUCCION}`]);
  });

  test("copia el código, el prompt, los fixtures (sin el PRD) y la SPA construida", () => {
    if (ejecucion === undefined) throw new Error("falta la etapa de ejecución");
    const copiados = origenesCopiados(ejecucion);
    for (const origen of COPIAS_DE_EJECUCION) expect(copiados).toContain(origen);
    expect(copiados.filter((origen) => origen === "reto-01" || origen.startsWith("reto-01/PRD"))).toEqual([]);
    expect(argumentosDe(ejecucion, "COPY")).toContain("--from=build /app/web/dist ./web/dist");
    for (const origen of copiados) expect(existsSync(join(RAIZ, origen))).toBe(true);
  });

  test("solo out/ queda del usuario bun y el proceso corre como bun en el puerto de Render", () => {
    if (ejecucion === undefined) throw new Error("falta la etapa de ejecución");
    const ejecuciones = argumentosDe(ejecucion, "RUN");
    expect(ejecuciones).toContain("mkdir -p out && chown bun:bun out");
    expect(ejecuciones.filter((argumentos) => argumentos.includes("chown -R"))).toEqual([]);
    expect(ejecuciones.filter((argumentos) => argumentos.includes("/app"))).toEqual([]);
    expect(ejecucion.instrucciones.slice(-3)).toEqual([
      { comando: "USER", argumentos: "bun" },
      { comando: "EXPOSE", argumentos: PUERTO_RENDER },
      { comando: "CMD", argumentos: '["bun", "src/server.ts"]' },
    ]);
  });
});

describe("render.yaml (DEP-02)", () => {
  const { services } = blueprint();
  const [servicio] = services;
  const variables = new Map(servicio?.envVars.map((variable) => [variable.key, variable]));

  test("declara un único servicio web gratuito con Docker y health en /api/health", () => {
    expect(services).toHaveLength(1);
    expect(servicio).toMatchObject({
      type: "web",
      name: "registro-proveedor",
      runtime: "docker",
      plan: "free",
      dockerfilePath: "./Dockerfile",
      healthCheckPath: RUTA_API.SALUD,
      autoDeploy: true,
    });
  });

  test("fija la fecha de ejecución, la zona, el entorno, el nivel de log y los saltos del proxy", () => {
    expect(
      Object.fromEntries(
        [...variables].filter(([, v]) => v.value !== undefined).map(([k, v]) => [k, v.value]),
      ),
    ).toEqual({
      NODE_ENV: ENTORNO_APP.PRODUCCION,
      FECHA_EJECUCION: FECHA_DEMO,
      TZ_NEGOCIO: ZONA_HORARIA_POR_DEFECTO,
      LOG_LEVEL: NIVELES_LOG.INFO,
      TRUSTED_PROXY_HOPS: String(SALTOS_PROXY_RENDER),
    });
  });

  test("la clave del LLM y el código se cargan en el panel y el secreto HMAC lo genera Render, sin valor escrito", () => {
    for (const nombre of SECRETOS_DEL_PANEL)
      expect(variables.get(nombre)).toEqual({ key: nombre, sync: false });
    expect(variables.get(SECRETO_GENERADO)).toEqual({ key: SECRETO_GENERADO, generateValue: true });
  });

  test("cada variable de render.yaml la lee config/env.ts y está en .env.example", () => {
    const documentadas = new Set(nombresDeEnvExample());
    const fuenteEnv = leer("src/config/env.ts");
    for (const nombre of variables.keys()) {
      expect(documentadas.has(nombre)).toBe(true);
      expect(fuenteEnv).toContain(`${nombre}:`);
    }
  });
});

describe(".dockerignore (DEP-02, SEG-01)", () => {
  const entradas = leer(".dockerignore")
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => linea !== "");

  test("excluye dependencias, salidas, secretos y carpetas de trabajo, y conserva .env.example", () => {
    for (const exclusion of EXCLUSIONES_DOCKER) expect(entradas).toContain(exclusion);
  });

  test("no excluye nada de lo que copia el Dockerfile", () => {
    const copiados = ["package.json", "bun.lock", "web", ...COPIAS_DE_EJECUCION];
    expect(entradas.filter((entrada) => copiados.includes(entrada.replace(/\/$/, "")))).toEqual([]);
  });
});
