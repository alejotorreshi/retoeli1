import { describe, expect, test } from "bun:test";
import { elegirPlantilla } from "@/domain/policies/plantilla-caso.policy.ts";
import type { TipoPlantilla } from "@/domain/types/plantilla-caso.type.ts";
import type { Formato, PlantillasPresentes } from "@/domain/types/solicitud.type.ts";

const SOLO_CELDAS: PlantillasPresentes = { celdas: true, campos: false };
const SOLO_CAMPOS: PlantillasPresentes = { celdas: false, campos: true };
const AMBAS: PlantillasPresentes = { celdas: true, campos: true };
const NINGUNA: PlantillasPresentes = { celdas: false, campos: false };
const FORMATOS: readonly Formato[] = ["xlsx", "pdf", "portal"];

type Fila = {
  readonly nombre: string;
  readonly casos: readonly (readonly [Formato, PlantillasPresentes, TipoPlantilla | null])[];
};

const MATRIZ: readonly Fila[] = [
  { nombre: "solo plantilla-celdas.json con xlsx da celdas", casos: [["xlsx", SOLO_CELDAS, "celdas"]] },
  { nombre: "solo plantilla-campos.json con pdf da campos", casos: [["pdf", SOLO_CAMPOS, "campos"]] },
  {
    nombre: "portal acepta cualquiera de los dos archivos",
    casos: [
      ["portal", SOLO_CELDAS, "celdas"],
      ["portal", SOLO_CAMPOS, "campos"],
    ],
  },
  { nombre: "solo plantilla-campos.json con xlsx no es válida", casos: [["xlsx", SOLO_CAMPOS, null]] },
  {
    nombre: "solo plantilla-celdas.json con pdf usa sus etiquetas en orden",
    casos: [["pdf", SOLO_CELDAS, "celdas"]],
  },
  {
    nombre: "con ambos archivos decide el formato: xlsx usa celdas, pdf y portal usan campos (IN-07)",
    casos: [
      ["xlsx", AMBAS, "celdas"],
      ["pdf", AMBAS, "campos"],
      ["portal", AMBAS, "campos"],
    ],
  },
  {
    nombre: "sin ningún archivo no es válida con cualquier formato",
    casos: FORMATOS.map((formato) => [formato, NINGUNA, null] as const),
  },
];

describe("elegirPlantilla: matriz de selección de plantilla (SOLI-01)", () => {
  test("la matriz tiene las seis filas de 01-02 con la fila de ambos archivos separada", () => {
    expect(MATRIZ).toHaveLength(7);
  });

  for (const fila of MATRIZ) {
    test(fila.nombre, () => {
      for (const [formato, presentes, esperado] of fila.casos) {
        expect(elegirPlantilla(formato, presentes)).toBe(esperado);
      }
    });
  }
});
