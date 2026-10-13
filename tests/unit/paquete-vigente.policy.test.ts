import { describe, expect, test } from "bun:test";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import {
  archivosDelPaquete,
  diferenciasDelPaquete,
  paqueteAlDia,
  soportesDelPaquete,
} from "@/domain/policies/paquete-vigente.policy.ts";
import type { Checklist } from "@/domain/types/checklist.type.ts";
import type { SoporteEvaluado } from "@/domain/types/soportes.type.ts";

const FORMULARIO = "formulario.xlsx";
const BORRADOR = "Adjuntamos el formulario.\n";

function soporte(tipo: string, estado: SoporteEvaluado["estado"], archivo: string | null): SoporteEvaluado {
  return { tipo, estado, vigencia_hasta: null, archivo, aviso: null, pais_emisor: null, aviso_emisor: null };
}

const CHECKLIST: Checklist = {
  fecha_ejecucion: "2026-09-03",
  listo_para_firma: false,
  bloqueos: [],
  motivos_bloqueo: [],
  soportes: [
    soporte("rut", ESTADO_SOPORTE.PRESENTE, "rut-ficticio.txt"),
    soporte("parafiscales", ESTADO_SOPORTE.VENCIDO, "parafiscales-ficticio.txt"),
    soporte("certificado_tributario", ESTADO_SOPORTE.AUSENTE, null),
  ],
  faltantes: [],
  requiere_confirmacion: [],
  confirmaciones_al_cliente: [],
  confirmaciones_internas: [],
  avisos_emisor_al_cliente: [],
};

const COMPLETO = [
  "borrador-correo.md",
  "checklist.md",
  FORMULARIO,
  "parafiscales-ficticio.txt",
  "rut-ficticio.txt",
];

function esperadoDe(checklist: Checklist) {
  return { archivos: archivosDelPaquete(checklist, FORMULARIO), borrador: BORRADOR };
}

describe("soportesDelPaquete y archivosDelPaquete (IN-01)", () => {
  test("los soportes del paquete son los archivos no nulos, sin repetir", () => {
    const repetido = [...CHECKLIST.soportes, soporte("rut", ESTADO_SOPORTE.PRESENTE, "rut-ficticio.txt")];
    expect(soportesDelPaquete(repetido)).toEqual(["rut-ficticio.txt", "parafiscales-ficticio.txt"]);
  });

  test("el paquete esperado suma el formulario, los soportes, el checklist y el borrador", () => {
    expect([...archivosDelPaquete(CHECKLIST, FORMULARIO)].sort()).toEqual(COMPLETO);
  });
});

describe("diferenciasDelPaquete (CR-01)", () => {
  test("un paquete con todos sus archivos y el mismo borrador está al día", () => {
    const diferencias = diferenciasDelPaquete(esperadoDe(CHECKLIST), {
      listado: COMPLETO,
      borrador: BORRADOR,
    });
    expect(diferencias).toEqual({
      archivos_faltantes: [],
      archivos_sobrantes: [],
      archivos_desactualizados: [],
    });
    expect(paqueteAlDia(diferencias)).toBe(true);
  });

  test("reporta el soporte presente que falta en el listado", () => {
    const listado = COMPLETO.filter((archivo) => archivo !== "rut-ficticio.txt");
    const diferencias = diferenciasDelPaquete(esperadoDe(CHECKLIST), { listado, borrador: BORRADOR });
    expect(diferencias.archivos_faltantes).toEqual(["rut-ficticio.txt"]);
    expect(paqueteAlDia(diferencias)).toBe(false);
  });

  test("un soporte renovado sale como faltante y la copia anterior como sobrante", () => {
    const renovado: Checklist = {
      ...CHECKLIST,
      soportes: [soporte("rut", ESTADO_SOPORTE.PRESENTE, "rut-renovado.txt")],
    };
    const listado = ["borrador-correo.md", "checklist.md", FORMULARIO, "rut-ficticio.txt"];
    expect(diferenciasDelPaquete(esperadoDe(renovado), { listado, borrador: BORRADOR })).toEqual({
      archivos_faltantes: ["rut-renovado.txt"],
      archivos_sobrantes: ["rut-ficticio.txt"],
      archivos_desactualizados: [],
    });
  });

  test("un soporte que sale del repositorio deja su archivo como sobrante", () => {
    const sinRut: Checklist = {
      ...CHECKLIST,
      soportes: [soporte("rut", ESTADO_SOPORTE.AUSENTE, null), ...CHECKLIST.soportes.slice(1)],
    };
    const diferencias = diferenciasDelPaquete(esperadoDe(sinRut), { listado: COMPLETO, borrador: BORRADOR });
    expect(diferencias.archivos_sobrantes).toEqual(["rut-ficticio.txt"]);
    expect(paqueteAlDia(diferencias)).toBe(false);
  });

  test("un borrador distinto del que se armaría hoy queda desactualizado", () => {
    const diferencias = diferenciasDelPaquete(esperadoDe(CHECKLIST), {
      listado: COMPLETO,
      borrador: "El formulario queda listo para la firma.\n",
    });
    expect(diferencias.archivos_desactualizados).toEqual(["borrador-correo.md"]);
    expect(paqueteAlDia(diferencias)).toBe(false);
  });

  test("un borrador borrado sale solo como faltante", () => {
    const listado = COMPLETO.filter((archivo) => archivo !== "borrador-correo.md");
    expect(diferenciasDelPaquete(esperadoDe(CHECKLIST), { listado, borrador: null })).toEqual({
      archivos_faltantes: ["borrador-correo.md"],
      archivos_sobrantes: [],
      archivos_desactualizados: [],
    });
  });
});
