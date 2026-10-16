import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { clavesLlm, fugasDeEvidencia } from "@tests/helpers/costo.helper.ts";
import {
  asignacionesSecretas,
  documentosMarkdown,
  enlacesRelativos,
  enlacesRotos,
  leerDocumento,
  VARIABLES_SECRETAS,
} from "@tests/helpers/documentos.helper.ts";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { ESTADO_EVIDENCIA_COSTO, RUTA_EVIDENCIA_COSTO } from "@/config/constants/costo.constants.ts";
import { LONGITUD_MINIMA_CODIGO_ACCESO, RUTA_API } from "@/config/constants/http.constants.ts";
import { SEPARACION_MINIMA_SSE_MS } from "@/config/constants/preflight.constants.ts";

const RAIZ = join(import.meta.dir, "..", "..");
const README = "README.md";
const ENTREGA = "docs/entrega.md";
const SOLUCION = "SOLUCION.md";
const ENV_EJEMPLO = ".env.example";
const CARPETA_DOCS = "docs";
const ESTRUCTURA = "docs/estructura.md";
const README_MODULO = "modulo/README.md";
const WORKFLOW_CI = "https://github.com/alejotorreshi/retoeli1/actions/workflows/ci.yml";
const BADGE_CI = `${WORKFLOW_CI}/badge.svg?branch=main`;
const URL_RENDER = "https://registro-proveedor-bfnt.onrender.com";
const MARCADOR_CODIGO = "__CODIGO_ACCESO__";
const MODELOS_RETIRADOS = ["deepseek-chat", "deepseek-reasoner"];
const PATRON_LINEA_CODIGO = /^Código de acceso: `([^`]+)`/m;
const PATRON_VARIABLE_ENV = /^([A-Z][A-Z0-9_]*)=/gm;
const PATRON_TAREA = /^- \[[ x]\] /m;
const PATRON_NOMBRE_SECRETO = /(_API_KEY|_SECRET|ACCESS_CODE)$/;
const PATRON_NOMBRE_ASIGNADO = /[A-Z][A-Z0-9_]*(?==)/;
const ASIGNACIONES_DE_CONTROL = [
  "LLM_API_KEY=sk-control-a",
  "export DEEPSEEK_API_KEY=sk-control-b",
  "`LLM_FALLBACK_API_KEY=sk-control-c`",
  "- ACCESS_TOKEN_SECRET=secreto-de-control-0000000000000000",
  'ACCESS_CODE="codigo-de-control"',
  "* PREFLIGHT_ACCESS_CODE='codigo-de-control'",
];
const COMANDOS = [
  "bun install",
  "cp .env.example .env",
  "bun run dev",
  "bun run demo.ts",
  "bun test",
  "bun run check",
  "bun run audit",
  "bun run test:vivo",
  "bun run modulo",
  "bun run preflight",
  "--guion",
  "PREFLIGHT_ACCESS_CODE",
  "bun run costo",
  "opencode.json",
  "render.yaml",
  "Dockerfile",
];
const ENLACES_README = [
  SOLUCION,
  "docs/arquitectura.md",
  "docs/convenciones.md",
  ENTREGA,
  "modulo/README.md",
  "docs/estructura.md",
  "docs/limites-del-demo.md",
  RUTA_EVIDENCIA_COSTO,
];
const PENDIENTES_ENTREGA = [
  "colaboradores",
  "ACCESS_CODE",
  "rotar",
  "CI",
  "Render",
  "eli-qa",
  "ensayo",
  "SOLUCION.md §9",
  "bun run preflight",
];
const CORRIDA_ANTERIOR_ENTREGA = ["víspera", "corrida anterior", "ENVIO-SIMULADO.md", "out/<caso>/"];
const VISPERA = "víspera";
const ANTES_DE_LA_DEFENSA = "10 minutos antes";
const SIN_GUION = "sin `--guion`";

function leer(ruta: string): string {
  return leerDocumento(RAIZ, ruta);
}

function primeraLineaConTexto(texto: string): string {
  return texto.split("\n").find((linea) => linea.trim() !== "") ?? "";
}

function variablesDeEnvEjemplo(): string[] {
  return [...leer(ENV_EJEMPLO).matchAll(PATRON_VARIABLE_ENV)].flatMap((coincidencia) =>
    coincidencia[1] === undefined ? [] : [coincidencia[1]],
  );
}

function codigoDeAcceso(texto: string): string {
  return PATRON_LINEA_CODIGO.exec(texto)?.[1] ?? "";
}

function versionesDeDependencias(): Array<[string, string]> {
  const manifiesto: { dependencies?: Record<string, string> } = JSON.parse(leer("package.json"));
  return Object.entries(manifiesto.dependencies ?? {});
}

function estadoDeEvidencia(): string {
  const evidencia: { estado?: string } = JSON.parse(leer(RUTA_EVIDENCIA_COSTO));
  return evidencia.estado ?? "";
}

describe(`${README} (DOC-01, DEMO-05)`, () => {
  test("la primera línea es el badge de la CI que enlaza al workflow", () => {
    const linea = primeraLineaConTexto(leer(README));
    expect(linea.startsWith("[![")).toBe(true);
    expect(linea.endsWith(`](${BADGE_CI})](${WORKFLOW_CI})`)).toBe(true);
  });

  test("da el link público y un código de acceso real que debe coincidir con ACCESS_CODE de Render", () => {
    const readme = leer(README);
    const codigo = codigoDeAcceso(readme);
    expect(readme.includes(URL_RENDER)).toBe(true);
    expect(codigo.length >= LONGITUD_MINIMA_CODIGO_ACCESO).toBe(true);
    expect(codigo === MARCADOR_CODIGO).toBe(false);
    expect(readme.includes(MARCADOR_CODIGO)).toBe(false);
    expect(readme.includes("debe coincidir con `ACCESS_CODE` de Render")).toBe(true);
  });

  test("explica cada comando de arranque, pruebas, pre-flight, módulo y despliegue", () => {
    const readme = leer(README);
    expect(COMANDOS.filter((comando) => !readme.includes(comando))).toEqual([]);
  });

  test("enlaza la solución, la documentación de continuidad, la entrega y el módulo", () => {
    const readme = leer(README);
    expect(ENLACES_README.filter((destino) => !enlacesRelativos(readme).includes(destino))).toEqual([]);
  });

  test(`nombra entre backticks cada variable de ${ENV_EJEMPLO}`, () => {
    const readme = leer(README);
    const variables = variablesDeEnvEjemplo();
    expect(variables.length).toBeGreaterThan(0);
    expect(variables.filter((variable) => !readme.includes(`\`${variable}\``))).toEqual([]);
  });

  test("documenta cada ruta de la API y cada evento SSE", () => {
    const readme = leer(README);
    expect(Object.values(RUTA_API).filter((ruta) => !readme.includes(`\`${ruta}\``))).toEqual([]);
    expect(Object.values(TIPO_EVENTO).filter((evento) => !readme.includes(`\`${evento}\``))).toEqual([]);
    expect(readme.includes("needsConfirmation")).toBe(true);
  });

  test("cita las versiones de las dependencias de package.json", () => {
    const readme = leer(README);
    const faltantes = versionesDeDependencias().filter(
      ([nombre, version]) => !readme.includes(`${nombre} ${version}`),
    );
    expect(faltantes).toEqual([]);
  });
});

