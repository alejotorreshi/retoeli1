import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ARCHIVO_REGLAS } from "@/config/constants/files.constants.ts";
import { MAX_ISSUES_REGLAS } from "@/config/constants/limits.constants.ts";
import { TEXTO_CONOCIMIENTO } from "@/config/strings.ts";
import type { Reglas } from "@/domain/types/reglas.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";
import { formatearIssues } from "@/domain/utils/formatear-issues.util.ts";
import { fallo } from "@/domain/utils/resultado.util.ts";
import { validarTextosDeReglas } from "@/domain/validar-reglas.ts";
import { parseJson, readText } from "@/infra/fs/fs.util.ts";
import { rulesSchema } from "@/infra/knowledge/schemas/rules.schema.ts";

export const DEFAULT_KNOWLEDGE_DIRECTORY = fileURLToPath(new URL("../../knowledge/", import.meta.url));

function reglasInvalidas(detalle: string): Resultado<Reglas> {
  return fallo(CODIGO_ERROR.REGLAS_INVALIDAS, { detalle: `${ARCHIVO_REGLAS}: ${detalle}` });
}

function detalleDe(issues: readonly z.core.$ZodIssue[]): string {
  return issues.length === 0
    ? TEXTO_CONOCIMIENTO.esquemaNoCumplido
    : formatearIssues(issues, MAX_ISSUES_REGLAS);
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
