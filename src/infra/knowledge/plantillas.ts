import { join } from "node:path";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { PATRON_PLANTILLA_CONOCIMIENTO } from "@/config/constants/patterns.constants.ts";
import { TEXTO_CONOCIMIENTO, TEXTO_MOTOR_PLANTILLAS } from "@/config/strings.ts";
import { exito, fallo } from "@/domain/resultado.ts";
import type { ClavePlantilla, Reglas } from "@/domain/types/reglas.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";
import { leerTexto } from "@/infra/knowledge/reglas.ts";

function plantillaInvalida(ruta: string, problema: string): Resultado<string> {
  return fallo(CODIGO_ERROR.REGLAS_INVALIDAS, {
    detalle: TEXTO_MOTOR_PLANTILLAS.plantillaInvalida(ruta, problema),
  });
}

export async function cargarPlantillaTexto(
  directorioConocimiento: string,
  reglas: Reglas,
  clave: ClavePlantilla,
): Promise<Resultado<string>> {
  const ruta = reglas.plantillas[clave];
  if (!PATRON_PLANTILLA_CONOCIMIENTO.test(ruta))
    return plantillaInvalida(ruta, TEXTO_CONOCIMIENTO.rutaNoPermitida);
  const texto = await leerTexto(join(directorioConocimiento, ruta));
  if (texto === null) {
    return plantillaInvalida(ruta, TEXTO_CONOCIMIENTO.archivoNoLegible);
  }
  return exito(texto);
}
