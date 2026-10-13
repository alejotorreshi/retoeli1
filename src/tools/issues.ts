import type { z } from "zod";
import { MAX_ISSUES_ARGS } from "@/config/constants/limits.constants.ts";
import { TEXTO_COMUN } from "@/config/strings.ts";

export function formatearIssues(issues: readonly z.core.$ZodIssue[]): string {
  return issues
    .slice(0, MAX_ISSUES_ARGS)
    .map((issue) => {
      const ruta = issue.path.length === 0 ? TEXTO_COMUN.raiz : issue.path.map(String).join(".");
      return `${ruta}: ${issue.message}`;
    })
    .join("; ");
}
