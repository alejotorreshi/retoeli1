import {
  CLAVE_FRONTMATTER,
  DELIMITADOR_FRONTMATTER,
  MODO_AGENTE_MODULO,
  PERMISO_MODULO,
  SANGRIA_YAML,
} from "@/config/constants/modulo.constants.ts";
import { SALTO_DE_LINEA } from "@/config/constants/text.constants.ts";

function bloqueFrontmatter(lineas: readonly string[]): string {
  return [DELIMITADOR_FRONTMATTER, ...lineas, DELIMITADOR_FRONTMATTER]
    .map((linea) => `${linea}${SALTO_DE_LINEA}`)
    .join("");
}

function par(clave: string, valor: string): string {
  return `${clave}: ${valor}`;
}

function textoYaml(texto: string): string {
  return JSON.stringify(texto);
}

export function frontmatterAgente(descripcion: string): string {
  return bloqueFrontmatter([
    par(CLAVE_FRONTMATTER.DESCRIPCION, textoYaml(descripcion)),
    par(CLAVE_FRONTMATTER.MODO, MODO_AGENTE_MODULO),
    `${CLAVE_FRONTMATTER.PERMISO}:`,
    `${SANGRIA_YAML}${par(CLAVE_FRONTMATTER.EDICION, PERMISO_MODULO.DENEGADO)}`,
    `${SANGRIA_YAML}${par(CLAVE_FRONTMATTER.SHELL, PERMISO_MODULO.DENEGADO)}`,
  ]);
}

export function frontmatterSkill(nombre: string, descripcion: string): string {
  return bloqueFrontmatter([
    par(CLAVE_FRONTMATTER.NOMBRE, nombre),
    par(CLAVE_FRONTMATTER.DESCRIPCION, textoYaml(descripcion)),
  ]);
}

export function conFrontmatter(frontmatter: string, cuerpo: Uint8Array): Uint8Array {
  const cabecera = new TextEncoder().encode(frontmatter);
  const contenido = new Uint8Array(cabecera.length + cuerpo.length);
  contenido.set(cabecera, 0);
  contenido.set(cuerpo, cabecera.length);
  return contenido;
}
