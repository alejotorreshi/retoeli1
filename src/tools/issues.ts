import type { z } from "zod";
import { MAX_ISSUES_ARGS } from "../config/constantes.ts";

export function formatearIssues(issues: readonly z.core.$ZodIssue[]): string {
  return issues
    .slice(0, MAX_ISSUES_ARGS)
    .map((issue) => {
      const ruta = issue.path.length === 0 ? "(raíz)" : issue.path.map(String).join(".");
      return `${ruta}: ${issue.message}`;
    })
    .join("; ");
}
