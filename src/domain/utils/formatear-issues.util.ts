import { FIN_DE_ORACION, SEPARADOR_ISSUES } from "@/config/constants/text.constants.ts";
import { TEXTO_COMUN } from "@/config/strings.ts";
import type { IssueDeValidacion } from "@/domain/types/validacion.type.ts";

function describirIssue(issue: IssueDeValidacion): string {
  const ruta = issue.path.length === 0 ? TEXTO_COMUN.raiz : issue.path.map(String).join(".");
  return `${ruta}: ${issue.message}`;
}

function sinFinDeOracion(texto: string): string {
  return texto.endsWith(FIN_DE_ORACION) ? texto.slice(0, -FIN_DE_ORACION.length) : texto;
}

export function formatearIssues(issues: readonly IssueDeValidacion[], maximo: number): string {
  const partes = issues.slice(0, maximo).map(describirIssue);
  const ultima = partes.length - 1;
  return partes
    .map((parte, indice) => (indice < ultima ? sinFinDeOracion(parte) : parte))
    .join(SEPARADOR_ISSUES);
}
