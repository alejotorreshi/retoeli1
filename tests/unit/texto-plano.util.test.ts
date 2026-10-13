import { describe, expect, test } from "bun:test";
import { SEPARADOR_CELDA_PLANO } from "@/config/constants/text.constants.ts";
import { limpiarMarkdown } from "@/domain/utils/texto-plano.util.ts";

describe("limpiarMarkdown deja el texto final en texto plano (D-60, D-46)", () => {
  test("quita las negritas con ** y con __", () => {
    expect(limpiarMarkdown("**Resumen** del caso y __pendientes__")).toBe("Resumen del caso y pendientes");
  });

  test.each([1, 2, 3, 4, 5, 6])("quita la marca de encabezado de nivel %i al inicio de línea", (nivel) => {
    expect(limpiarMarkdown(`Inicio\n${"#".repeat(nivel)} Estado del paquete\nFin`)).toBe(
      "Inicio\nEstado del paquete\nFin",
    );
  });

  test("conserva un # que no abre la línea", () => {
    expect(limpiarMarkdown("Ticket #42 pendiente")).toBe("Ticket #42 pendiente");
  });

  test("descarta la fila separadora de una tabla, con y sin bordes ni alineación", () => {
    expect(limpiarMarkdown("| A | B |\n|---|:---:|\nfin")).toBe(`A${SEPARADOR_CELDA_PLANO}B\nfin`);
    expect(limpiarMarkdown("A | B\n--- | ---\nfin")).toBe(`A${SEPARADOR_CELDA_PLANO}B\nfin`);
  });

  test("convierte las barras de una fila en el separador plano y quita los bordes", () => {
    expect(limpiarMarkdown("| NIT | ••••3456 |")).toBe(`NIT${SEPARADOR_CELDA_PLANO}••••3456`);
    expect(limpiarMarkdown("| Campo | Valor | Estado |")).toBe(
      ["Campo", "Valor", "Estado"].join(SEPARADOR_CELDA_PLANO),
    );
  });

  test("el ejemplo completo no deja **, # al inicio de línea ni |", () => {
    const limpio = limpiarMarkdown("**Resumen**\n# Estado\n| Campo | Valor |\n|---|---|\n| NIT | ••••3456 |");
    expect(limpio).toBe(
      `Resumen\nEstado\nCampo${SEPARADOR_CELDA_PLANO}Valor\nNIT${SEPARADOR_CELDA_PLANO}••••3456`,
    );
  });

  test("el texto plano con viñetas, una pregunta y un valor enmascarado no cambia", () => {
    const plano =
      "Caso ec-corp-andina, out/ec-corp-andina/:\n- 13 llenos, 1 faltante, 1 por confirmar\n- NIT: ••••3456\n---\n¿Confirmas el envío simulado de ec-corp-andina?";
    expect(limpiarMarkdown(plano)).toBe(plano);
  });
});
