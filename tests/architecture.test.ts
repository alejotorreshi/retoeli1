import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, posix } from "node:path";
import { CODIGO_ERROR, CODIGO_FS } from "@/config/constants/errors.constants.ts";
import { ARCHIVOS_PAQUETE, ARCHIVOS_SALIDA } from "@/config/constants/files.constants.ts";
import { FORMATO, TIPO_PLANTILLA } from "@/config/constants/forms.constants.ts";
import { ESTADO_LECTURA, ORIGEN_COPIA } from "@/config/constants/io.constants.ts";
import { CLAVE_PLANTILLA } from "@/config/constants/knowledge.constants.ts";
import {
  APLICA_NOTA,
  ESTADO_CAMPO,
  REGLA_MAPEO,
  TIPO_HOJA_MAESTRO,
  VARIABLE_NOTA,
} from "@/config/constants/mapping.constants.ts";
import { COLOR_TRAZO } from "@/config/constants/pdf.constants.ts";
import { TIPO_MASCARA } from "@/config/constants/pii.constants.ts";
import { ESTADO_SOPORTE, ESTADO_VIGENCIA } from "@/config/constants/supports.constants.ts";
import { HERRAMIENTA } from "@/config/constants/tools.constants.ts";

const RAIZ = join(import.meta.dir, "..");

