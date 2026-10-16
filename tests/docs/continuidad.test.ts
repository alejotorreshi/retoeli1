import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { destinosResueltos, enlacesRotos, leerDocumento } from "@tests/helpers/documentos.helper.ts";

const RAIZ = join(import.meta.dir, "..", "..");
const ARQUITECTURA = "docs/arquitectura.md";
const CONVENCIONES = "docs/convenciones.md";
const ESTRUCTURA = "docs/estructura.md";
const LIMITES = "docs/limites-del-demo.md";
const GUARDIAN_BACKEND = "tests/architecture.test.ts";
const GUARDIAN_WEB = "tests/arquitectura-web.test.ts";
const GUARDIAN_COMENTARIOS = "tests/sin-comentarios.test.ts";
const PATRON_NOMBRE_PRUEBA = /\b(?:test|it|describe)\(\s*["'`]([^"'`]+)/g;
const PATRON_ID_BACKEND = /\bG\d+\b/g;
const PATRON_ID_WEB = /\bW\d+\b/g;
const PATRON_SEPARADOR_PALABRAS = /[^A-Za-z0-9]+/;
const CARPETAS_FUERA_DE_SRC = ["web/", "modulo/", ".opencode/"];
const MENCIONES_CONVENCIONES = [
  ".claude/CLAUDE.md",
  GUARDIAN_BACKEND,
  GUARDIAN_WEB,
  GUARDIAN_COMENTARIOS,
  "Conventional Commits",
  "elianatorres5772 <elianatorres5772@gmail.com>",
  "D-62",
  "D-35",
  ESTRUCTURA,
];

function leer(ruta: string): string {
  return leerDocumento(RAIZ, ruta);
}

function idsDeGuardian(archivo: string, patron: RegExp): string[] {
  const nombres = [...leer(archivo).matchAll(PATRON_NOMBRE_PRUEBA)].flatMap((coincidencia) =>
    coincidencia[1] === undefined ? [] : [coincidencia[1]],
  );
  return [...new Set(nombres.flatMap((nombre) => nombre.match(patron) ?? []))].sort();
}

function carpetasDeSrc(): string[] {
  return readdirSync(join(RAIZ, "src"), { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => entrada.name)
    .sort();
}

function mencionaId(texto: string, id: string): boolean {
  return texto.split(PATRON_SEPARADOR_PALABRAS).includes(id);
}

describe(`${CONVENCIONES} (CAL-05)`, () => {
  test("nombra cada id de guardián que aparece en los nombres de las pruebas guardianas", () => {
    const convenciones = leer(CONVENCIONES);
    const ids = [
      ...idsDeGuardian(GUARDIAN_BACKEND, PATRON_ID_BACKEND),
      ...idsDeGuardian(GUARDIAN_WEB, PATRON_ID_WEB),
    ];
    expect(ids).toContain("G16");
    expect(ids).toContain("W13");
    expect(ids.filter((id) => !mencionaId(convenciones, id))).toEqual([]);
  });

  test("declara su fuente canónica, los guardianes, los commits y el procedimiento D-62", () => {
    const convenciones = leer(CONVENCIONES);
    expect(MENCIONES_CONVENCIONES.filter((mencion) => !convenciones.includes(mencion))).toEqual([]);
  });
});

describe(`${ARQUITECTURA} (CAL-05)`, () => {
  test("nombra entre backticks cada carpeta de src/ y las carpetas de fuera de src/", () => {
    const arquitectura = leer(ARQUITECTURA);
    const carpetas = [...carpetasDeSrc().map((carpeta) => `src/${carpeta}/`), ...CARPETAS_FUERA_DE_SRC];
    expect(carpetas.length).toBeGreaterThan(CARPETAS_FUERA_DE_SRC.length);
    expect(carpetas.filter((carpeta) => !arquitectura.includes(`\`${carpeta}`))).toEqual([]);
  });

  test("trae un diagrama Mermaid y enlaza la estructura, las convenciones y los límites del demo", () => {
    const arquitectura = leer(ARQUITECTURA);
    const destinos = destinosResueltos(RAIZ, ARQUITECTURA);
    expect(arquitectura.includes("```mermaid")).toBe(true);
    expect(
      [ESTRUCTURA, CONVENCIONES, LIMITES].filter((ruta) => !destinos.includes(join(RAIZ, ruta))),
    ).toEqual([]);
  });
});

describe("enlaces de la documentación de continuidad", () => {
  test.each([ARQUITECTURA, CONVENCIONES])(
    "cada enlace relativo de %s apunta a una ruta que existe",
    (archivo) => {
      expect(leer(archivo).length).toBeGreaterThan(0);
      expect(enlacesRotos(RAIZ, archivo)).toEqual([]);
    },
  );
});
