import type { Comentario } from "@tests/helpers/types/comentarios.type.ts";

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

export function encontrarComentarios(codigo: string): Comentario[] {
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

function lineaEn(codigo: string, indice: number): number {
  return codigo.slice(0, indice).split("\n").length;
}

export function encontrarComentariosCss(codigo: string): Comentario[] {
  const comentarios: Comentario[] = [];
  let indice = 0;
  while (indice < codigo.length) {
    const caracter = codigo.charAt(indice);
    if (caracter === '"' || caracter === "'") {
      indice = finDeCadena(codigo, indice, caracter);
    } else if (caracter === "/" && codigo.charAt(indice + 1) === "*") {
      comentarios.push({ linea: lineaEn(codigo, indice), tipo: "bloque" });
      const cierre = codigo.indexOf("*/", indice + 2);
      indice = cierre === -1 ? codigo.length : cierre + 2;
    } else indice += 1;
  }
  return comentarios;
}

export function encontrarComentariosHtml(codigo: string): Comentario[] {
  return codigo
    .split("\n")
    .flatMap((linea, indice) =>
      linea.includes("<!--") ? [{ linea: indice + 1, tipo: "bloque" as const }] : [],
    );
}
