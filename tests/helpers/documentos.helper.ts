import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { VARIABLES_CLAVE } from "@tests/helpers/costo.helper.ts";
import { VARIABLE_SECRETO_TOKEN } from "@/config/constants/http.constants.ts";

const PATRON_ENLACE = /\]\(([^)\s]+)\)/g;
const PATRON_EXTERNO = /^(https?:|mailto:|#)/;
const SEPARADOR_ANCLA = "#";
const EXTENSION_MARKDOWN = ".md";

export const VARIABLES_SECRETAS: readonly string[] = [
  ...VARIABLES_CLAVE,
  VARIABLE_SECRETO_TOKEN,
  "ACCESS_CODE",
  "PREFLIGHT_ACCESS_CODE",
];

const PATRON_ASIGNACION_SECRETA = new RegExp(
  `\\b(?:${VARIABLES_SECRETAS.join("|")})\\s*=\\s*["']?[^\\s"'\`<]`,
);

export function leerDocumento(raiz: string, ruta: string): string {
  const absoluta = join(raiz, ruta);
  return existsSync(absoluta) ? readFileSync(absoluta, "utf8") : "";
}

export function enlacesRelativos(texto: string): string[] {
  return [...texto.matchAll(PATRON_ENLACE)]
    .flatMap((coincidencia) => (coincidencia[1] === undefined ? [] : [coincidencia[1]]))
    .filter((destino) => !PATRON_EXTERNO.test(destino))
    .map((destino) => destino.split(SEPARADOR_ANCLA)[0] ?? destino);
}

export function destinosResueltos(raiz: string, archivo: string): string[] {
  const base = dirname(join(raiz, archivo));
  return enlacesRelativos(leerDocumento(raiz, archivo)).map((destino) => join(base, destino));
}

export function enlacesRotos(raiz: string, archivo: string, tolerados: readonly string[] = []): string[] {
  const permitidos = new Set(tolerados.map((ruta) => join(raiz, ruta)));
  return destinosResueltos(raiz, archivo).filter(
    (destino) => !existsSync(destino) && !permitidos.has(destino),
  );
}

export function asignacionesSecretas(texto: string): string[] {
  return texto.split("\n").filter((linea) => PATRON_ASIGNACION_SECRETA.test(linea));
}

export function documentosMarkdown(raiz: string, carpeta: string): string[] {
  return readdirSync(join(raiz, carpeta), { recursive: true, encoding: "utf8" })
    .filter((ruta) => ruta.endsWith(EXTENSION_MARKDOWN))
    .map((ruta) => join(carpeta, ruta))
    .sort();
}
