import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { normalizarEtiqueta } from "@/domain/normalizar.ts";
import { exito, fallo } from "@/domain/resultado.ts";
import type { Glosario, IndiceGlosario } from "@/domain/types/mapeo.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";

function agregarSinColision(mapa: Map<string, string>, clave: string, ruta: string): boolean {
  const previa = mapa.get(clave);
  if (previa !== undefined && previa !== ruta) return false;
  mapa.set(clave, ruta);
  return true;
}

export function construirIndiceGlosario(glosario: Glosario): Resultado<IndiceGlosario> {
  const exacto = new Map<string, string>();
  const normalizado = new Map<string, string>();
  for (const [etiqueta, ruta] of Object.entries(glosario)) {
    const sinColision =
      agregarSinColision(exacto, etiqueta.normalize("NFC"), ruta) &&
      agregarSinColision(normalizado, normalizarEtiqueta(etiqueta), ruta);
    if (!sinColision) return fallo(CODIGO_ERROR.DATOS_INVALIDOS);
  }
  return exito({ exacto, normalizado });
}
