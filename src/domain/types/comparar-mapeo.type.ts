import type { EstadoCampo } from "@/domain/types/reglas.type.ts";
export type ItemMapeo = {
  readonly etiqueta: string;
  readonly estado: EstadoCampo;
  readonly ruta: string | null;
};

export type ComparacionMapeo =
  | { readonly iguales: true }
  | { readonly iguales: false; readonly diferencias: readonly string[] };
