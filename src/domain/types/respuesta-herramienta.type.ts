import type { Parcial } from "@/domain/types/resultado.type.ts";

export type FalloSerializable = {
  readonly codigo: string;
  readonly error: string;
  readonly parcial?: Parcial;
};

export type CuerpoFallo = {
  readonly ok: false;
  readonly error: string;
  readonly codigo: string;
  readonly parcial?: Parcial;
  readonly resumen?: string;
};
