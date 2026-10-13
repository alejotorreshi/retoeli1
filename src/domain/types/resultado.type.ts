import type { CodigoError } from "@/domain/types/errores.type.ts";
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
