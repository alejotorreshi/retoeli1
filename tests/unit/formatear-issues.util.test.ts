import { describe, expect, test } from "bun:test";
import { FIN_DE_ORACION, SEPARADOR_ISSUES } from "@/config/constants/text.constants.ts";
import { TEXTO_COMUN, TEXTO_ENV } from "@/config/strings.ts";
import type { IssueDeValidacion } from "@/domain/types/validacion.type.ts";
import { formatearIssues } from "@/domain/utils/formatear-issues.util.ts";

const MAXIMO = 5;

function issue(path: readonly PropertyKey[], message: string): IssueDeValidacion {
  return { path, message };
}

function sinPuntoFinal(texto: string): string {
  return texto.slice(0, -FIN_DE_ORACION.length);
}

const filas: readonly (readonly [string, readonly IssueDeValidacion[], number, string])[] = [
  ["sin issues da un texto vacío", [], MAXIMO, ""],
  [
    "un solo issue conserva su propio final",
    [issue(["LLM_BASE_URL"], "Mensaje.")],
    MAXIMO,
    "LLM_BASE_URL: Mensaje.",
  ],
  [
    "dos issues con punto: solo el último lo conserva",
    [issue(["A"], "Uno."), issue(["B"], "Dos.")],
    MAXIMO,
    `A: Uno${SEPARADOR_ISSUES}B: Dos.`,
  ],
  [
    "dos issues sin punto, al estilo de zod, quedan igual",
    [issue(["A"], "Uno"), issue(["B"], "Dos")],
    MAXIMO,
    `A: Uno${SEPARADOR_ISSUES}B: Dos`,
  ],
  [
    "solo el último con punto lo conserva",
    [issue(["A"], "Uno"), issue(["B"], "Dos.")],
    MAXIMO,
    `A: Uno${SEPARADOR_ISSUES}B: Dos.`,
  ],
  [
    "la ruta vacía usa la raíz y una ruta con índice se une con puntos",
    [issue([], "Raíz."), issue(["x", 0], "Y.")],
    MAXIMO,
    `${TEXTO_COMUN.raiz}: Raíz${SEPARADOR_ISSUES}x.0: Y.`,
  ],
  [
    "un mensaje con un separador interno lo conserva",
    [issue(["A"], TEXTO_ENV.urlNoSegura), issue(["B"], TEXTO_ENV.urlNoSegura)],
    MAXIMO,
    `A: ${sinPuntoFinal(TEXTO_ENV.urlNoSegura)}${SEPARADOR_ISSUES}B: ${TEXTO_ENV.urlNoSegura}`,
  ],
  [
    "el máximo corta los issues y el último incluido conserva su punto",
    [issue(["A"], "Uno."), issue(["B"], "Dos."), issue(["C"], "Tres.")],
    2,
    `A: Uno${SEPARADOR_ISSUES}B: Dos.`,
  ],
];

describe("formatearIssues (WR-01)", () => {
  for (const [nombre, issues, maximo, esperado] of filas) {
    test(nombre, () => {
      const resultado = formatearIssues(issues, maximo);
      expect(resultado).toBe(esperado);
      expect(resultado).not.toContain(`${FIN_DE_ORACION}${SEPARADOR_ISSUES}`);
      expect(resultado).not.toContain(`${FIN_DE_ORACION}${FIN_DE_ORACION}`);
    });
  }

  test("no muta los issues que recibe", () => {
    const issues = [issue(["A"], "Uno."), issue(["B"], "Dos.")];
    const copia = structuredClone(issues);
    formatearIssues(issues, MAXIMO);
    expect(issues).toEqual(copia);
  });
});