describe(`${ENTREGA} (D-99)`, () => {
  test("lista los pendientes humanos como tareas", () => {
    const entrega = leer(ENTREGA);
    expect(entrega.includes("## Pendientes humanos")).toBe(true);
    expect(PATRON_TAREA.test(entrega)).toBe(true);
    expect(PENDIENTES_ENTREGA.filter((pendiente) => !entrega.includes(pendiente))).toEqual([]);
  });

  test("pide correr el costo solo si la evidencia quedó pendiente", () => {
    const entrega = leer(ENTREGA);
    const pendiente = estadoDeEvidencia() === ESTADO_EVIDENCIA_COSTO.PENDIENTE;
    expect(entrega.length).toBeGreaterThan(0);
    expect(entrega.includes("bun run costo")).toBe(pendiente);
  });

  test("programa el --guion la víspera y avisa de los archivos de la corrida anterior (G-04-2)", () => {
    const entrega = leer(ENTREGA);
    const lineaAntesDeLaDefensa = entrega.split("\n").find((linea) => linea.includes(ANTES_DE_LA_DEFENSA));
    expect(CORRIDA_ANTERIOR_ENTREGA.filter((mencion) => !entrega.includes(mencion))).toEqual([]);
    expect(lineaAntesDeLaDefensa).toBeDefined();
    expect(lineaAntesDeLaDefensa?.includes(SIN_GUION)).toBe(true);
    expect(leer(README).includes(VISPERA)).toBe(true);
  });
});