const IMPORTACION =
  /(?:^|\n)\s*(?:import|export)\s+(?:type\s+)?(?:[^"';]*?\sfrom\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

const API_SHELL = /child_process|\bBun\s*\.\s*(?:spawn|\$)|\bBun\s*\[\s*["'`](?:spawn|\$)/;

const PAQUETES_CON_CAPA = new Set(["zod", "exceljs", "pdf-lib"]);

const DESTINOS_DE_HERRAMIENTAS = [
  "domain",
  "application",
  "config-pure",
  "config-env",
  "tools",
  "proveedor",
  "wiring",
  "zod",
];

const DESTINOS_DE_DEMO = ["demo", "proveedor", "config-pure", "config-env", "node"];

const PERMITIDOS: Readonly<Record<string, readonly string[]>> = {
  domain: ["domain", "config-pure"],
  application: ["domain", "application", "config-pure"],
  "config-pure": ["config-pure"],
  "config-env": ["config-env", "config-pure", "domain", "zod"],
  infra: ["domain", "application", "config-pure", "config-env", "infra", "node", "zod", "exceljs", "pdf-lib"],
  tools: DESTINOS_DE_HERRAMIENTAS,
  proveedor: DESTINOS_DE_HERRAMIENTAS,
  wiring: [...DESTINOS_DE_HERRAMIENTAS, "infra"],
  demo: DESTINOS_DE_DEMO,
  "raiz-demo": DESTINOS_DE_DEMO,
};

const CONFIG_PURA = /^src\/config\/(?:constants\/.+|types\/.+|strings)$/;

const LECTURA_DE_ENTORNO = /\b(?:process|Bun)\s*\.\s*env\b/;

const IMPURO_EN_CONFIG = /\bprocess\s*\.\s*env\b|\bBun\s*\.|\bimport\s*\.\s*meta\b|["']node:|["']zod["']/;

const LECTORES_DE_ENTORNO: ReadonlySet<string> = new Set(["src/config/env.ts"]);

const HERRAMIENTAS_PRD: readonly string[] = [
  "leer_solicitud",
  "mapear_campos",
  "generar_formulario",
  "armar_paquete",
  "simular_envio",
];

const FAMILIAS_DE_CODIGOS: readonly Readonly<Record<string, string>>[] = [
  CODIGO_ERROR,
  CODIGO_FS,
  ESTADO_CAMPO,
  FORMATO,
  TIPO_PLANTILLA,
  ESTADO_SOPORTE,
  ESTADO_VIGENCIA,
  ESTADO_LECTURA,
  ORIGEN_COPIA,
  REGLA_MAPEO,
  TIPO_HOJA_MAESTRO,
  APLICA_NOTA,
  VARIABLE_NOTA,
  CLAVE_PLANTILLA,
  ARCHIVOS_SALIDA,
  ARCHIVOS_PAQUETE,
  TIPO_MASCARA,
  COLOR_TRAZO,
  HERRAMIENTA,
];

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const VALORES_DE_FAMILIA = [...new Set(FAMILIAS_DE_CODIGOS.flatMap((familia) => Object.values(familia)))]
  .map(escaparRegex)
  .join("|");

const LITERAL_DE_FAMILIA = new RegExp(
  [
    `(?:===|!==)\\s*["'](?:${VALORES_DE_FAMILIA})["']`,
    `["'](?:${VALORES_DE_FAMILIA})["']\\s*(?:===|!==)`,
    `\\bcase\\s+["'](?:${VALORES_DE_FAMILIA})["']`,
    `\\b(?:estado|tipo|regla|codigo|formato|aplica|color)\\s*:\\s*["'](?:${VALORES_DE_FAMILIA})["']`,
    "\\bfallo\\(\\s*[\"'`]",
  ].join("|"),
);

const ENUM_DE_TS = /\benum\s+[A-Z]/;

const LITERAL_DE_REGEX =
  /(?:^|[=(,:[!&|?{;]|\breturn|\btypeof)\s*\/(?![/*])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n[])+\/[dgimsuyv]*|\bnew\s+RegExp\s*\(/;

const DUENOS_DE_REGEX: ReadonlySet<string> = new Set([
  "src/config/constants/patterns.constants.ts",
  "src/domain/motor-plantillas.ts",
]);

const TEXTO_LEGIBLE = /[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}/;

const DUENOS_DE_TEXTO = /^src\/(?:config\/strings\.ts|knowledge\/)/;

const ANTES_DE_REGEX = new Set(["", "(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";"]);

const ARCHIVO_DE_TIPOS = /(?:^|\/)types\/[a-z0-9-]+\.type\.ts$/;

const EXPORTA_TIPO = /^export\s+(?:type|interface)\s|^export\s+(?:type\s+)?\{[^}]*\btype\b/;

const TIPOS_JUNTO_A_SU_ESQUEMA: ReadonlySet<string> = new Set(["src/config/env.ts"]);

const VALOR_EN_ARCHIVO_DE_TIPOS =
  /^export\s+(?:declare\s+)?(?:async\s+)?(?:const|let|var|function|class|default|enum)\b/;

const IMPORTA_VALOR = /^import\s+(?!type\b)/;

const CAPAS_FUTURAS = /^src\/(?:server[^/]*|http|loop|llm)(?:\/|$)/;

function sinExtension(ruta: string): string {
  return ruta.replace(/\.(?:ts|js)$/, "");
}

function capaDeRuta(ruta: string): string {
  const base = sinExtension(ruta);
  if (base === "demo") return "raiz-demo";
  if (base === "src/tools/entorno.wiring") return "wiring";
  if (base === "src/tools/proveedor") return "proveedor";
  if (base.startsWith("tests/")) return "tests";
  if (CONFIG_PURA.test(base)) return "config-pure";
  if (base === "src/config/env") return "config-env";
  if (CAPAS_FUTURAS.test(base)) return "prohibida";
  const capa = /^src\/(domain|application|infra|tools|demo)\//.exec(base)?.[1];
  return capa ?? "desconocida";
}

function nombreDePaquete(especificador: string): string {
  const partes = especificador.split("/");
  return especificador.startsWith("@") ? partes.slice(0, 2).join("/") : (partes[0] ?? especificador);
}

const ALIAS: readonly (readonly [string, string])[] = [
  ["@/", "src/"],
  ["@tests/", "tests/"],
];

function rutaLocal(origen: string, especificador: string): string | null {
  for (const [prefijo, carpeta] of ALIAS) {
    if (especificador.startsWith(prefijo))
      return posix.normalize(carpeta + especificador.slice(prefijo.length));
  }
  if (especificador.startsWith(".")) return posix.normalize(posix.join(posix.dirname(origen), especificador));
  return null;
}

function capaDeDestino(origen: string, especificador: string): string {
  const local = rutaLocal(origen, especificador);
  if (local !== null) return capaDeRuta(local);
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
  if (origen === "tests") return [];
  const permitidos = PERMITIDOS[origen];
  if (permitidos === undefined) return [`${ruta}: pertenece a una capa no declarada (${origen})`];
  return extraerImportaciones(codigo)
    .filter((especificador) => !permitidos.includes(capaDeDestino(ruta, especificador)))
    .map((especificador) => `${ruta}: la capa ${origen} no puede importar ${especificador}`);
}

function lineasQueCumplen(ruta: string, codigo: string, patron: RegExp, motivo: string): string[] {
  return codigo
    .split("\n")
    .flatMap((linea, indice) => (patron.test(linea) ? [`${ruta}:${indice + 1}: ${motivo}`] : []));
}

function violacionesDePureza(ruta: string, codigo: string): string[] {
  if (capaDeRuta(ruta) !== "config-pure") return [];
  return lineasQueCumplen(ruta, codigo, IMPURO_EN_CONFIG, "config pura con entorno, node, Bun o zod");
}

function violacionesDeLecturaDeEntorno(ruta: string, codigo: string): string[] {
  if (LECTORES_DE_ENTORNO.has(ruta)) return [];
  return lineasQueCumplen(ruta, codigo, LECTURA_DE_ENTORNO, "lee el entorno fuera de src/config/env.ts");
}

function violacionesDeLiteralesDeFamilia(ruta: string, codigo: string): string[] {
  if (ruta.startsWith("src/config/")) return [];
  return lineasQueCumplen(ruta, codigo, LITERAL_DE_FAMILIA, "compara o asigna un código con un literal");
}

function violacionesDeEnum(ruta: string, codigo: string): string[] {
  return lineasQueCumplen(ruta, codigo, ENUM_DE_TS, "declara un enum de TypeScript");
}

function violacionesDeRegex(ruta: string, codigo: string): string[] {
  if (DUENOS_DE_REGEX.has(ruta)) return [];
  return lineasQueCumplen(ruta, codigo, LITERAL_DE_REGEX, "declara una expresión regular fuera de patterns");
}

function finDeComillas(codigo: string, inicio: number): number {
  const comilla = codigo.charAt(inicio);
  let indice = inicio + 1;
  while (indice < codigo.length && codigo.charAt(indice) !== comilla && codigo.charAt(indice) !== "\n") {
    indice += codigo.charAt(indice) === "\\" ? 2 : 1;
  }
  return indice + 1;
}

function finDeExpresion(codigo: string, inicio: number): number {
  let profundidad = 1;
  let indice = inicio;
  while (indice < codigo.length && profundidad > 0) {
    const caracter = codigo.charAt(indice);
    if (caracter === '"' || caracter === "'" || caracter === "`") {
      indice = caracter === "`" ? finDePlantilla(codigo, indice) : finDeComillas(codigo, indice);
      continue;
    }
    if (caracter === "{") profundidad += 1;
    if (caracter === "}") profundidad -= 1;
    indice += 1;
  }
  return indice;
}

function finDePlantilla(codigo: string, inicio: number): number {
  let indice = inicio + 1;
  while (indice < codigo.length && codigo.charAt(indice) !== "`") {
    if (codigo.charAt(indice) === "\\") indice += 2;
    else if (codigo.startsWith("${", indice)) indice = finDeExpresion(codigo, indice + 2);
    else indice += 1;
  }
  return indice + 1;
}

function textoDePlantilla(cuerpo: string): string {
  let texto = "";
  let indice = 0;
  while (indice < cuerpo.length) {
    if (cuerpo.startsWith("${", indice)) {
      indice = finDeExpresion(cuerpo, indice + 2);
      texto += " ";
    } else {
      texto += cuerpo.charAt(indice);
      indice += 1;
    }
  }
  return texto;
}

function expresionesDePlantilla(cuerpo: string): string[] {
  const expresiones: string[] = [];
  let indice = 0;
  while (indice < cuerpo.length) {
    if (cuerpo.startsWith("${", indice)) {
      const fin = finDeExpresion(cuerpo, indice + 2);
      expresiones.push(cuerpo.slice(indice + 2, fin - 1));
      indice = fin;
    } else indice += 1;
  }
  return expresiones;
}

function empiezaRegex(codigo: string, posicion: number): boolean {
  let indice = posicion - 1;
  while (indice >= 0 && /\s/.test(codigo.charAt(indice))) indice -= 1;
  if (ANTES_DE_REGEX.has(indice < 0 ? "" : codigo.charAt(indice))) return true;
  return /\breturn$/.test(codigo.slice(Math.max(0, indice - 6), indice + 1));
}

function finDeRegex(codigo: string, inicio: number): number {
  let indice = inicio + 1;
  let enClase = false;
  while (indice < codigo.length && codigo.charAt(indice) !== "\n") {
    const caracter = codigo.charAt(indice);
    if (caracter === "\\") indice += 1;
    else if (caracter === "[") enClase = true;
    else if (caracter === "]") enClase = false;
    else if (caracter === "/" && !enClase) return indice + 1;
    indice += 1;
  }
  return indice;
}

function literalesDeTexto(codigo: string): string[] {
  const literales: string[] = [];
  let indice = 0;
  while (indice < codigo.length) {
    const caracter = codigo.charAt(indice);
    if (caracter === '"' || caracter === "'") {
      const fin = finDeComillas(codigo, indice);
      literales.push(codigo.slice(indice + 1, fin - 1));
      indice = fin;
    } else if (caracter === "`") {
      const fin = finDePlantilla(codigo, indice);
      const cuerpo = codigo.slice(indice + 1, fin - 1);
      literales.push(textoDePlantilla(cuerpo), ...expresionesDePlantilla(cuerpo).flatMap(literalesDeTexto));
      indice = fin;
    } else if (caracter === "/" && codigo.charAt(indice + 1) !== "/" && empiezaRegex(codigo, indice)) {
      indice = finDeRegex(codigo, indice);
    } else indice += 1;
  }
  return literales;
}

function violacionesDeTexto(ruta: string, codigo: string): string[] {
  if (DUENOS_DE_TEXTO.test(ruta)) return [];
  return literalesDeTexto(codigo)
    .filter((literal) => TEXTO_LEGIBLE.test(literal))
    .map((literal) => `${ruta}: texto legible fuera de strings.ts: ${literal}`);
}

function violacionesDeUbicacionDeTipos(ruta: string, codigo: string): string[] {
  if (ARCHIVO_DE_TIPOS.test(ruta) || TIPOS_JUNTO_A_SU_ESQUEMA.has(ruta)) return [];
  return lineasQueCumplen(ruta, codigo, EXPORTA_TIPO, "exporta un tipo fuera de types/*.type.ts");
}

function violacionesDeArchivoDeTipos(ruta: string, codigo: string): string[] {
  if (!ARCHIVO_DE_TIPOS.test(ruta)) return [];
  return [
    ...lineasQueCumplen(ruta, codigo, VALOR_EN_ARCHIVO_DE_TIPOS, "un archivo de tipos exporta un valor"),
    ...lineasQueCumplen(ruta, codigo, IMPORTA_VALOR, "un archivo de tipos importa sin import type"),
  ];
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
  return extraerImportaciones(codigo).flatMap((especificador) => {
    const local = rutaLocal(ruta, especificador);
    return local === null ? [] : [local];
  });
}

function listarTodasLasFuentes(): string[] {
  const rutas = ["src", "tests"]
    .filter((carpeta) => existsSync(join(RAIZ, carpeta)))
    .flatMap((carpeta) => [...new Bun.Glob(`${carpeta}/**/*.ts`).scanSync({ cwd: RAIZ })]);
  if (existsSync(join(RAIZ, "demo.ts"))) rutas.push("demo.ts");
  return rutas.map((ruta) => ruta.split("\\").join("/")).sort();
}

function importacionesRelativas(ruta: string, codigo: string): string[] {
  return extraerImportaciones(codigo)
    .filter((especificador) => especificador.startsWith("."))
    .map((especificador) => `${ruta}: importación relativa ${especificador}`);
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

  test("G1: src/, tests/ y demo.ts no usan importaciones relativas", () => {
    const violaciones = listarTodasLasFuentes().flatMap((ruta) => importacionesRelativas(ruta, leer(ruta)));
    expect(violaciones).toEqual([]);
  });

  test("G2: el grafo de importaciones resuelve los alias", () => {
    const grafo = grafoDeFuentes();
    expect(grafo.get("demo.ts")).toEqual(["src/demo/ejecutar-demo.runner.ts"]);
    expect([...grafo.values()].flat().length).toBeGreaterThan(listarFuentes().length);
  });

  test("el detector de ciclos muerde sobre un grafo de muestra", () => {
    const grafo = new Map([
      ["a.ts", ["b.ts"]],
      ["b.ts", ["a.ts"]],
      ["c.ts", ["a.ts"]],
    ]);
    expect(ciclosDe(grafo)).toEqual(["a.ts -> b.ts -> a.ts"]);
  });

  test("G2: el detector de ciclos muerde sobre un ciclo con alias", () => {
    const fuentes: Readonly<Record<string, string>> = {
      "src/domain/a.ts": 'import { b } from "@/domain/b.ts";\n',
      "src/domain/b.ts": 'import type { A } from "@/domain/a.ts";\n',
    };
    const grafo = new Map(
      Object.entries(fuentes).map(([ruta, codigo]) => [ruta, dependenciasLocales(ruta, codigo)]),
    );
    expect(ciclosDe(grafo)).toEqual(["src/domain/a.ts -> src/domain/b.ts -> src/domain/a.ts"]);
  });

  test("G9: la config pura no lee entorno ni importa node:, Bun ni zod", () => {
    const fuentes = listarFuentes();
    expect(fuentes.filter((ruta) => capaDeRuta(ruta) === "config-pure").length).toBeGreaterThan(0);
    expect(fuentes.flatMap((ruta) => violacionesDePureza(ruta, leer(ruta)))).toEqual([]);
  });

  test("G10: solo src/config/env.ts lee el entorno", () => {
    expect(listarFuentes().flatMap((ruta) => violacionesDeLecturaDeEntorno(ruta, leer(ruta)))).toEqual([]);
  });

  test("G6: src/ no compara ni asigna códigos de familia con literales", () => {
    expect(VALORES_DE_FAMILIA.length).toBeGreaterThan(0);
    expect(listarFuentes().flatMap((ruta) => violacionesDeLiteralesDeFamilia(ruta, leer(ruta)))).toEqual([]);
  });

  test("G7: src/ y demo.ts no declaran enums de TypeScript", () => {
    expect(listarFuentes().flatMap((ruta) => violacionesDeEnum(ruta, leer(ruta)))).toEqual([]);
  });

  test("G11: las expresiones regulares viven en patterns.constants.ts", () => {
    expect(listarFuentes().flatMap((ruta) => violacionesDeRegex(ruta, leer(ruta)))).toEqual([]);
  });

  test("G8: el texto legible vive solo en src/config/strings.ts", () => {
    expect(listarFuentes().flatMap((ruta) => violacionesDeTexto(ruta, leer(ruta)))).toEqual([]);
  });

  test("G3: los tipos exportados viven solo en types/*.type.ts", () => {
    const fuentes = listarTodasLasFuentes();
    expect(fuentes.filter((ruta) => ARCHIVO_DE_TIPOS.test(ruta)).length).toBeGreaterThan(0);
    expect(fuentes.flatMap((ruta) => violacionesDeUbicacionDeTipos(ruta, leer(ruta)))).toEqual([]);
  });

  test("G4: los archivos de tipos solo tienen tipos e import type", () => {
    expect(listarTodasLasFuentes().flatMap((ruta) => violacionesDeArchivoDeTipos(ruta, leer(ruta)))).toEqual(
      [],
    );
  });

  test("src/ y demo.ts no usan APIs de shell", () => {
    const violaciones = listarFuentes().flatMap((ruta) => violacionesDeShell(ruta, leer(ruta)));
    expect(violaciones).toEqual([]);
  });
});

describe("superficie pública de herramientas (CAL-04)", () => {
  test("proveedor.ts solo exporta nombres del PRD con descripción de una oración", async () => {
    const modulo = Object.fromEntries(Object.entries(await import("@/tools/proveedor.ts")));
    expect(Object.keys(modulo).length).toBeGreaterThan(0);
    expect(violacionesDeHerramientas(modulo)).toEqual([]);
  });

  test("proveedor.ts exporta exactamente las cinco herramientas con description, args y execute (HERR-01)", async () => {
    const modulo = Object.fromEntries(Object.entries(await import("@/tools/proveedor.ts")));
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
    expect(fuentes).toContain("src/demo/ejecutar-demo.runner.ts");
    expect(fuentes).toContain("demo.ts");
    for (const ruta of ["src/demo/ejecutar-demo.runner.ts", "demo.ts"]) {
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
    const codigo = 'import type { Lector } from "@/infra/lector";\nexport const a = 1;\n';
    expect(violacionesDeCapas("src/domain/a.ts", codigo)).toEqual([
      "src/domain/a.ts: la capa domain no puede importar @/infra/lector",
    ]);
  });

  test("reporta export type desde un módulo exterior", () => {
    const codigo = 'export type { Puerto } from "@/application/puertos";\n';
    expect(violacionesDeCapas("src/domain/b.ts", codigo)).toEqual([
      "src/domain/b.ts: la capa domain no puede importar @/application/puertos",
    ]);
  });

  test("reporta la importación de efecto de node:fs dentro de domain", () => {
    expect(violacionesDeCapas("src/domain/c.ts", 'import "node:fs";\n')).toEqual([
      "src/domain/c.ts: la capa domain no puede importar node:fs",
    ]);
  });

  test("reporta una importación multilínea y una dinámica hacia capas futuras", () => {
    const codigo =
      'import {\n  servidor,\n} from "@/server";\nconst llm = await import("@/llm/adaptador");\n';
    expect(violacionesDeCapas("src/application/d.ts", codigo)).toEqual([
      "src/application/d.ts: la capa application no puede importar @/server",
      "src/application/d.ts: la capa application no puede importar @/llm/adaptador",
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
    const codigo =
      'import { normalizar } from "@/domain/normalizar";\nimport type { Campo } from "./tipos.ts";\n';
    expect(violacionesDeCapas("src/domain/mapeo.ts", codigo)).toEqual([]);
  });

  test("solo entorno.wiring.ts puede importar infra desde tools", () => {
    const codigo = 'import { readValidatedJson } from "@/infra/fixtures/fixtures-reader.adapter.ts";\n';
    expect(violacionesDeCapas("src/tools/entorno.wiring.ts", codigo)).toEqual([]);
    expect(violacionesDeCapas("src/tools/definir-herramienta.factory.ts", codigo)).toEqual([
      "src/tools/definir-herramienta.factory.ts: la capa tools no puede importar @/infra/fixtures/fixtures-reader.adapter.ts",
    ]);
  });

  test("src/demo solo llega a la herramienta exportada, config y node:", () => {
    const permitido =
      'import { leer_solicitud } from "@/tools/proveedor.ts";\nimport { join } from "node:path";\n';
    const prohibido = 'import { crearEntorno } from "@/tools/entorno.wiring";\n';
    expect(violacionesDeCapas("src/demo/ejecutar-demo.runner.ts", permitido)).toEqual([]);
    expect(violacionesDeCapas("src/demo/ejecutar-demo.runner.ts", prohibido)).toEqual([
      "src/demo/ejecutar-demo.runner.ts: la capa demo no puede importar @/tools/entorno.wiring",
    ]);
  });

  test("G1: reporta importaciones relativas estáticas, de reexportación y dinámicas", () => {
    const comilla = '"';
    const codigo = [
      'import { a } from "./a.ts";',
      'export { b } from "../b.ts";',
      `const c = await import(${comilla}../c.ts${comilla});`,
      'import { d } from "@/domain/d.ts";',
    ].join("\n");
    expect(importacionesRelativas("src/x.ts", codigo)).toEqual([
      "src/x.ts: importación relativa ./a.ts",
      "src/x.ts: importación relativa ../b.ts",
      "src/x.ts: importación relativa ../c.ts",
    ]);
  });

  test("src no puede importar desde @tests/", () => {
    expect(violacionesDeCapas("src/domain/e.ts", 'import { f } from "@tests/helpers/f.ts";\n')).toEqual([
      "src/domain/e.ts: la capa domain no puede importar @tests/helpers/f.ts",
    ]);
  });

  test("G9: reporta config pura que importa zod o node: y lee el entorno", () => {
    const punto = ".";
    const codigo = [
      'import { z } from "zod";',
      'import { join } from "node:path";',
      `const zona = Bun${punto}env.TZ;`,
      "export const A = 1;",
    ].join("\n");
    expect(violacionesDePureza("src/config/constants/x.constants.ts", codigo)).toEqual([
      "src/config/constants/x.constants.ts:1: config pura con entorno, node, Bun o zod",
      "src/config/constants/x.constants.ts:2: config pura con entorno, node, Bun o zod",
      "src/config/constants/x.constants.ts:3: config pura con entorno, node, Bun o zod",
    ]);
    expect(violacionesDeCapas("src/config/strings.ts", 'import { x } from "@/domain/x.ts";\n')).toEqual([
      "src/config/strings.ts: la capa config-pure no puede importar @/domain/x.ts",
    ]);
  });

  test("G10: reporta una lectura del entorno fuera de env.ts", () => {
    const punto = ".";
    const codigo = `const fecha = process${punto}env.FECHA_EJECUCION;\n`;
    expect(violacionesDeLecturaDeEntorno("src/tools/x.ts", codigo)).toEqual([
      "src/tools/x.ts:1: lee el entorno fuera de src/config/env.ts",
    ]);
    expect(violacionesDeLecturaDeEntorno("src/config/env.ts", codigo)).toEqual([]);
  });

  test("domain y application leen la config pura pero no el entorno", () => {
    const pura = 'import { PATRON_CASO } from "@/config/constants/patterns.constants.ts";\n';
    const entorno = 'import { readToolEnv } from "@/config/env.ts";\n';
    expect(violacionesDeCapas("src/application/a.ts", pura)).toEqual([]);
    expect(violacionesDeCapas("src/domain/a.ts", entorno)).toEqual([
      "src/domain/a.ts: la capa domain no puede importar @/config/env.ts",
    ]);
  });

  test("G6: reporta comparaciones, case, propiedades y fallo con literales de código", () => {
    const codigo = [
      'if (campo.estado === "faltante") return;',
      'switch (formato) { case "xlsx": break; }',
      'const hoja = { tipo: "ausente" };',
      'return fallo("ERROR_INTERNO");',
      'if (texto === "otra cosa") return;',
      "if (campo.estado === ESTADO_CAMPO.FALTANTE) return;",
    ].join("\n");
    expect(violacionesDeLiteralesDeFamilia("src/domain/x.ts", codigo)).toEqual([
      "src/domain/x.ts:1: compara o asigna un código con un literal",
      "src/domain/x.ts:2: compara o asigna un código con un literal",
      "src/domain/x.ts:3: compara o asigna un código con un literal",
      "src/domain/x.ts:4: compara o asigna un código con un literal",
    ]);
    expect(violacionesDeLiteralesDeFamilia("src/config/constants/x.constants.ts", codigo)).toEqual([]);
  });

  test("G7: reporta un enum de TypeScript", () => {
    const codigo = ["export ", "enum Color { Rojo }\n"].join("");
    expect(violacionesDeEnum("src/domain/x.ts", codigo)).toEqual([
      "src/domain/x.ts:1: declara un enum de TypeScript",
    ]);
  });

  test("G11: reporta literales de regex y new RegExp fuera de patterns", () => {
    const barra = "/";
    const dolar = "$";
    const codigo = [
      `const a = ${barra}\\s+${barra}g;`,
      'const b = new RegExp("x");',
      "const c = total / 2 / 3;",
      `const d = \`${dolar}{base}/${dolar}{nombre}\`;`,
    ].join("\n");
    expect(violacionesDeRegex("src/infra/x.ts", codigo)).toEqual([
      "src/infra/x.ts:1: declara una expresión regular fuera de patterns",
      "src/infra/x.ts:2: declara una expresión regular fuera de patterns",
    ]);
    expect(violacionesDeRegex("src/config/constants/patterns.constants.ts", codigo)).toEqual([]);
  });

  test("G8: reporta texto legible en cadenas, plantillas y expresiones anidadas", () => {
    const dolar = "$";
    const codigo = [
      'throw new RangeError("La fecha no es válida.");',
      `const a = \`${dolar}{caso}: formulario generado\`;`,
      `const b = \`${dolar}{x ? "sin datos" : y}\`;`,
      'const c = "@/config/strings.ts";',
      `const d = \`${dolar}{caso}: ${dolar}{codigo}\`;`,
      "const e = texto.split(/[\"'] [a-z]+/);",
    ].join("\n");
    expect(violacionesDeTexto("src/infra/x.ts", codigo)).toEqual([
      "src/infra/x.ts: texto legible fuera de strings.ts: La fecha no es válida.",
      "src/infra/x.ts: texto legible fuera de strings.ts:  : formulario generado",
      "src/infra/x.ts: texto legible fuera de strings.ts: sin datos",
    ]);
    expect(violacionesDeTexto("src/config/strings.ts", codigo)).toEqual([]);
  });

  test("G3: reporta tipos exportados fuera de types/ y deja pasar ToolEnv", () => {
    const codigo = [
      "export type A = string;",
      "export interface B { readonly c: string }",
      'export { type D } from "@/domain/d.ts";',
      "type Local = number;",
      "export const e = 1;",
    ].join("\n");
    expect(violacionesDeUbicacionDeTipos("src/domain/x.ts", codigo)).toEqual([
      "src/domain/x.ts:1: exporta un tipo fuera de types/*.type.ts",
      "src/domain/x.ts:2: exporta un tipo fuera de types/*.type.ts",
      "src/domain/x.ts:3: exporta un tipo fuera de types/*.type.ts",
    ]);
    expect(violacionesDeUbicacionDeTipos("src/domain/types/x.type.ts", codigo)).toEqual([]);
    expect(violacionesDeUbicacionDeTipos("src/config/env.ts", codigo)).toEqual([]);
  });

  test("G4: reporta valores e importaciones de valor en un archivo de tipos", () => {
    const codigo = [
      'import { ESTADO } from "@/config/constants/x.constants.ts";',
      'import type { ValorDe } from "@/config/types/valor-de.type.ts";',
      "export const a = 1;",
      "export function b(): void {}",
      "export type C = ValorDe<typeof ESTADO>;",
    ].join("\n");
    expect(violacionesDeArchivoDeTipos("src/domain/types/x.type.ts", codigo)).toEqual([
      "src/domain/types/x.type.ts:3: un archivo de tipos exporta un valor",
      "src/domain/types/x.type.ts:4: un archivo de tipos exporta un valor",
      "src/domain/types/x.type.ts:1: un archivo de tipos importa sin import type",
    ]);
  });

  test("reporta un archivo en una capa no declarada", () => {
    expect(violacionesDeCapas("src/varios/x.ts", "export const x = 1;\n")).toEqual([
      "src/varios/x.ts: pertenece a una capa no declarada (desconocida)",
    ]);
  });
});
