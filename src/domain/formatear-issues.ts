import { TEXTO_COMUN } from "@/config/strings.ts";
import type { IssueDeValidacion } from "@/domain/types/validacion.type.ts";

export function formatearIssues(issues: readonly IssueDeValidacion[], maximo: number): string {
  return issues
    .slice(0, maximo)
    .map((issue) => {
      const ruta = issue.path.length === 0 ? TEXTO_COMUN.raiz : issue.path.map(String).join(".");
      return `${ruta}: ${issue.message}`;
    })
    .join("; ");
}
