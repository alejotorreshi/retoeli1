import { beforeAll, describe, expect, test } from "bun:test";
import { detectarAmbiguos, elegirPlantilla } from "@/domain/solicitud.ts";
import type { TipoPlantilla } from "@/domain/types/plantilla-caso.type.ts";
import type { Reglas } from "@/domain/types/reglas.type.ts";
import type { CampoSolicitado, Formato, PlantillasPresentes } from "@/domain/types/solicitud.type.ts";
import { cargarReglas, DIRECTORIO_CONOCIMIENTO_POR_DEFECTO } from "@/infra/knowledge/rules-loader.adapter.ts";

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

let reglas: Reglas;

beforeAll(async () => {
  const cargadas = await cargarReglas(DIRECTORIO_CONOCIMIENTO_POR_DEFECTO);
  if (!cargadas.ok) throw new Error("reglas.json del repositorio inválido");
  reglas = cargadas.data;
});

function campos(...etiquetas: string[]): CampoSolicitado[] {
  return etiquetas.map((etiqueta) => ({ etiqueta, obligatorio: true }));
}

describe("detectarAmbiguos: etiquetas genéricas (SOLI-02, D-20)", () => {
  const equivalentes: readonly (readonly [string, string])[] = [
    ["CO", "NIT"],
    ["EC", "RUC"],
    ["PE", "RUC"],
    ["PA", "RUC"],
    ["HN", "RTN"],
  ];

  for (const [pais, propuesta] of equivalentes) {
    test(`${pais} propone ${propuesta}`, () => {
      expect(detectarAmbiguos(campos("Identificación tributaria"), reglas, pais)).toEqual([
        { etiqueta: "Identificación tributaria", estado: "requiere_confirmacion", propuesta },
      ]);
    });
  }

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
