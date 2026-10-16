import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const PATRON_ENLACE = /\]\(([^)\s]+)\)/g;
const PATRON_EXTERNO = /^(https?:|mailto:|#)/;
const SEPARADOR_ANCLA = "#";

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
