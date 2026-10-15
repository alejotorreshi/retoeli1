import type { Importacion } from "@tests/helpers/types/importacion.type.ts";

const IMPORTACION =
  /(?:^|\n)\s*(?:import|export)\s+(type\s+)?(?:[^"';]*?\sfrom\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

export const ENUM_DE_TS = /\benum\s+[A-Z]/;

export const LITERAL_DE_REGEX =
  /(?:^|[=(,:[!&|?{;]|\breturn|\btypeof)\s*\/(?![/*])(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n[])+\/[dgimsuyv]*|\bnew\s+RegExp\s*\(/;

export const TEXTO_LEGIBLE = /[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}/;

const ANTES_DE_REGEX = new Set(["", "(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";"]);

export const EXPORTA_TIPO = /^export\s+(?:type|interface)\s|^export\s+(?:type\s+)?\{[^}]*\btype\b/;

export const VALOR_EN_ARCHIVO_DE_TIPOS =
  /^export\s+(?:declare\s+)?(?:async\s+)?(?:const|let|var|function|class|default|enum)\b/;

export const IMPORTA_VALOR = /^import\s+(?!type\b)/;

export function nombreDePaquete(especificador: string): string {
  const partes = especificador.split("/");
  return especificador.startsWith("@") ? partes.slice(0, 2).join("/") : (partes[0] ?? especificador);
}

export function extraerImportacionesConTipo(codigo: string): Importacion[] {
  const importaciones: Importacion[] = [];
  for (const coincidencia of codigo.matchAll(IMPORTACION)) {
    const especificador = coincidencia[2] ?? coincidencia[3];
    if (especificador !== undefined) {
      importaciones.push({ especificador, soloTipo: coincidencia[1] !== undefined });
    }
  }
  return importaciones;
}

export function extraerImportaciones(codigo: string): string[] {
  return extraerImportacionesConTipo(codigo).map((importacion) => importacion.especificador);
}

export function lineasQueCumplen(ruta: string, codigo: string, patron: RegExp, motivo: string): string[] {
  return codigo
    .split("\n")
    .flatMap((linea, indice) => (patron.test(linea) ? [`${ruta}:${indice + 1}: ${motivo}`] : []));
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

export function literalesDeTexto(codigo: string): string[] {
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
