import { beforeAll, describe, expect, test } from "bun:test";
import { detectarAmbiguos } from "@/domain/selectors/solicitud.selector.ts";
import type { Reglas } from "@/domain/types/reglas.type.ts";
import type { CampoSolicitado } from "@/domain/types/solicitud.type.ts";
import { DEFAULT_KNOWLEDGE_DIRECTORY, loadRules } from "@/infra/knowledge/rules-loader.adapter.ts";

let reglas: Reglas;

beforeAll(async () => {
  const cargadas = await loadRules(DEFAULT_KNOWLEDGE_DIRECTORY);
  if (!cargadas.ok) throw new Error("reglas.json del repositorio inválido");
  reglas = cargadas.data;
});

function campos(...etiquetas: string[]): CampoSolicitado[] {
  return etiquetas.map((etiqueta) => ({ etiqueta, obligatorio: true }));
}

describe("detectarAmbiguos: etiquetas genéricas (SOLI-02, D-20)", () => {
  test("marca la etiqueta genérica por confirmar y propone el identificador del país", () => {
    expect(detectarAmbiguos(campos("Identificación tributaria"), reglas, "HN")).toEqual([
      { etiqueta: "Identificación tributaria", estado: "requiere_confirmacion", propuesta: "RTN" },
    ]);
  });

  test("compara con la normalización del glosario y conserva la etiqueta original en orden de plantilla", () => {
    const resultado = detectarAmbiguos(
      campos("NÚMERO DE IDENTIFICACIÓN FISCAL:", "Razón social", "identificacion tributaria *"),
      reglas,
      "EC",
    );
    expect(resultado.map((campo) => campo.etiqueta)).toEqual([
      "NÚMERO DE IDENTIFICACIÓN FISCAL:",
      "identificacion tributaria *",
    ]);
  });

  test("las etiquetas específicas no son ambiguas", () => {
    expect(detectarAmbiguos(campos("NIT", "RUC", "RTN", "Razón social"), reglas, "CO")).toEqual([]);
  });

  test("un país sin equivalente propone null", () => {
    expect(detectarAmbiguos(campos("Identificación tributaria"), reglas, "MX")[0]?.propuesta).toBeNull();
  });

  test("una clave del prototipo como país no se toma como equivalente", () => {
    expect(
      detectarAmbiguos(campos("Identificación tributaria"), reglas, "constructor")[0]?.propuesta,
    ).toBeNull();
  });
});
