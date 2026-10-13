import { join } from "node:path";
import { PATRON_PLANTILLA_CONOCIMIENTO } from "@/config/constants/patterns.constants.ts";
import { TEXTO_CONOCIMIENTO } from "@/config/strings.ts";
import { plantillaInvalida } from "@/domain/motor-plantillas.ts";
import { exito } from "@/domain/resultado.ts";
import type { ClavePlantilla, Reglas } from "@/domain/types/reglas.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";
import { readText } from "@/infra/fs/fs.util.ts";

export async function loadKnowledgeTemplate(
  directorioConocimiento: string,
  reglas: Reglas,
  clave: ClavePlantilla,
): Promise<Resultado<string>> {
  const ruta = reglas.plantillas[clave];
  if (!PATRON_PLANTILLA_CONOCIMIENTO.test(ruta))
    return plantillaInvalida(ruta, TEXTO_CONOCIMIENTO.rutaNoPermitida);
  const texto = await readText(join(directorioConocimiento, ruta));
  if (texto === null) {
    return plantillaInvalida(ruta, TEXTO_CONOCIMIENTO.archivoNoLegible);
  }
  return exito(texto);
}
