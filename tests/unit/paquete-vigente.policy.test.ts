import { describe, expect, test } from "bun:test";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { archivosFaltantesEnPaquete } from "@/domain/policies/paquete-vigente.policy.ts";
import type { Checklist } from "@/domain/types/checklist.type.ts";
import type { SoporteEvaluado } from "@/domain/types/soportes.type.ts";

const FORMULARIO = "formulario.xlsx";

function soporte(tipo: string, estado: SoporteEvaluado["estado"], archivo: string | null): SoporteEvaluado {
  return { tipo, estado, vigencia_hasta: null, archivo, aviso: null, pais_emisor: null, aviso_emisor: null };
}

const CHECKLIST: Checklist = {
  fecha_ejecucion: "2026-09-03",
  listo_para_firma: false,
  bloqueos: [],
  soportes: [
    soporte("rut", ESTADO_SOPORTE.PRESENTE, "rut-ficticio.txt"),
    soporte("parafiscales", ESTADO_SOPORTE.VENCIDO, "parafiscales-ficticio.txt"),
    soporte("certificado_tributario", ESTADO_SOPORTE.AUSENTE, null),
  ],
  faltantes: [],
  requiere_confirmacion: [],
  confirmaciones_al_cliente: [],
};

const COMPLETO = [
  "borrador-correo.md",
  "checklist.md",
  FORMULARIO,
  "parafiscales-ficticio.txt",
  "rut-ficticio.txt",
];

describe("archivosFaltantesEnPaquete (CR-01)", () => {
  test("un paquete con el formulario y todos los soportes con archivo no tiene faltantes", () => {
    expect(archivosFaltantesEnPaquete(CHECKLIST, FORMULARIO, COMPLETO)).toEqual([]);
  });

  test("reporta el soporte presente que falta en el listado", () => {
    const listado = COMPLETO.filter((archivo) => archivo !== "rut-ficticio.txt");
    expect(archivosFaltantesEnPaquete(CHECKLIST, FORMULARIO, listado)).toEqual(["rut-ficticio.txt"]);
  });

  test("reporta el formulario y el soporte vencido que faltan en el listado", () => {
    expect(archivosFaltantesEnPaquete(CHECKLIST, FORMULARIO, ["rut-ficticio.txt"])).toEqual([
      FORMULARIO,
      "parafiscales-ficticio.txt",
    ]);
  });

  test("un soporte renovado después de armar el paquete sale como faltante", () => {
    const renovado: Checklist = {
      ...CHECKLIST,
      soportes: [soporte("rut", ESTADO_SOPORTE.PRESENTE, "rut-renovado.txt")],
    };
    expect(archivosFaltantesEnPaquete(renovado, FORMULARIO, COMPLETO)).toEqual(["rut-renovado.txt"]);
  });
});
