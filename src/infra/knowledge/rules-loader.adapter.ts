import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ARCHIVO_REGLAS } from "@/config/constants/files.constants.ts";
import { TEXTO_COMUN, TEXTO_CONOCIMIENTO } from "@/config/strings.ts";
import { fallo } from "@/domain/resultado.ts";
import type { Reglas } from "@/domain/types/reglas.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";
import { validarTextosDeReglas } from "@/domain/validar-reglas.ts";
import { parseJson, readText } from "@/infra/fs/fs.util.ts";
import { rulesSchema } from "@/infra/knowledge/schemas/rules.schema.ts";

export const DEFAULT_KNOWLEDGE_DIRECTORY = fileURLToPath(new URL("../../knowledge/", import.meta.url));

function reglasInvalidas(detalle: string): Resultado<Reglas> {
  return fallo(CODIGO_ERROR.REGLAS_INVALIDAS, { detalle: `${ARCHIVO_REGLAS}: ${detalle}` });
}

function detalleDe(issues: readonly z.core.$ZodIssue[]): string {
  const primero = issues[0];
  if (primero === undefined) return TEXTO_CONOCIMIENTO.esquemaNoCumplido;
  const ruta = primero.path.length === 0 ? TEXTO_COMUN.raiz : primero.path.map(String).join(".");
  return `${ruta}: ${primero.message}`;
}

export async function loadRules(directorio: string): Promise<Resultado<Reglas>> {
  const contenido = await readText(join(directorio, ARCHIVO_REGLAS));
  if (contenido === null) return reglasInvalidas(TEXTO_CONOCIMIENTO.archivoNoLegible);
  const json = parseJson(contenido);
  if (!json.ok) return reglasInvalidas(TEXTO_CONOCIMIENTO.jsonInvalido);
  const validado = rulesSchema.safeParse(json.valor, { error: z.locales.es().localeError });
  if (!validado.success) return reglasInvalidas(detalleDe(validado.error.issues));
  return validarTextosDeReglas(validado.data);
}
