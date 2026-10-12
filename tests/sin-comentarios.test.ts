import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = join(import.meta.dir, "..");

const PRECEDE_EXPRESION = new Set([
  "",
  "(",
  ",",
  "=",
  ":",
  "[",
  "!",
  "&",
  "|",
  "?",
  "{",
  "}",
  ";",
  "+",
  "-",
  "*",
  "%",
  "<",
  ">",
  "~",
  "^",
]);

const PALABRAS_ANTES_DE_EXPRESION =
  /(?:^|[^\w$])(?:return|typeof|case|in|of|delete|void|throw|new|await|yield)$/;

type Comentario = { linea: number; tipo: "linea" | "bloque" };

type Marco = { tipo: "codigo"; llaves: number } | { tipo: "plantilla" };

function ultimoSignificativo(codigo: string, hasta: number): string {
  let indice = hasta - 1;
  while (indice >= 0 && /\s/.test(codigo.charAt(indice))) indice -= 1;
  return indice < 0 ? "" : codigo.charAt(indice);
}

function abreExpresionRegular(codigo: string, posicion: number): boolean {
  const previo = ultimoSignificativo(codigo, posicion);
  if (PRECEDE_EXPRESION.has(previo)) return true;
  return PALABRAS_ANTES_DE_EXPRESION.test(codigo.slice(Math.max(0, posicion - 12), posicion).trimEnd());
}

function finDeCadena(codigo: string, inicio: number, comilla: string): number {
  let indice = inicio + 1;
  while (indice < codigo.length && codigo.charAt(indice) !== comilla && codigo.charAt(indice) !== "\n") {
    indice += codigo.charAt(indice) === "\\" ? 2 : 1;
  }
  return indice + 1;
}

function finDeExpresionRegular(codigo: string, inicio: number): number {
  let indice = inicio + 1;
  let enClase = false;
  while (indice < codigo.length && codigo.charAt(indice) !== "\n") {
    const caracter = codigo.charAt(indice);
    if (caracter === "\\") {
      indice += 2;
      continue;
    }
    if (caracter === "[") enClase = true;
    if (caracter === "]") enClase = false;
    if (caracter === "/" && !enClase) return indice + 1;
    indice += 1;
  }
  return indice;
}

function encontrarComentarios(codigo: string): Comentario[] {
  const comentarios: Comentario[] = [];
  const pila: Marco[] = [{ tipo: "codigo", llaves: 0 }];
  let linea = 1;
  let indice = 0;
  const avanzarHasta = (destino: number): void => {
    for (let paso = indice; paso < destino && paso < codigo.length; paso += 1) {
      if (codigo.charAt(paso) === "\n") linea += 1;
    }
    indice = destino;
  };
  while (indice < codigo.length) {
    const marco = pila[pila.length - 1] ?? { tipo: "codigo", llaves: 0 };
    const caracter = codigo.charAt(indice);
    const siguiente = codigo.charAt(indice + 1);
    if (marco.tipo === "plantilla") {
      if (caracter === "\\") avanzarHasta(indice + 2);
      else if (caracter === "`") {
        pila.pop();
        avanzarHasta(indice + 1);
      } else if (caracter === "$" && siguiente === "{") {
        pila.push({ tipo: "codigo", llaves: 0 });
        avanzarHasta(indice + 2);
      } else avanzarHasta(indice + 1);
      continue;
    }
    if (caracter === "/" && siguiente === "/") {
      comentarios.push({ linea, tipo: "linea" });
      const salto = codigo.indexOf("\n", indice);
      avanzarHasta(salto === -1 ? codigo.length : salto);
    } else if (caracter === "/" && siguiente === "*") {
      comentarios.push({ linea, tipo: "bloque" });
      const cierre = codigo.indexOf("*/", indice + 2);
      avanzarHasta(cierre === -1 ? codigo.length : cierre + 2);
    } else if (caracter === "/" && abreExpresionRegular(codigo, indice)) {
      avanzarHasta(finDeExpresionRegular(codigo, indice));
    } else if (caracter === '"' || caracter === "'") {
      avanzarHasta(finDeCadena(codigo, indice, caracter));
    } else if (caracter === "`") {
      pila.push({ tipo: "plantilla" });
      avanzarHasta(indice + 1);
    } else if (caracter === "{") {
      marco.llaves += 1;
      avanzarHasta(indice + 1);
    } else if (caracter === "}" && marco.llaves === 0 && pila.length > 1) {
      pila.pop();
      avanzarHasta(indice + 1);
    } else {
      if (caracter === "}") marco.llaves -= 1;
      avanzarHasta(indice + 1);
    }
  }
  return comentarios;
}

function listarFuentes(): string[] {
  const rutas = ["src", "tests"]
    .filter((carpeta) => existsSync(join(RAIZ, carpeta)))
    .flatMap((carpeta) => [...new Bun.Glob(`${carpeta}/**/*.ts`).scanSync({ cwd: RAIZ })]);
  if (existsSync(join(RAIZ, "demo.ts"))) rutas.push("demo.ts");
  return rutas.map((ruta) => ruta.split("\\").join("/")).sort();
}

describe("sin comentarios en el código real", () => {
  test("src/, tests/ y demo.ts no tienen comentarios", () => {
    const hallazgos = listarFuentes().flatMap((ruta) =>
      encontrarComentarios(readFileSync(join(RAIZ, ruta), "utf8")).map(
        (comentario) => `${ruta}:${comentario.linea}: comentario de ${comentario.tipo}`,
      ),
    );
    expect(hallazgos).toEqual([]);
  });

  test("el escáner encuentra archivos que revisar", () => {
    expect(listarFuentes()).toContain("tests/sin-comentarios.test.ts");
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
