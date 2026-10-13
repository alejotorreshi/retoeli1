import { CODIGOS_CON_DETALLE } from "@/config/constants/errors.constants.ts";
import { MENSAJE_ERROR, TEXTO_ERROR } from "@/config/strings.ts";
import type { CodigoError } from "@/domain/errores.ts";

export type Parcial = Readonly<Record<string, unknown>>;

export type Exito<D> = { readonly ok: true; readonly data: D };

export type Fallo = {
  readonly ok: false;
  readonly codigo: CodigoError;
  readonly error: string;
  readonly parcial?: Parcial;
};

export type Resultado<D> = Exito<D> | Fallo;

export type OpcionesFallo = { readonly detalle?: string; readonly parcial?: Parcial };

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
