import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, posix } from "node:path";
import {
  ENUM_DE_TS,
  EXPORTA_TIPO,
  extraerImportaciones,
  extraerImportacionesConTipo,
  IMPORTA_VALOR,
  LITERAL_DE_REGEX,
  lineasQueCumplen,
  literalesDeTexto,
  nombreDePaquete,
  TEXTO_LEGIBLE,
  VALOR_EN_ARCHIVO_DE_TIPOS,
} from "@tests/helpers/escaner-fuentes.helper.ts";
import { ACCION, CODIGO_AGENTE, MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import {
  DECISION_CONFIRMACION,
  ESTADO_COMPUERTA,
  EVENTO_COMPUERTA,
  TIPO_ACCION,
} from "@/config/constants/confirmation.constants.ts";
import { CODIGO_ERROR, CODIGO_FS } from "@/config/constants/errors.constants.ts";
import {
  ARCHIVOS_PAQUETE,
  ARCHIVOS_SALIDA,
  TIPO_ARCHIVO_CASO,
  TIPO_VISTA_PREVIA,
} from "@/config/constants/files.constants.ts";
import { FORMATO, TIPO_PLANTILLA } from "@/config/constants/forms.constants.ts";
import { ENTORNO_APP, RESULTADO_BEARER } from "@/config/constants/http.constants.ts";
import { ESTADO_LECTURA, ORIGEN_COPIA } from "@/config/constants/io.constants.ts";
import { CLAVE_PLANTILLA } from "@/config/constants/knowledge.constants.ts";
import {
  BOOLEANO_ENV,
  ESTADO_LLM,
  FIN_LLM,
  FINISH_REASON,
  MODO_THINKING,
  PARAMETRO_MAX_TOKENS,
  ROL_MENSAJE,
  TIPO_ERROR_LLM,
  TOOL_CHOICE,
} from "@/config/constants/llm.constants.ts";
import { NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import {
  APLICA_NOTA,
  ESTADO_CAMPO,
  REGLA_MAPEO,
  TIPO_HOJA_MAESTRO,
  VARIABLE_NOTA,
} from "@/config/constants/mapping.constants.ts";
import { DIRECTORIO_MODULO, MOTIVO_FUENTE_MODULO } from "@/config/constants/modulo.constants.ts";
import { COLOR_TRAZO } from "@/config/constants/pdf.constants.ts";
import { TIPO_MASCARA } from "@/config/constants/pii.constants.ts";
import { ESTADO_SOPORTE, ESTADO_VIGENCIA } from "@/config/constants/supports.constants.ts";
import { HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import * as STRINGS from "@/config/strings.ts";

const RAIZ = join(import.meta.dir, "..");

const HERRAMIENTAS_DEL_MODULO = "modulo/tools/proveedor.ts";

const RUTA_HERRAMIENTAS_DEL_MODULO = join(RAIZ, DIRECTORIO_MODULO, "tools", "proveedor.ts");

const API_SHELL = /child_process|\bBun\s*\.\s*(?:spawn|\$)|\bBun\s*\[\s*["'`](?:spawn|\$)/;

const PAQUETES_CON_CAPA = new Set(["zod", "exceljs", "pdf-lib", "pino", "hono"]);

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

const DESTINOS_DEL_BUCLE = ["loop", "llm", "domain", "application", "config-pure", "tools", "zod"];

const DESTINOS_HTTP = ["http", "loop", "llm", "domain", "application", "config-pure", "zod", "hono"];

const DESTINOS_CLI = [
  "cli",
  "domain",
  "config-pure",
  "config-env",
  "zod",
  "node",
  "http",
  "paquete:eventsource-parser",
];

const PERMITIDOS: Readonly<Record<string, readonly string[]>> = {
  domain: ["domain", "config-pure"],
  application: ["domain", "application", "config-pure"],
  "config-pure": ["config-pure"],
  "config-env": ["config-env", "config-pure", "domain", "zod"],
  infra: [
    "domain",
    "application",
    "config-pure",
    "config-env",
    "infra",
    "node",
    "zod",
    "exceljs",
    "pdf-lib",
    "pino",
  ],
  tools: DESTINOS_DE_HERRAMIENTAS,
  proveedor: DESTINOS_DE_HERRAMIENTAS,
  wiring: [...DESTINOS_DE_HERRAMIENTAS, "infra"],
  demo: DESTINOS_DE_DEMO,
  "raiz-demo": DESTINOS_DE_DEMO,
  llm: ["llm", "config-pure", "zod"],
  loop: DESTINOS_DEL_BUCLE,
  "wiring-agente": [...DESTINOS_DEL_BUCLE, "config-env", "infra", "proveedor"],
  http: DESTINOS_HTTP,
  "wiring-http": [...DESTINOS_HTTP, "config-env", "infra", "wiring-agente", "node"],
  servidor: ["wiring-http", "node"],
  cli: DESTINOS_CLI,
  modulo: ["proveedor"],
};

const CONFIG_PURA = /^src\/config\/(?:constants\/.+|types\/.+|strings)$/;

const TIPOS_HTTP = /^src\/http\/types\//;

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
  TIPO_ARCHIVO_CASO,
  TIPO_VISTA_PREVIA,
  TIPO_MASCARA,
  COLOR_TRAZO,
  HERRAMIENTA,
  ROL_MENSAJE,
  FIN_LLM,
  FINISH_REASON,
  TIPO_ERROR_LLM,
  ESTADO_LLM,
  MODO_THINKING,
  PARAMETRO_MAX_TOKENS,
  TOOL_CHOICE,
  TIPO_EVENTO,
  MOTIVO_FIN,
  CODIGO_AGENTE,
  ACCION,
  RESULTADO_BEARER,
  ENTORNO_APP,
  NIVELES_LOG,
  BOOLEANO_ENV,
  DECISION_CONFIRMACION,
  ESTADO_COMPUERTA,
  EVENTO_COMPUERTA,
  TIPO_ACCION,
  MOTIVO_FUENTE_MODULO,
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

const DUENOS_DE_REGEX: ReadonlySet<string> = new Set([
  "src/config/constants/patterns.constants.ts",
  "src/domain/engines/motor-plantillas.engine.ts",
]);

const DUENOS_DE_TEXTO = /^src\/(?:config\/strings\.ts|knowledge\/)/;

const ARCHIVO_DE_TIPOS = /(?:^|\/)types\/[a-z0-9-]+\.type\.ts$/;

const TIPOS_JUNTO_A_SU_ESQUEMA: ReadonlySet<string> = new Set(["src/config/env.ts"]);

const KEBAB = "[a-z0-9]+(?:-[a-z0-9]+)*";

const CARPETAS_DE_ROL: Readonly<Record<string, string>> = {
  "domain/engines": "engine",
  "domain/builders": "builder",
  "domain/policies": "policy",
  "domain/selectors": "selector",
  "domain/utils": "util",
  "application/use-cases": "use-case",
  "application/services": "service",
  "tools/factories": "factory",
  "tools/wiring": "wiring",
  "demo/runners": "runner",
  "cli/runners": "runner",
  "llm/adapters": "adapter",
  "llm/decorators": "decorator",
  "llm/mappers": "mapper",
  "loop/services": "service",
  "loop/wiring": "wiring",
  "http/routes": "route",
  "http/middlewares": "middleware",
  "http/services": "service",
  "http/wiring": "wiring",
};

const ROLES_DE_PRUEBA = [...new Set([...Object.values(CARPETAS_DE_ROL), "adapter", "schema"])].join("|");

const NOMBRES_CON_ROL: readonly RegExp[] = [
  /^demo\.ts$/,
  /^src\/tools\/proveedor\.ts$/,
  /^modulo\/tools\/proveedor\.ts$/,
  /^src\/config\/(?:strings|env)\.ts$/,
  /^src\/server\.ts$/,
  new RegExp(`^src/config/constants/${KEBAB}\\.constants\\.ts$`),
  new RegExp(
    `^src/(?:config|domain|application|infra|tools|demo|llm|loop|http|cli)/types/${KEBAB}\\.type\\.ts$`,
  ),
  new RegExp(`^tests/helpers/types/${KEBAB}\\.type\\.ts$`),
  new RegExp(`^src/(?:infra|tools|llm|loop|http|cli)/(?:${KEBAB}/)*schemas/${KEBAB}\\.schema\\.ts$`),
  ...Object.entries(CARPETAS_DE_ROL).map(
    ([carpeta, rol]) => new RegExp(`^src/${carpeta}/${KEBAB}\\.${rol}\\.ts$`),
  ),
  new RegExp(`^src/infra/${KEBAB}/(?:${KEBAB}/)*${KEBAB}\\.(?:adapter|util)\\.ts$`),
  new RegExp(`^tests/unit/${KEBAB}\\.(?:${ROLES_DE_PRUEBA})\\.test\\.ts$`),
  new RegExp(`^tests/(?!unit/)(?:${KEBAB}/)*${KEBAB}\\.test\\.ts$`),
  new RegExp(`^tests/helpers/${KEBAB}\\.helper\\.ts$`),
];

const SUELTO_EN_CAPA = /^src\/(?:[^/]+\/)?[^/]+\.ts$/;

const SUELTOS_PERMITIDOS: ReadonlySet<string> = new Set([
  "src/tools/proveedor.ts",
  "src/config/env.ts",
  "src/config/strings.ts",
  "src/server.ts",
]);

const PRUEBA_UNITARIA = /^tests\/unit\/([a-z0-9-]+\.[a-z-]+)\.test\.ts$/;

const CASO_DE_USO = /^src\/application\/use-cases\//;

const EXPORTA_FUNCION = /^export\s+(?:async\s+)?function\s/;

const NOMBRE_DE_HERRAMIENTA_SUELTO = new RegExp(`\\b(?:${Object.values(HERRAMIENTA).join("|")})\\b`);

const Z_ENUM_CON_ARREGLO = /\bz\s*\.\s*enum\(\s*\[([^\]]*)\]/g;

const MIEMBRO_DE_CONSTANTE = /\b[A-Z][A-Z0-9_]*\s*\.\s*[A-Z][A-Z0-9_]*\b/;

const ARCHIVO_DE_ESQUEMAS = /^src\/(?:[a-z0-9-]+\/)*schemas\/[a-z0-9-]+\.schema\.ts$/;

const INICIO_DE_DECLARACION = /\n(?=[a-z])/;

const EXPORTA_ESQUEMA = /^export\s+const\s+(\w+Schema)\b/;

const COMPROBADO_CONTRA_TIPO = /\bsatisfies\s+z\.ZodType</;

const CARPETAS_ENUMERADAS_EN_DOCS = [
  "domain/engines",
  "domain/builders",
  "domain/policies",
  "domain/utils",
  "llm/decorators",
  "loop/services",
  "http/routes",
  "http/middlewares",
  "http/services",
  "cli/runners",
];

const DOC_DE_ESTRUCTURA = "docs/estructura.md";

function sinExtension(ruta: string): string {
  return ruta.replace(/\.(?:ts|js)$/, "");
}

function capaDeRuta(ruta: string): string {
  const base = sinExtension(ruta);
  if (base === "demo") return "raiz-demo";
  if (base === "src/tools/wiring/entorno.wiring") return "wiring";
  if (base === "src/loop/wiring/agente.wiring") return "wiring-agente";
  if (base === "src/http/wiring/server.wiring") return "wiring-http";
  if (base === "src/server") return "servidor";
  if (base === "src/tools/proveedor") return "proveedor";
  if (base.startsWith("tests/")) return "tests";
  if (base.startsWith(`${DIRECTORIO_MODULO}/`)) return "modulo";
  if (CONFIG_PURA.test(base)) return "config-pure";
  if (base === "src/config/env") return "config-env";
  const capa = /^src\/(domain|application|infra|tools|demo|llm|loop|http|cli)\//.exec(base)?.[1];
  return capa ?? "desconocida";
}

const ALIAS: readonly (readonly [string, string])[] = [
  ["@/", "src/"],
  ["@tests/", "tests/"],
  ["@web/", "web/src/"],
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

function violacionesDeCapas(ruta: string, codigo: string): string[] {
  const origen = capaDeRuta(ruta);
  if (origen === "tests") return [];
  const permitidos = PERMITIDOS[origen];
  if (permitidos === undefined) return [`${ruta}: pertenece a una capa no declarada (${origen})`];
  return extraerImportaciones(codigo)
    .filter((especificador) => !permitidos.includes(capaDeDestino(ruta, especificador)))
    .map((especificador) => `${ruta}: la capa ${origen} no puede importar ${especificador}`);
}

function violacionesDeHttpEnCli(ruta: string, codigo: string): string[] {
  if (capaDeRuta(ruta) !== "cli") return [];
  return extraerImportacionesConTipo(codigo)
    .filter(({ especificador, soloTipo }) => {
      if (capaDeDestino(ruta, especificador) !== "http") return false;
      return !soloTipo || !TIPOS_HTTP.test(rutaLocal(ruta, especificador) ?? "");
    })
    .map(
      ({ especificador }) =>
        `${ruta}: la capa cli solo importa tipos de http/types con import type: ${especificador}`,
    );
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

function violacionesDeNombre(ruta: string): string[] {
  return NOMBRES_CON_ROL.some((patron) => patron.test(ruta))
    ? []
    : [`${ruta}: el nombre no sigue la tabla de sufijos por carpeta`];
}

function violacionesDeArchivoSuelto(ruta: string): string[] {
  return SUELTO_EN_CAPA.test(ruta) && !SUELTOS_PERMITIDOS.has(ruta)
    ? [`${ruta}: archivo suelto en la raíz de su capa; va en una carpeta de rol`]
    : [];
}

function violacionesDeEspejo(ruta: string, fuentes: readonly string[]): string[] {
  if (!ruta.startsWith("tests/unit/")) return [];
  const modulo = PRUEBA_UNITARIA.exec(ruta)?.[1];
  if (modulo === undefined) return [`${ruta}: la prueba unitaria no nombra un módulo <nombre>.<rol>`];
  return fuentes.some((fuente) => fuente.endsWith(`/${modulo}.ts`))
    ? []
    : [`${ruta}: no existe src/**/${modulo}.ts`];
}

function violacionesDeCasoDeUso(ruta: string, codigo: string): string[] {
  if (!CASO_DE_USO.test(ruta)) return [];
  const exportaciones = codigo.split("\n").filter((linea) => linea.startsWith("export "));
  const funciones = exportaciones.filter((linea) => EXPORTA_FUNCION.test(linea));
  return funciones.length === 1 && exportaciones.length === 1
    ? []
    : [`${ruta}: un caso de uso exporta exactamente una función`];
}

function lineaDe(codigo: string, indice: number): number {
  return codigo.slice(0, indice).split("\n").length;
}

function violacionesDeEnumAMano(ruta: string, codigo: string): string[] {
  return [...codigo.matchAll(Z_ENUM_CON_ARREGLO)]
    .filter((coincidencia) => MIEMBRO_DE_CONSTANTE.test(coincidencia[1] ?? ""))
    .map(
      (coincidencia) =>
        `${ruta}:${lineaDe(codigo, coincidencia.index)}: z.enum enumera a mano los miembros de una constante`,
    );
}

function violacionesDeEsquemaSinTipo(ruta: string, codigo: string): string[] {
  if (!ARCHIVO_DE_ESQUEMAS.test(ruta)) return [];
  return codigo.split(INICIO_DE_DECLARACION).flatMap((declaracion) => {
    const nombre = EXPORTA_ESQUEMA.exec(declaracion)?.[1];
    if (nombre === undefined || COMPROBADO_CONTRA_TIPO.test(declaracion)) return [];
    return [`${ruta}: ${nombre} no se comprueba contra su tipo con satisfies z.ZodType<T>`];
  });
}

function modulosSinDocumentar(fuentes: readonly string[], documento: string): string[] {
  return CARPETAS_ENUMERADAS_EN_DOCS.flatMap((carpeta) =>
    fuentes
      .filter((ruta) => posix.dirname(ruta) === `src/${carpeta}`)
      .map((ruta) => posix.basename(ruta).split(".")[0] ?? ruta)
      .filter((modulo) => !documento.includes(`\`${modulo}\``))
      .map((modulo) => `${carpeta}/${modulo}: no aparece en ${DOC_DE_ESTRUCTURA}`),
  );
}

function referenciasSinPrefijo(origen: string, texto: string): string[] {
  return NOMBRE_DE_HERRAMIENTA_SUELTO.test(texto) ? [`${origen}: nombra una herramienta sin proveedor_`] : [];
}

function textosDe(valor: unknown, ruta: string): (readonly [string, string])[] {
  if (typeof valor === "string") return [[ruta, valor]];
  if (typeof valor !== "object" || valor === null) return [];
  return Object.entries(valor).flatMap(([clave, hijo]) => textosDe(hijo, `${ruta}.${clave}`));
}

function violacionesDeShell(ruta: string, codigo: string): string[] {
  return codigo
    .split("\n")
    .flatMap((linea, indice) =>
      API_SHELL.test(linea) ? [`${ruta}:${indice + 1}: usa una API de shell`] : [],
    );
}

function escanearCarpetas(carpetas: readonly string[]): string[] {
  return carpetas
    .filter((carpeta) => existsSync(join(RAIZ, carpeta)))
    .flatMap((carpeta) => [...new Bun.Glob(`${carpeta}/**/*.ts`).scanSync({ cwd: RAIZ })]);
}

function listarFuentes(): string[] {
  const rutas = escanearCarpetas(["src", DIRECTORIO_MODULO]);
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
  const rutas = escanearCarpetas(["src", "tests", DIRECTORIO_MODULO]);
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
    expect(grafo.get("demo.ts")).toEqual(["src/demo/runners/ejecutar-demo.runner.ts"]);
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

  test("G5: cada archivo sigue la tabla de sufijos de su carpeta", () => {
    expect(listarTodasLasFuentes().flatMap(violacionesDeNombre)).toEqual([]);
  });

  test("G13: ningún .ts queda suelto en src/ ni en la raíz de una capa", () => {
    expect(listarFuentes().flatMap(violacionesDeArchivoSuelto)).toEqual([]);
  });

  test("G14: cada prueba unitaria es espejo de un módulo de src/", () => {
    const fuentes = listarFuentes();
    const todas = listarTodasLasFuentes();
    expect(todas.filter((ruta) => ruta.startsWith("tests/unit/")).length).toBeGreaterThan(0);
    expect(todas.flatMap((ruta) => violacionesDeEspejo(ruta, fuentes))).toEqual([]);
  });

  test("G5: cada caso de uso exporta exactamente una función", () => {
    const fuentes = listarFuentes().filter((ruta) => CASO_DE_USO.test(ruta));
    expect(fuentes.length).toBe(5);
    expect(fuentes.flatMap((ruta) => violacionesDeCasoDeUso(ruta, leer(ruta)))).toEqual([]);
  });

  test("G12: strings.ts nombra las herramientas siempre con el prefijo proveedor_", () => {
    const fuente = leer("src/config/strings.ts")
      .split("\n")
      .flatMap((linea, indice) => referenciasSinPrefijo(`src/config/strings.ts:${indice + 1}`, linea));
    const valores = textosDe(STRINGS, "strings").flatMap(([ruta, texto]) =>
      referenciasSinPrefijo(ruta, texto),
    );
    expect([...fuente, ...valores]).toEqual([]);
    expect(STRINGS.MENSAJE_ERROR.FORMULARIO_NO_GENERADO).toContain("proveedor_generar_formulario");
  });

  test("G15: los z.enum se construyen desde su constante, no enumerando sus miembros", () => {
    expect(listarFuentes().flatMap((ruta) => violacionesDeEnumAMano(ruta, leer(ruta)))).toEqual([]);
  });

  test("G16: cada esquema exportado de schemas/ se comprueba contra su tipo", () => {
    const fuentes = listarFuentes();
    expect(fuentes.filter((ruta) => ARCHIVO_DE_ESQUEMAS.test(ruta)).length).toBeGreaterThan(0);
    expect(fuentes.flatMap((ruta) => violacionesDeEsquemaSinTipo(ruta, leer(ruta)))).toEqual([]);
  });

  test("docs/estructura.md nombra cada módulo de las carpetas que enumera (IN-21)", () => {
    expect(modulosSinDocumentar(listarFuentes(), leer(DOC_DE_ESTRUCTURA))).toEqual([]);
  });

  test("la capa cli del código real solo toma tipos de http con import type", () => {
    const fuentes = listarFuentes();
    expect(fuentes).toContain("src/cli/runners/generar-modulo.runner.ts");
    expect(fuentes.flatMap((ruta) => violacionesDeHttpEnCli(ruta, leer(ruta)))).toEqual([]);
  });

  test("modulo/ entra en el escaneo y solo reexporta las herramientas de la app (MOD-02)", () => {
    expect(listarFuentes()).toContain(HERRAMIENTAS_DEL_MODULO);
    expect(listarTodasLasFuentes()).toContain(HERRAMIENTAS_DEL_MODULO);
    expect(violacionesDeCapas(HERRAMIENTAS_DEL_MODULO, leer(HERRAMIENTAS_DEL_MODULO))).toEqual([]);
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

  test("modulo/tools/proveedor.ts cumple el mismo contrato de las cinco herramientas (MOD-02)", async () => {
    const modulo = Object.fromEntries(Object.entries(await import(RUTA_HERRAMIENTAS_DEL_MODULO)));
    expect(Object.keys(modulo).sort()).toEqual([...HERRAMIENTAS_PRD].sort());
    expect(violacionesDeHerramientas(modulo)).toEqual([]);
    expect(Object.entries(modulo).flatMap(([nombre, valor]) => contratoIncompleto(nombre, valor))).toEqual(
      [],
    );
  });

  test("la regla de capas de src/demo se aplica a archivos reales", () => {
    const fuentes = listarFuentes();
    expect(fuentes).toContain("src/demo/runners/ejecutar-demo.runner.ts");
    expect(fuentes).toContain("demo.ts");
    for (const ruta of ["src/demo/runners/ejecutar-demo.runner.ts", "demo.ts"]) {
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

  test("reporta una importación multilínea y una dinámica hacia capas exteriores", () => {
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
      'import { normalizar } from "@/domain/utils/normalizar.util";\nimport type { Campo } from "./tipos.ts";\n';
    expect(violacionesDeCapas("src/domain/engines/mapeo.engine.ts", codigo)).toEqual([]);
  });

  test("solo entorno.wiring.ts puede importar infra desde tools", () => {
    const codigo = 'import { readValidatedJson } from "@/infra/fixtures/fixtures-reader.adapter.ts";\n';
    expect(violacionesDeCapas("src/tools/wiring/entorno.wiring.ts", codigo)).toEqual([]);
    expect(violacionesDeCapas("src/tools/wiring/otro.wiring.ts", codigo)).toEqual([
      "src/tools/wiring/otro.wiring.ts: la capa tools no puede importar @/infra/fixtures/fixtures-reader.adapter.ts",
    ]);
    expect(violacionesDeCapas("src/tools/factories/definir-herramienta.factory.ts", codigo)).toEqual([
      "src/tools/factories/definir-herramienta.factory.ts: la capa tools no puede importar @/infra/fixtures/fixtures-reader.adapter.ts",
    ]);
  });

  test("src/demo solo llega a la herramienta exportada, config y node:", () => {
    const permitido =
      'import { leer_solicitud } from "@/tools/proveedor.ts";\nimport { join } from "node:path";\n';
    const prohibido = 'import { crearEntorno } from "@/tools/wiring/entorno.wiring";\n';
    expect(violacionesDeCapas("src/demo/runners/ejecutar-demo.runner.ts", permitido)).toEqual([]);
    expect(violacionesDeCapas("src/demo/runners/ejecutar-demo.runner.ts", prohibido)).toEqual([
      "src/demo/runners/ejecutar-demo.runner.ts: la capa demo no puede importar @/tools/wiring/entorno.wiring",
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

  test("G5: reporta sufijos fuera de su carpeta, nombres sin kebab-case y rol ausente", () => {
    const rutas = [
      "src/domain/mapeo.service.ts",
      "src/domain/MapeoCampos.ts",
      "src/application/armar.ts",
      "src/infra/output/xlsx.ts",
      "src/domain/types/x.ts",
      "src/tools/fabrica.ts",
      "tests/helpers/flujo.ts",
      "src/domain/mapeo.ts",
      "src/domain/engines/mapeo.policy.ts",
      "src/domain/policies/pii.ts",
      "src/tools/factories/entorno.wiring.ts",
      "src/domain/policies/types/x.type.ts",
      "tests/unit/mapeo.test.ts",
      "src/infra/output/xlsx-writer.adapter.ts",
      "src/application/use-cases/armar-paquete.use-case.ts",
      "src/domain/engines/mapeo.engine.ts",
      "src/tools/wiring/entorno.wiring.ts",
      "tests/unit/mapeo.engine.test.ts",
    ];
    expect(rutas.flatMap(violacionesDeNombre)).toEqual([
      "src/domain/mapeo.service.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "src/domain/MapeoCampos.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "src/application/armar.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "src/infra/output/xlsx.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "src/domain/types/x.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "src/tools/fabrica.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "tests/helpers/flujo.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "src/domain/mapeo.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "src/domain/engines/mapeo.policy.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "src/domain/policies/pii.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "src/tools/factories/entorno.wiring.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "src/domain/policies/types/x.type.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "tests/unit/mapeo.test.ts: el nombre no sigue la tabla de sufijos por carpeta",
    ]);
  });

  test("G13: reporta archivos sueltos y deja pasar los fijados por el PRD y la usuaria", () => {
    const rutas = [
      "src/domain/mapeo.ts",
      "src/tools/entorno.wiring.ts",
      "src/infra/x.adapter.ts",
      "src/x.ts",
      "src/tools/proveedor.ts",
      "src/config/env.ts",
      "src/config/strings.ts",
      "src/domain/engines/mapeo.engine.ts",
    ];
    expect(rutas.flatMap(violacionesDeArchivoSuelto)).toEqual([
      "src/domain/mapeo.ts: archivo suelto en la raíz de su capa; va en una carpeta de rol",
      "src/tools/entorno.wiring.ts: archivo suelto en la raíz de su capa; va en una carpeta de rol",
      "src/infra/x.adapter.ts: archivo suelto en la raíz de su capa; va en una carpeta de rol",
      "src/x.ts: archivo suelto en la raíz de su capa; va en una carpeta de rol",
    ]);
  });

  test("G14: reporta una prueba unitaria sin módulo espejo", () => {
    const fuentes = ["src/domain/engines/mapeo.engine.ts"];
    expect(
      [
        "tests/unit/mapeo.engine.test.ts",
        "tests/unit/mapeo.policy.test.ts",
        "tests/unit/mapeo.test.ts",
      ].flatMap((ruta) => violacionesDeEspejo(ruta, fuentes)),
    ).toEqual([
      "tests/unit/mapeo.policy.test.ts: no existe src/**/mapeo.policy.ts",
      "tests/unit/mapeo.test.ts: la prueba unitaria no nombra un módulo <nombre>.<rol>",
    ]);
  });

  test("G5: reporta un caso de uso que exporta dos funciones", () => {
    const codigo = "export function a(): void {}\nexport async function b(): Promise<void> {}\n";
    expect(violacionesDeCasoDeUso("src/application/use-cases/x.use-case.ts", codigo)).toEqual([
      "src/application/use-cases/x.use-case.ts: un caso de uso exporta exactamente una función",
    ]);
  });

  test("G12: reporta un nombre de herramienta sin prefijo y deja pasar el prefijado", () => {
    expect(referenciasSinPrefijo("x", "Pasa el resultado completo de mapear_campos.")).toEqual([
      "x: nombra una herramienta sin proveedor_",
    ]);
    expect(referenciasSinPrefijo("x", "Pasa el resultado completo de proveedor_mapear_campos.")).toEqual([]);
    expect(textosDe({ a: { b: "con armar_paquete." }, c: () => "" }, "s")).toEqual([
      ["s.a.b", "con armar_paquete."],
    ]);
  });

  test("solo loop/wiring/agente.wiring.ts puede importar infra y env.ts desde loop", () => {
    const codigo =
      'import { createInstructionsLoader } from "@/infra/knowledge/instructions-loader.adapter.ts";\nimport { readAgentEnv } from "@/config/env.ts";\n';
    expect(violacionesDeCapas("src/loop/wiring/agente.wiring.ts", codigo)).toEqual([]);
    expect(violacionesDeCapas("src/loop/services/ejecutar-turno.service.ts", codigo)).toEqual([
      "src/loop/services/ejecutar-turno.service.ts: la capa loop no puede importar @/infra/knowledge/instructions-loader.adapter.ts",
      "src/loop/services/ejecutar-turno.service.ts: la capa loop no puede importar @/config/env.ts",
    ]);
    expect(violacionesDeCapas("src/loop/wiring/otro.wiring.ts", codigo)).toEqual([
      "src/loop/wiring/otro.wiring.ts: la capa loop no puede importar @/infra/knowledge/instructions-loader.adapter.ts",
      "src/loop/wiring/otro.wiring.ts: la capa loop no puede importar @/config/env.ts",
    ]);
  });

  test("agente.wiring.ts llega a las herramientas exportadas, al bucle y al llm", () => {
    const codigo = [
      'import * as proveedor from "@/tools/proveedor.ts";',
      'import { ejecutarTurno } from "@/loop/services/ejecutar-turno.service.ts";',
      'import { createOpenAICompatibleAdapter } from "@/llm/adapters/openai-compatible.adapter.ts";',
    ].join("\n");
    expect(violacionesDeCapas("src/loop/wiring/agente.wiring.ts", codigo)).toEqual([]);
    expect(violacionesDeCapas("src/loop/services/x.service.ts", codigo)).toEqual([
      "src/loop/services/x.service.ts: la capa loop no puede importar @/tools/proveedor.ts",
    ]);
  });

  test("la capa llm solo conoce config pura y zod", () => {
    const codigo =
      'import { readFile } from "node:fs";\nimport type { Sesion } from "@/loop/types/turno.type.ts";\n';
    expect(violacionesDeCapas("src/llm/adapters/openai-compatible.adapter.ts", codigo)).toEqual([
      "src/llm/adapters/openai-compatible.adapter.ts: la capa llm no puede importar node:fs",
      "src/llm/adapters/openai-compatible.adapter.ts: la capa llm no puede importar @/loop/types/turno.type.ts",
    ]);
    const permitido =
      'import { z } from "zod";\nimport { ROL_MENSAJE } from "@/config/constants/llm.constants.ts";\n';
    expect(violacionesDeCapas("src/llm/mappers/x.mapper.ts", permitido)).toEqual([]);
  });

  test("pino solo entra por infra", () => {
    const codigo = 'import pino from "pino";\n';
    expect(violacionesDeCapas("src/infra/logging/logger.adapter.ts", codigo)).toEqual([]);
    expect(violacionesDeCapas("src/domain/utils/x.util.ts", codigo)).toEqual([
      "src/domain/utils/x.util.ts: la capa domain no puede importar pino",
    ]);
    expect(violacionesDeCapas("src/loop/services/x.service.ts", codigo)).toEqual([
      "src/loop/services/x.service.ts: la capa loop no puede importar pino",
    ]);
  });

  test("las herramientas no importan el bucle", () => {
    const codigo = 'import { ejecutarTurno } from "@/loop/services/ejecutar-turno.service.ts";\n';
    expect(violacionesDeCapas("src/tools/factories/x.factory.ts", codigo)).toEqual([
      "src/tools/factories/x.factory.ts: la capa tools no puede importar @/loop/services/ejecutar-turno.service.ts",
    ]);
  });

  test("G5 y G13: roles y sufijos de las capas llm y loop", () => {
    const rutas = [
      "src/llm/decorators/retry.ts",
      "src/llm/adapters/x.service.ts",
      "src/loop/services/x.adapter.ts",
      "src/loop/x.ts",
      "src/llm/decorators/retry.decorator.ts",
      "src/llm/mappers/x.mapper.ts",
      "src/llm/adapters/x.adapter.ts",
      "src/llm/schemas/x.schema.ts",
      "src/llm/types/x.type.ts",
      "src/loop/services/x.service.ts",
      "src/loop/schemas/x.schema.ts",
      "src/loop/types/x.type.ts",
      "src/loop/wiring/agente.wiring.ts",
      "tests/unit/retry.decorator.test.ts",
      "tests/unit/wire-messages.mapper.test.ts",
    ];
    expect(rutas.flatMap(violacionesDeNombre)).toEqual([
      "src/llm/decorators/retry.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "src/llm/adapters/x.service.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "src/loop/services/x.adapter.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "src/loop/x.ts: el nombre no sigue la tabla de sufijos por carpeta",
    ]);
    expect(
      ["src/loop/x.ts", "src/llm/x.ts", "src/loop/services/x.service.ts"].flatMap(violacionesDeArchivoSuelto),
    ).toEqual([
      "src/loop/x.ts: archivo suelto en la raíz de su capa; va en una carpeta de rol",
      "src/llm/x.ts: archivo suelto en la raíz de su capa; va en una carpeta de rol",
    ]);
  });

  test("G6: reporta literales de las familias del agente", () => {
    const codigo = [
      'if (evento.tipo === "turn_end") return;',
      'const fin = { motivo: MOTIVO_FIN.FINAL, tipo: "tool_start" };',
      'if (mensaje.rol === "assistant") return;',
      "if (evento.tipo === TIPO_EVENTO.FIN_TURNO) return;",
    ].join("\n");
    expect(violacionesDeLiteralesDeFamilia("src/loop/services/x.service.ts", codigo)).toEqual([
      "src/loop/services/x.service.ts:1: compara o asigna un código con un literal",
      "src/loop/services/x.service.ts:2: compara o asigna un código con un literal",
      "src/loop/services/x.service.ts:3: compara o asigna un código con un literal",
    ]);
  });

  test("G15: reporta un z.enum que enumera miembros a mano y deja pasar el construido desde la constante", () => {
    const codigo = [
      "const a = z.enum(MODO);",
      "const b = z.enum([...Object.values(MODO), VALOR_OMITIR]);",
      "const c = z.enum([MODO.HABILITADO, MODO.DESHABILITADO, VALOR_OMITIR]);",
      "const d = z.enum([",
      "  ESTADO.LIBRE,",
      "]);",
    ].join("\n");
    expect(violacionesDeEnumAMano("src/config/env.ts", codigo)).toEqual([
      "src/config/env.ts:3: z.enum enumera a mano los miembros de una constante",
      "src/config/env.ts:4: z.enum enumera a mano los miembros de una constante",
    ]);
  });

  test("G16: reporta un esquema exportado sin satisfies y deja pasar los comprobados y los privados", () => {
    const codigo = [
      'import { z } from "zod";',
      "const privadoSchema = z.object({ a: z.string() });",
      "export const tipadoSchema = z",
      "  .object({ a: z.string() })",
      "  .strict() satisfies z.ZodType<A>;",
      "export const cerradoSchema = z.object({",
      "  b: z.string(),",
      "}) satisfies z.ZodType<B>;",
      "export const sueltoSchema = z.object({",
      "  c: z.string(),",
      "});",
      "export const argsHerramienta = { c: z.string() };",
    ].join("\n");
    expect(violacionesDeEsquemaSinTipo("src/loop/schemas/x.schema.ts", codigo)).toEqual([
      "src/loop/schemas/x.schema.ts: sueltoSchema no se comprueba contra su tipo con satisfies z.ZodType<T>",
    ]);
    expect(violacionesDeEsquemaSinTipo("src/loop/services/x.service.ts", codigo)).toEqual([]);
  });

  test("reporta un módulo que docs/estructura.md no nombra", () => {
    const fuentes = ["src/loop/services/nuevo-paso.service.ts", "src/loop/services/presupuesto.service.ts"];
    expect(modulosSinDocumentar(fuentes, "presupuesto de tokens (`presupuesto`)")).toEqual([
      "loop/services/nuevo-paso: no aparece en docs/estructura.md",
    ]);
  });

  test("reporta un archivo en una capa no declarada", () => {
    expect(violacionesDeCapas("src/varios/x.ts", "export const x = 1;\n")).toEqual([
      "src/varios/x.ts: pertenece a una capa no declarada (desconocida)",
    ]);
  });

  test("solo http/wiring/server.wiring.ts importa infra, env.ts y el wiring del agente desde http", () => {
    const codigo = [
      'import { createLogger } from "@/infra/logging/logger.adapter.ts";',
      'import { readServerEnv } from "@/config/env.ts";',
      'import { crearAgente } from "@/loop/wiring/agente.wiring.ts";',
      'import { join } from "node:path";',
    ].join("\n");
    expect(violacionesDeCapas("src/http/wiring/server.wiring.ts", codigo)).toEqual([]);
    expect(violacionesDeCapas("src/http/routes/chat.route.ts", codigo)).toEqual([
      "src/http/routes/chat.route.ts: la capa http no puede importar @/infra/logging/logger.adapter.ts",
      "src/http/routes/chat.route.ts: la capa http no puede importar @/config/env.ts",
      "src/http/routes/chat.route.ts: la capa http no puede importar @/loop/wiring/agente.wiring.ts",
      "src/http/routes/chat.route.ts: la capa http no puede importar node:path",
    ]);
    expect(violacionesDeCapas("src/http/wiring/otro.wiring.ts", codigo)).toHaveLength(4);
  });

  test("hono solo entra por la capa http y su wiring", () => {
    const codigo = 'import { Hono } from "hono";\n';
    expect(violacionesDeCapas("src/http/routes/health.route.ts", codigo)).toEqual([]);
    expect(violacionesDeCapas("src/http/wiring/server.wiring.ts", codigo)).toEqual([]);
    expect(
      [
        "src/loop/services/x.service.ts",
        "src/llm/adapters/x.adapter.ts",
        "src/domain/utils/x.util.ts",
        "src/infra/logging/x.adapter.ts",
      ].flatMap((ruta) => violacionesDeCapas(ruta, codigo)),
    ).toEqual([
      "src/loop/services/x.service.ts: la capa loop no puede importar hono",
      "src/llm/adapters/x.adapter.ts: la capa llm no puede importar hono",
      "src/domain/utils/x.util.ts: la capa domain no puede importar hono",
      "src/infra/logging/x.adapter.ts: la capa infra no puede importar hono",
    ]);
  });

  test("ninguna capa interior importa http", () => {
    const codigo = 'import type { HealthResponse } from "@/http/types/api.type.ts";\n';
    expect(violacionesDeCapas("src/loop/services/x.service.ts", codigo)).toEqual([
      "src/loop/services/x.service.ts: la capa loop no puede importar @/http/types/api.type.ts",
    ]);
    expect(violacionesDeCapas("src/infra/x/x.adapter.ts", codigo)).toEqual([
      "src/infra/x/x.adapter.ts: la capa infra no puede importar @/http/types/api.type.ts",
    ]);
  });

  test("src/server.ts solo llega al wiring http y a node:", () => {
    const permitido =
      'import { join } from "node:path";\nimport { startServer } from "@/http/wiring/server.wiring.ts";\n';
    const prohibido = 'import { registerChatRoute } from "@/http/routes/chat.route.ts";\n';
    expect(violacionesDeCapas("src/server.ts", permitido)).toEqual([]);
    expect(violacionesDeCapas("src/server.ts", prohibido)).toEqual([
      "src/server.ts: la capa servidor no puede importar @/http/routes/chat.route.ts",
    ]);
  });

  test("la capa cli llega a dominio, config, env.ts, zod, node:, eventsource-parser y tipos de http", () => {
    const codigo = [
      'import { createParser } from "eventsource-parser";',
      'import { z } from "zod";',
      'import { join } from "node:path";',
      'import { conFrontmatter } from "@/domain/builders/modulo.builder.ts";',
      'import { readAgentEnv } from "@/config/env.ts";',
      'import { TEXTO_MODULO } from "@/config/strings.ts";',
      'import type { ArchivoModulo } from "@/cli/types/modulo.type.ts";',
      'import type { HealthResponse } from "@/http/types/api.type.ts";',
    ].join("\n");
    expect(violacionesDeCapas("src/cli/runners/x.runner.ts", codigo)).toEqual([]);
    expect(violacionesDeHttpEnCli("src/cli/runners/x.runner.ts", codigo)).toEqual([]);
  });

  test("la capa cli no importa infra, loop, llm, la herramienta exportada ni hono", () => {
    const codigo = [
      'import { createLogger } from "@/infra/logging/logger.adapter.ts";',
      'import { ejecutarTurno } from "@/loop/services/ejecutar-turno.service.ts";',
      'import { createOpenAICompatibleAdapter } from "@/llm/adapters/openai-compatible.adapter.ts";',
      'import { leer_solicitud } from "@/tools/proveedor.ts";',
      'import { Hono } from "hono";',
    ].join("\n");
    expect(violacionesDeCapas("src/cli/runners/x.runner.ts", codigo)).toEqual([
      "src/cli/runners/x.runner.ts: la capa cli no puede importar @/infra/logging/logger.adapter.ts",
      "src/cli/runners/x.runner.ts: la capa cli no puede importar @/loop/services/ejecutar-turno.service.ts",
      "src/cli/runners/x.runner.ts: la capa cli no puede importar @/llm/adapters/openai-compatible.adapter.ts",
      "src/cli/runners/x.runner.ts: la capa cli no puede importar @/tools/proveedor.ts",
      "src/cli/runners/x.runner.ts: la capa cli no puede importar hono",
    ]);
  });

  test("la capa cli solo toma tipos de http/types con import type", () => {
    const codigo = [
      'import { RUTA } from "@/http/types/api.type.ts";',
      'import { formatearSse } from "@/http/services/sse.service.ts";',
      'import type { ChatBody } from "@/http/schemas/chat.schema.ts";',
      'import type { HealthResponse } from "@/http/types/api.type.ts";',
    ].join("\n");
    expect(violacionesDeHttpEnCli("src/cli/runners/x.runner.ts", codigo)).toEqual([
      "src/cli/runners/x.runner.ts: la capa cli solo importa tipos de http/types con import type: @/http/types/api.type.ts",
      "src/cli/runners/x.runner.ts: la capa cli solo importa tipos de http/types con import type: @/http/services/sse.service.ts",
      "src/cli/runners/x.runner.ts: la capa cli solo importa tipos de http/types con import type: @/http/schemas/chat.schema.ts",
    ]);
    expect(violacionesDeHttpEnCli("src/http/routes/x.route.ts", codigo)).toEqual([]);
  });

  test("ninguna otra capa importa cli", () => {
    const codigo = 'import { generarModulo } from "@/cli/runners/generar-modulo.runner.ts";\n';
    expect(
      [
        "src/domain/builders/x.builder.ts",
        "src/tools/factories/x.factory.ts",
        "src/demo/runners/x.runner.ts",
        "src/http/routes/x.route.ts",
        "src/loop/services/x.service.ts",
      ].flatMap((ruta) => violacionesDeCapas(ruta, codigo)),
    ).toEqual([
      "src/domain/builders/x.builder.ts: la capa domain no puede importar @/cli/runners/generar-modulo.runner.ts",
      "src/tools/factories/x.factory.ts: la capa tools no puede importar @/cli/runners/generar-modulo.runner.ts",
      "src/demo/runners/x.runner.ts: la capa demo no puede importar @/cli/runners/generar-modulo.runner.ts",
      "src/http/routes/x.route.ts: la capa http no puede importar @/cli/runners/generar-modulo.runner.ts",
      "src/loop/services/x.service.ts: la capa loop no puede importar @/cli/runners/generar-modulo.runner.ts",
    ]);
  });

  test("G5 y G13: roles y sufijos de la capa cli", () => {
    const rutas = [
      "src/cli/runners/x.ts",
      "src/cli/x.ts",
      "src/cli/runners/x.runner.ts",
      "src/cli/schemas/x.schema.ts",
      "src/cli/types/x.type.ts",
    ];
    expect(rutas.flatMap(violacionesDeNombre)).toEqual([
      "src/cli/runners/x.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "src/cli/x.ts: el nombre no sigue la tabla de sufijos por carpeta",
    ]);
    expect(rutas.flatMap(violacionesDeArchivoSuelto)).toEqual([
      "src/cli/x.ts: archivo suelto en la raíz de su capa; va en una carpeta de rol",
    ]);
  });

  test("la capa modulo solo reexporta @/tools/proveedor.ts", () => {
    const permitido = 'export { leer_solicitud, simular_envio } from "@/tools/proveedor.ts";\n';
    const prohibido = [
      'export { crearHerramientas } from "@/tools/factories/herramientas.factory.ts";',
      'import { createLogger } from "@/infra/logging/logger.adapter.ts";',
      'import { readToolEnv } from "@/config/env.ts";',
      'import { join } from "node:path";',
    ].join("\n");
    expect(violacionesDeCapas(HERRAMIENTAS_DEL_MODULO, permitido)).toEqual([]);
    expect(violacionesDeCapas(HERRAMIENTAS_DEL_MODULO, prohibido)).toEqual([
      "modulo/tools/proveedor.ts: la capa modulo no puede importar @/tools/factories/herramientas.factory.ts",
      "modulo/tools/proveedor.ts: la capa modulo no puede importar @/infra/logging/logger.adapter.ts",
      "modulo/tools/proveedor.ts: la capa modulo no puede importar @/config/env.ts",
      "modulo/tools/proveedor.ts: la capa modulo no puede importar node:path",
    ]);
  });

  test("G5: en modulo/ el único .ts es tools/proveedor.ts", () => {
    const rutas = [HERRAMIENTAS_DEL_MODULO, "modulo/tools/otra.ts", "modulo/proveedor.ts"];
    expect(rutas.flatMap(violacionesDeNombre)).toEqual([
      "modulo/tools/otra.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "modulo/proveedor.ts: el nombre no sigue la tabla de sufijos por carpeta",
    ]);
  });

  test("G5 y G13: roles y sufijos de la capa http y de src/server.ts", () => {
    const rutas = [
      "src/http/routes/chat.ts",
      "src/http/suelto.ts",
      "src/http/routes/chat.route.ts",
      "src/http/middlewares/access.middleware.ts",
      "src/http/services/sse.service.ts",
      "src/http/schemas/chat.schema.ts",
      "src/http/types/api.type.ts",
      "src/http/wiring/server.wiring.ts",
      "src/server.ts",
    ];
    expect(rutas.flatMap(violacionesDeNombre)).toEqual([
      "src/http/routes/chat.ts: el nombre no sigue la tabla de sufijos por carpeta",
      "src/http/suelto.ts: el nombre no sigue la tabla de sufijos por carpeta",
    ]);
    expect(rutas.flatMap(violacionesDeArchivoSuelto)).toEqual([
      "src/http/suelto.ts: archivo suelto en la raíz de su capa; va en una carpeta de rol",
    ]);
  });
});
