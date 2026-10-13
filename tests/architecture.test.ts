import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, posix } from "node:path";

const RAIZ = join(import.meta.dir, "..");

const IMPORTACION =
  /(?:^|\n)\s*(?:import|export)\s+(?:type\s+)?(?:[^"';]*?\sfrom\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

const API_SHELL = /child_process|\bBun\s*\.\s*(?:spawn|\$)|\bBun\s*\[\s*["'`](?:spawn|\$)/;

const PAQUETES_CON_CAPA = new Set(["zod", "exceljs", "pdf-lib"]);

const DESTINOS_DE_HERRAMIENTAS = ["domain", "application", "config", "tools", "proveedor", "wiring", "zod"];

const PERMITIDOS: Readonly<Record<string, readonly string[]>> = {
  domain: ["domain"],
  application: ["domain", "application"],
  infra: ["domain", "application", "config", "infra", "node", "zod", "exceljs", "pdf-lib"],
  config: ["config", "zod"],
  tools: DESTINOS_DE_HERRAMIENTAS,
  proveedor: DESTINOS_DE_HERRAMIENTAS,
  wiring: [...DESTINOS_DE_HERRAMIENTAS, "infra"],
  demo: ["demo", "proveedor", "config", "node"],
  "raiz-demo": ["demo", "proveedor", "config", "node"],
};

const HERRAMIENTAS_PRD: readonly string[] = [
  "leer_solicitud",
  "mapear_campos",
  "generar_formulario",
  "armar_paquete",
  "simular_envio",
];

const CAPAS_FUTURAS = /^src\/(?:server[^/]*|http|loop|llm)(?:\/|$)/;

function sinExtension(ruta: string): string {
  return ruta.replace(/\.(?:ts|js)$/, "");
}

function capaDeRuta(ruta: string): string {
  const base = sinExtension(ruta);
  if (base === "demo") return "raiz-demo";
  if (base === "src/tools/wiring") return "wiring";
  if (base === "src/tools/proveedor") return "proveedor";
  if (CAPAS_FUTURAS.test(base)) return "prohibida";
  const capa = /^src\/(domain|application|infra|config|tools|demo)\//.exec(base)?.[1];
  return capa ?? "desconocida";
}

function nombreDePaquete(especificador: string): string {
  const partes = especificador.split("/");
  return especificador.startsWith("@") ? partes.slice(0, 2).join("/") : (partes[0] ?? especificador);
}

function capaDeDestino(origen: string, especificador: string): string {
  if (especificador.startsWith(".")) {
    return capaDeRuta(posix.normalize(posix.join(posix.dirname(origen), especificador)));
  }
  if (especificador.startsWith("node:")) return "node";
  const paquete = nombreDePaquete(especificador);
  return PAQUETES_CON_CAPA.has(paquete) ? paquete : `paquete:${paquete}`;
}

function extraerImportaciones(codigo: string): string[] {
  const especificadores: string[] = [];
  for (const coincidencia of codigo.matchAll(IMPORTACION)) {
    const especificador = coincidencia[1] ?? coincidencia[2];
    if (especificador !== undefined) especificadores.push(especificador);
  }
  return especificadores;
}

function violacionesDeCapas(ruta: string, codigo: string): string[] {
  const origen = capaDeRuta(ruta);
  const permitidos = PERMITIDOS[origen];
  if (permitidos === undefined) return [`${ruta}: pertenece a una capa no declarada (${origen})`];
  return extraerImportaciones(codigo)
    .filter((especificador) => !permitidos.includes(capaDeDestino(ruta, especificador)))
    .map((especificador) => `${ruta}: la capa ${origen} no puede importar ${especificador}`);
}

function violacionesDeShell(ruta: string, codigo: string): string[] {
  return codigo
    .split("\n")
    .flatMap((linea, indice) =>
      API_SHELL.test(linea) ? [`${ruta}:${indice + 1}: usa una API de shell`] : [],
    );
}

function listarFuentes(): string[] {
  const rutas = existsSync(join(RAIZ, "src")) ? [...new Bun.Glob("src/**/*.ts").scanSync({ cwd: RAIZ })] : [];
  if (existsSync(join(RAIZ, "demo.ts"))) rutas.push("demo.ts");
  return rutas.map((ruta) => ruta.split("\\").join("/")).sort();
}

function esUnaOracion(texto: string): boolean {
  return (
    texto.trim() === texto &&
    /^[A-ZÁÉÍÓÚÑ¿¡]/.test(texto) &&
    texto.endsWith(".") &&
    !/[.!?:;]\s/.test(texto) &&
    !texto.includes("\n")
  );
}

function descripcionDe(valor: unknown): unknown {
  return typeof valor === "object" && valor !== null && "description" in valor
    ? valor.description
    : undefined;
}

function violacionesDeHerramientas(modulo: Readonly<Record<string, unknown>>): string[] {
  return Object.entries(modulo).flatMap(([nombre, valor]) => {
    if (!HERRAMIENTAS_PRD.includes(nombre)) return [`${nombre}: no es una de las cinco herramientas del PRD`];
    const descripcion = descripcionDe(valor);
    if (typeof descripcion !== "string" || !esUnaOracion(descripcion)) {
      return [`${nombre}: la descripción no es exactamente una oración`];
    }
    return [];
  });
}

function contratoIncompleto(nombre: string, valor: unknown): string[] {
  if (typeof valor !== "object" || valor === null) return [`${nombre}: no es un objeto`];
  const descripcion = "description" in valor ? valor.description : undefined;
  const args = "args" in valor ? valor.args : undefined;
  const execute = "execute" in valor ? valor.execute : undefined;
  return [
    ...(typeof descripcion === "string" && esUnaOracion(descripcion) ? [] : [`${nombre}: description`]),
    ...(typeof args === "object" && args !== null ? [] : [`${nombre}: args`]),
    ...(typeof execute === "function" ? [] : [`${nombre}: execute`]),
  ];
}

function leer(ruta: string): string {
  return readFileSync(join(RAIZ, ruta), "utf8");
}

type Grafo = ReadonlyMap<string, readonly string[]>;

function dependenciasLocales(ruta: string, codigo: string): string[] {
  return extraerImportaciones(codigo)
    .filter((especificador) => especificador.startsWith("."))
    .map((especificador) => posix.normalize(posix.join(posix.dirname(ruta), especificador)));
}

function grafoDeFuentes(): Grafo {
  return new Map(listarFuentes().map((ruta) => [ruta, dependenciasLocales(ruta, leer(ruta))]));
}

function ciclosDe(grafo: Grafo): string[] {
  const ciclos: string[] = [];
  const visitados = new Set<string>();
  const enCurso: string[] = [];
  const visitar = (nodo: string): void => {
    const posicion = enCurso.indexOf(nodo);
    if (posicion >= 0) {
      ciclos.push([...enCurso.slice(posicion), nodo].join(" -> "));
      return;
    }
    if (visitados.has(nodo)) return;
    enCurso.push(nodo);
    for (const vecino of grafo.get(nodo) ?? []) visitar(vecino);
    enCurso.pop();
    visitados.add(nodo);
  };
  for (const nodo of grafo.keys()) visitar(nodo);
  return ciclos;
}

describe("reglas de capas sobre el código real", () => {
  test("ninguna importación sale de su capa", () => {
    const violaciones = listarFuentes().flatMap((ruta) => violacionesDeCapas(ruta, leer(ruta)));
    expect(violaciones).toEqual([]);
  });

  test("no hay ciclos de importación, ni siquiera de solo tipos (IN-10)", () => {
    expect(ciclosDe(grafoDeFuentes())).toEqual([]);
  });

  test("el detector de ciclos muerde sobre un grafo de muestra", () => {
    const grafo = new Map([
      ["a.ts", ["b.ts"]],
      ["b.ts", ["a.ts"]],
      ["c.ts", ["a.ts"]],
    ]);
    expect(ciclosDe(grafo)).toEqual(["a.ts -> b.ts -> a.ts"]);
  });

  test("src/ y demo.ts no usan APIs de shell", () => {
    const violaciones = listarFuentes().flatMap((ruta) => violacionesDeShell(ruta, leer(ruta)));
    expect(violaciones).toEqual([]);
  });
});

describe("superficie pública de herramientas (CAL-04)", () => {
  test("proveedor.ts solo exporta nombres del PRD con descripción de una oración", async () => {
    const modulo = Object.fromEntries(Object.entries(await import("../src/tools/proveedor.ts")));
    expect(Object.keys(modulo).length).toBeGreaterThan(0);
    expect(violacionesDeHerramientas(modulo)).toEqual([]);
  });

  test("proveedor.ts exporta exactamente las cinco herramientas con description, args y execute (HERR-01)", async () => {
    const modulo = Object.fromEntries(Object.entries(await import("../src/tools/proveedor.ts")));
    expect(Object.keys(modulo).sort()).toEqual([...HERRAMIENTAS_PRD].sort());
    expect(Object.keys(modulo).sort()).toEqual([
      "armar_paquete",
      "generar_formulario",
      "leer_solicitud",
      "mapear_campos",
      "simular_envio",
    ]);
    expect(Object.entries(modulo).flatMap(([nombre, valor]) => contratoIncompleto(nombre, valor))).toEqual(
      [],
    );
  });

  test("la regla de capas de src/demo se aplica a archivos reales", () => {
    const fuentes = listarFuentes();
    expect(fuentes).toContain("src/demo/ejecutar-demo.ts");
    expect(fuentes).toContain("demo.ts");
    for (const ruta of ["src/demo/ejecutar-demo.ts", "demo.ts"]) {
      expect(violacionesDeCapas(ruta, leer(ruta))).toEqual([]);
    }
  });

  test("el guardián muerde con un nombre ajeno y una descripción de dos oraciones", () => {
    const modulo = {
      leer_solicitud: { description: "Lee la solicitud. Luego la resume." },
      listar_casos: { description: "Lista los casos." },
      mapear_campos: { description: "Mapea campos sin punto final" },
    };
    expect(violacionesDeHerramientas(modulo)).toEqual([
      "leer_solicitud: la descripción no es exactamente una oración",
      "listar_casos: no es una de las cinco herramientas del PRD",
      "mapear_campos: la descripción no es exactamente una oración",
    ]);
  });
});

describe("el escáner muerde sobre fuentes de muestra", () => {
  test("reporta import type desde infra dentro de domain", () => {
    const codigo = 'import type { Lector } from "../infra/lector";\nexport const a = 1;\n';
    expect(violacionesDeCapas("src/domain/a.ts", codigo)).toEqual([
      "src/domain/a.ts: la capa domain no puede importar ../infra/lector",
    ]);
  });

  test("reporta export type desde un módulo exterior", () => {
    const codigo = 'export type { Puerto } from "../application/puertos";\n';
    expect(violacionesDeCapas("src/domain/b.ts", codigo)).toEqual([
      "src/domain/b.ts: la capa domain no puede importar ../application/puertos",
    ]);
  });

  test("reporta la importación de efecto de node:fs dentro de domain", () => {
    expect(violacionesDeCapas("src/domain/c.ts", 'import "node:fs";\n')).toEqual([
      "src/domain/c.ts: la capa domain no puede importar node:fs",
    ]);
  });

  test("reporta una importación multilínea y una dinámica hacia capas futuras", () => {
    const codigo =
      'import {\n  servidor,\n} from "../server";\nconst llm = await import("../llm/adaptador");\n';
    expect(violacionesDeCapas("src/application/d.ts", codigo)).toEqual([
      "src/application/d.ts: la capa application no puede importar ../server",
      "src/application/d.ts: la capa application no puede importar ../llm/adaptador",
    ]);
  });

  test("reporta una referencia a Bun.spawn", () => {
    expect(violacionesDeShell("src/infra/e.ts", 'const p = Bun.spawn(["ls"]);\n')).toEqual([
      "src/infra/e.ts:1: usa una API de shell",
    ]);
  });

  test("reporta child_process y Bun.$", () => {
    const codigo = 'import { exec } from "node:child_process";\nawait Bun.$`ls`;\n';
    expect(violacionesDeShell("demo.ts", codigo)).toEqual([
      "demo.ts:1: usa una API de shell",
      "demo.ts:2: usa una API de shell",
    ]);
  });

  test("deja pasar una importación de domain a domain", () => {
    const codigo = 'import { normalizar } from "./normalizar";\nimport type { Campo } from "./tipos.ts";\n';
    expect(violacionesDeCapas("src/domain/mapeo.ts", codigo)).toEqual([]);
  });

  test("solo wiring.ts puede importar infra desde tools", () => {
    const codigo = 'import { crearLector } from "../infra/fixtures/lector";\n';
    expect(violacionesDeCapas("src/tools/wiring.ts", codigo)).toEqual([]);
    expect(violacionesDeCapas("src/tools/define-tool.ts", codigo)).toEqual([
      "src/tools/define-tool.ts: la capa tools no puede importar ../infra/fixtures/lector",
    ]);
  });

  test("src/demo solo llega a la herramienta exportada, config y node:", () => {
    const permitido =
      'import { leer_solicitud } from "../tools/proveedor.ts";\nimport { join } from "node:path";\n';
    const prohibido = 'import { crearEntorno } from "../tools/wiring";\n';
    expect(violacionesDeCapas("src/demo/ejecutar-demo.ts", permitido)).toEqual([]);
    expect(violacionesDeCapas("src/demo/ejecutar-demo.ts", prohibido)).toEqual([
      "src/demo/ejecutar-demo.ts: la capa demo no puede importar ../tools/wiring",
    ]);
  });

  test("reporta un archivo en una capa no declarada", () => {
    expect(violacionesDeCapas("src/varios/x.ts", "export const x = 1;\n")).toEqual([
      "src/varios/x.ts: pertenece a una capa no declarada (desconocida)",
    ]);
  });
});
