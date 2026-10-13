import { join } from "node:path";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { PATRON_PLANTILLA_CONOCIMIENTO } from "@/config/constants/patterns.constants.ts";
import type { ClavePlantilla, Reglas } from "@/domain/reglas.ts";
import { exito, fallo, type Resultado } from "@/domain/resultado.ts";
import { leerTexto } from "@/infra/knowledge/reglas.ts";

function plantillaInvalida(ruta: string, problema: string): Resultado<string> {
  return fallo(CODIGO_ERROR.REGLAS_INVALIDAS, { detalle: `la plantilla ${ruta} ${problema}.` });
}

export async function cargarPlantillaTexto(
  directorioConocimiento: string,
  reglas: Reglas,
  clave: ClavePlantilla,
): Promise<Resultado<string>> {
  const ruta = reglas.plantillas[clave];
  if (!PATRON_PLANTILLA_CONOCIMIENTO.test(ruta))
    return plantillaInvalida(ruta, "no tiene una ruta permitida");
  const texto = await leerTexto(join(directorioConocimiento, ruta));
  if (texto === null) {
    return plantillaInvalida(ruta, "no existe, no es un archivo o supera el tamaño permitido");
  }
  return exito(texto);
}
