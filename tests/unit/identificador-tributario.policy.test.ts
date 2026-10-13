import { beforeAll, describe, expect, test } from "bun:test";
import {
  etiquetasGenericas,
  identificadorDelPais,
} from "@/domain/policies/identificador-tributario.policy.ts";
import type { Reglas } from "@/domain/types/reglas.type.ts";
import { DEFAULT_KNOWLEDGE_DIRECTORY, loadRules } from "@/infra/knowledge/rules-loader.adapter.ts";

let reglas: Reglas;

beforeAll(async () => {
  const cargadas = await loadRules(DEFAULT_KNOWLEDGE_DIRECTORY);
  if (!cargadas.ok) throw new Error("reglas.json del repositorio inválido");
  reglas = cargadas.data;
});

describe("identificadorDelPais: equivalente tributario por país (SOLI-02, D-20)", () => {
  const equivalentes: readonly (readonly [string, string])[] = [
    ["CO", "NIT"],
    ["EC", "RUC"],
    ["PE", "RUC"],
    ["PA", "RUC"],
    ["HN", "RTN"],
  ];

  for (const [pais, propuesta] of equivalentes) {
    test(`${pais} propone ${propuesta}`, () => {
      expect(identificadorDelPais(reglas, pais)).toBe(propuesta);
    });
  }

  test("un país sin equivalente y una clave del prototipo dan null", () => {
    expect(identificadorDelPais(reglas, "MX")).toBeNull();
    expect(identificadorDelPais(reglas, "constructor")).toBeNull();
  });
});

describe("etiquetasGenericas", () => {
  test("normaliza las etiquetas genéricas de las reglas como el glosario", () => {
    const genericas = etiquetasGenericas(reglas);
    expect(genericas.size).toBe(reglas.etiquetas_genericas.length);
    expect(genericas.has("identificacion tributaria")).toBe(true);
    expect(genericas.has("Identificación tributaria")).toBe(false);
  });
});
