import { CODIGOS_CON_DETALLE } from "@/config/constants/errors.constants.ts";
import { MENSAJE_ERROR, TEXTO_ERROR } from "@/config/strings.ts";
import type { CodigoError } from "@/domain/types/errores.type.ts";
import type { Exito, Fallo, OpcionesFallo } from "@/domain/types/resultado.type.ts";

export function exito<D>(data: D): Exito<D> {
  return { ok: true, data };
}

function mensajeDe(codigo: CodigoError, detalle: string | undefined): string {
  const base = MENSAJE_ERROR[codigo];
  if (detalle === undefined || detalle === "" || !CODIGOS_CON_DETALLE.has(codigo)) return base;
  return TEXTO_ERROR.conDetalle(base, detalle);
}

export function fallo(codigo: CodigoError, opciones: OpcionesFallo = {}): Fallo {
  const error = mensajeDe(codigo, opciones.detalle);
  if (opciones.parcial === undefined) return { ok: false, codigo, error };
  return { ok: false, codigo, error, parcial: opciones.parcial };
}
