import { PAIS, SEPARADOR_PALABRAS, SEPARADOR_SLUG } from "@web/config/constants/pais.constants.ts";
import { TEXTO_PAIS } from "@web/config/strings.ts";
import type { DatosTarjetaCaso, Pais } from "@web/types/ui.type.ts";

const PAISES_CONOCIDOS: ReadonlySet<string> = new Set(Object.values(PAIS));

export function esPaisConocido(prefijo: string): prefijo is Pais {
  return PAISES_CONOCIDOS.has(prefijo);
}

function conInicialMayuscula(palabra: string): string {
  return `${palabra.charAt(0).toUpperCase()}${palabra.slice(1)}`;
}

function clienteDelResto(resto: string): string {
  return resto
    .split(SEPARADOR_SLUG)
    .filter((palabra) => palabra.length > 0)
    .map(conInicialMayuscula)
    .join(SEPARADOR_PALABRAS);
}

function soloSlug(slug: string): DatosTarjetaCaso {
  return { slug, pais: null, codigo: null, nombrePais: null, cliente: slug };
}

export function datosDeTarjetaCaso(slug: string): DatosTarjetaCaso {
  const corte = slug.indexOf(SEPARADOR_SLUG);
  if (corte < 0) return soloSlug(slug);
  const prefijo = slug.slice(0, corte);
  const cliente = clienteDelResto(slug.slice(corte + 1));
  if (!esPaisConocido(prefijo) || cliente.length === 0) return soloSlug(slug);
  return { slug, pais: prefijo, codigo: prefijo.toUpperCase(), nombrePais: TEXTO_PAIS[prefijo], cliente };
}