describe("el pre-flight documentado (IN-01)", () => {
  test.each([README, ESTRUCTURA])("%s nombra el umbral del SSE con el valor de su constante", (archivo) => {
    expect(leer(archivo)).toContain(`al menos ${SEPARACION_MINIMA_SSE_MS} ms`);
  });
});

describe("enlaces y secretos de la documentación de entrega", () => {
  test(`el escáner de secretos cubre cada variable secreta de ${ENV_EJEMPLO}`, () => {
    const variables = variablesDeEnvEjemplo();
    const secretas = variables.filter((nombre) => PATRON_NOMBRE_SECRETO.test(nombre));
    expect(secretas.length).toBeGreaterThan(0);
    expect(secretas.filter((nombre) => !VARIABLES_SECRETAS.includes(nombre))).toEqual([]);
    expect(VARIABLES_SECRETAS.filter((nombre) => !variables.includes(nombre))).toEqual([]);
  });

  test("el escáner detecta una asignación con valor en cada forma y para cada variable secreta", () => {
    expect(asignacionesSecretas(ASIGNACIONES_DE_CONTROL.join("\n"))).toEqual(ASIGNACIONES_DE_CONTROL);
    const cubiertas = VARIABLES_SECRETAS.filter((nombre) =>
      ASIGNACIONES_DE_CONTROL.some((linea) => PATRON_NOMBRE_ASIGNADO.exec(linea)?.[0] === nombre),
    );
    expect(cubiertas).toEqual([...VARIABLES_SECRETAS]);
  });

  test(`el escáner no marca las variables vacías de ${ENV_EJEMPLO} ni la línea del código de acceso del ${README}`, () => {
    expect(asignacionesSecretas(leer(ENV_EJEMPLO))).toEqual([]);
    expect(codigoDeAcceso(leer(README)).length).toBeGreaterThan(0);
    expect(asignacionesSecretas(leer(README))).toEqual([]);
  });

  test.each([README, ENTREGA])("cada enlace relativo de %s apunta a una ruta que existe", (archivo) => {
    expect(leer(archivo).length).toBeGreaterThan(0);
    expect(enlacesRotos(RAIZ, archivo, [SOLUCION])).toEqual([]);
  });

  test.each([README, ...documentosMarkdown(RAIZ, CARPETA_DOCS), README_MODULO])(
    "%s no trae modelos retirados, claves, secretos ni datos del maestro",
    async (archivo) => {
      const texto = leer(archivo);
      const sensibles = await sensiblesDelProyecto(RAIZ);
      expect(texto.length).toBeGreaterThan(0);
      expect(MODELOS_RETIRADOS.filter((modelo) => texto.includes(modelo))).toEqual([]);
      expect(asignacionesSecretas(texto).length).toBe(0);
      expect(fugasDeEvidencia(texto, sensibles, clavesLlm(process.env))).toEqual([]);
    },
  );
});
