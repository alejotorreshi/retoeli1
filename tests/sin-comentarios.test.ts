import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  encontrarComentarios,
  encontrarComentariosCss,
  encontrarComentariosHtml,
} from "@tests/helpers/comentarios.helper.ts";
import type { Comentario } from "@tests/helpers/types/comentarios.type.ts";

const RAIZ = join(import.meta.dir, "..");

const CARPETAS_FUERA_DE_WEB = ["web/dist/", "node_modules/"];

function normalizar(rutas: readonly string[]): string[] {
  return rutas.map((ruta) => ruta.split("\\").join("/"));
}

function escanear(patron: string): string[] {
  return normalizar([...new Bun.Glob(patron).scanSync({ cwd: RAIZ })]);
}

function listarFuentesWeb(): string[] {
  if (!existsSync(join(RAIZ, "web"))) return [];
  const rutas = ["web/**/*.ts", "web/**/*.tsx", "web/**/*.css", "web/index.html"].flatMap(escanear);
  return rutas.filter((ruta) => !CARPETAS_FUERA_DE_WEB.some((carpeta) => ruta.includes(carpeta)));
}

function listarFuentes(): string[] {
  const rutas = ["src", "tests", "modulo"]
    .filter((carpeta) => existsSync(join(RAIZ, carpeta)))
    .flatMap((carpeta) => escanear(`${carpeta}/**/*.ts`));
  if (existsSync(join(RAIZ, "demo.ts"))) rutas.push("demo.ts");
  return [...rutas, ...listarFuentesWeb()].sort();
}

function comentariosDe(ruta: string, codigo: string): Comentario[] {
  if (ruta.endsWith(".css")) return encontrarComentariosCss(codigo);
  if (ruta.endsWith(".html")) return encontrarComentariosHtml(codigo);
  return encontrarComentarios(codigo);
}

describe("sin comentarios en el código real", () => {
  test("src/, tests/, modulo/, demo.ts y web/ no tienen comentarios", () => {
    const hallazgos = listarFuentes().flatMap((ruta) =>
      comentariosDe(ruta, readFileSync(join(RAIZ, ruta), "utf8")).map(
        (comentario) => `${ruta}:${comentario.linea}: comentario de ${comentario.tipo}`,
      ),
    );
    expect(hallazgos).toEqual([]);
  });

  test("el escáner encuentra archivos que revisar", () => {
    expect(listarFuentes()).toContain("tests/sin-comentarios.test.ts");
  });

  test("el escáner recorre modulo/", () => {
    expect(listarFuentes()).toContain("modulo/tools/proveedor.ts");
  });

  test("el escáner recorre web/ con TS, TSX, CSS e index.html y salta web/dist", () => {
    const web = listarFuentesWeb();
    expect(web).toContain("web/src/app.tsx");
    expect(web).toContain("web/vite.config.ts");
    expect(web).toContain("web/index.html");
    expect(web.filter((ruta) => ruta.startsWith("web/dist/"))).toEqual([]);
  });
});

describe("el escáner muerde sobre fuentes de muestra", () => {
  test("reporta un comentario de línea", () => {
    expect(encontrarComentarios("const a = 1;\nconst b = 2; // nota\n")).toEqual([
      { linea: 2, tipo: "linea" },
    ]);
  });

  test("reporta un comentario de bloque", () => {
    expect(encontrarComentarios("/* bloque */\nconst b = 2;\n")).toEqual([{ linea: 1, tipo: "bloque" }]);
  });

  test("no reporta una URL con doble barra dentro de cadenas", () => {
    const codigo = "const a = \"https://ejemplo.co\";\nconst b = 'http://x/*y';\nconst c = `ftp://z`;\n";
    expect(encontrarComentarios(codigo)).toEqual([]);
  });

  test("no reporta una expresión regular con barras escapadas", () => {
    expect(encontrarComentarios('const r = /https?:\\/\\/[^"]+/g;\nconst d = a / b / c;\n')).toEqual([]);
  });

  test("sigue el código dentro de una interpolación de plantilla", () => {
    const codigo = ["const t = `", "{valor ? `x", "{'//'}` : { a: 1 }.a}`; // tras plantilla\n"].join("$");
    expect(encontrarComentarios(codigo)).toEqual([{ linea: 1, tipo: "linea" }]);
  });
});

describe("el escáner de web/ muerde sobre fuentes de muestra", () => {
  test("reporta un comentario dentro de JSX", () => {
    const codigo = "export function A() {\n  return <p>{/* nota */}{texto}</p>;\n}\n";
    expect(encontrarComentarios(codigo)).toEqual([{ linea: 2, tipo: "bloque" }]);
  });

  test("reporta un comentario de CSS y no una barra doble dentro de url ni de una cadena", () => {
    const codigo = [
      ".a { color: var(--texto); }",
      "/* bloque */",
      '.b { background: url("https://x/*y"); content: "//"; }',
      ".c { margin: 0; } /* al final */",
    ].join("\n");
    expect(encontrarComentariosCss(codigo)).toEqual([
      { linea: 2, tipo: "bloque" },
      { linea: 4, tipo: "bloque" },
    ]);
  });

  test("reporta un comentario de HTML", () => {
    const codigo = '<!doctype html>\n<html lang="es">\n  <!-- nota -->\n</html>\n';
    expect(encontrarComentariosHtml(codigo)).toEqual([{ linea: 3, tipo: "bloque" }]);
  });
});
