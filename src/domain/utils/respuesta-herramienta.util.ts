import type { CuerpoFallo, FalloSerializable } from "@/domain/types/respuesta-herramienta.type.ts";

export function cuerpoDeFallo(fallo: FalloSerializable, resumen: string | null): CuerpoFallo {
  const base: CuerpoFallo = { ok: false, error: fallo.error, codigo: fallo.codigo };
  const conParcial: CuerpoFallo = fallo.parcial === undefined ? base : { ...base, parcial: fallo.parcial };
  return resumen === null ? conParcial : { ...conParcial, resumen };
}
