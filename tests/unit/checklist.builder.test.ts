import { describe, expect, test } from "bun:test";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import {
  construirChecklist,
  construirDatosChecklist,
  motivosDeBloqueo,
} from "@/domain/builders/checklist.builder.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";
import type { SoporteEvaluado } from "@/domain/types/soportes.type.ts";

const HOY: FechaISO = "2026-09-03";
const CASO = { caso: "zz-caso-ficticio", cliente: "Cliente Ficticio" };
const DESCONOCIDOS = ["zz_desconocido", "constructor", "__proto__", "toString"] as const;

function soporte(
  tipo: string,
  estado: SoporteEvaluado["estado"],
  archivo: string | null,
  vigencia: string | null,
): SoporteEvaluado {
  return {
    tipo,
    estado,
    vigencia_hasta: vigencia,
    archivo,
    aviso: null,
    pais_emisor: null,
    aviso_emisor: null,
  };
}

const SOPORTES: readonly SoporteEvaluado[] = [
  soporte("rut", ESTADO_SOPORTE.PRESENTE, "rut-ficticio.txt", null),
  soporte("certificado_cumplimiento_tributario", ESTADO_SOPORTE.AUSENTE, null, null),
  soporte("parafiscales", ESTADO_SOPORTE.VENCIDO, "parafiscales-ficticio.txt", "2026-08-31"),
];

describe("checklist.builder: nombres legibles solo en la salida para personas (GC-2, G-01-H4c)", () => {
  test("construirChecklist conserva los ids crudos en bloqueos y en el orden de los soportes", () => {
    expect(construirChecklist(SOPORTES, [], HOY).bloqueos).toEqual([
      "ausente: certificado_cumplimiento_tributario",
      "vencido: parafiscales (2026-08-31)",
    ]);
  });

  test("motivosDeBloqueo da los mismos bloqueos en el mismo orden con el nombre del soporte", () => {
    expect(motivosDeBloqueo(SOPORTES)).toEqual([
      "ausente: Certificado de cumplimiento tributario",
      "vencido: Certificación de aportes parafiscales (2026-08-31)",
    ]);
  });

  test("construirDatosChecklist toma los motivos con nombre y no los bloqueos crudos", () => {
    const datos = construirDatosChecklist(CASO, construirChecklist(SOPORTES, [], HOY));
    expect(datos.motivos).toEqual([
      { motivo: "ausente: Certificado de cumplimiento tributario" },
      { motivo: "vencido: Certificación de aportes parafiscales (2026-08-31)" },
    ]);
  });

  test("las filas de soportes muestran el nombre y no traen el tipo", () => {
    const datos = construirDatosChecklist(CASO, construirChecklist(SOPORTES, [], HOY));
    expect(datos.soportes.map((fila) => fila.nombre)).toEqual([
      "Registro Único Tributario",
      "Certificado de cumplimiento tributario",
      "Certificación de aportes parafiscales",
    ]);
    expect(datos.soportes.every((fila) => !Object.hasOwn(fila, "tipo"))).toBe(true);
  });

  test("las acciones de ausentes y vencidos nombran el soporte", () => {
    const datos = construirDatosChecklist(CASO, construirChecklist(SOPORTES, [], HOY));
    expect(datos.ausentes).toEqual([{ nombre: "Certificado de cumplimiento tributario" }]);
    expect(datos.vencidos).toEqual([{ nombre: "Certificación de aportes parafiscales", vigencia: "2026-08-31" }]);
  });

  test("un id desconocido o con forma de propiedad heredada se muestra crudo en filas, motivos y acciones", () => {
    for (const tipo of DESCONOCIDOS) {
      const soportes = [
        soporte(tipo, ESTADO_SOPORTE.AUSENTE, null, null),
        soporte(tipo, ESTADO_SOPORTE.VENCIDO, "ficticio.txt", "2026-08-31"),
      ];
      const datos = construirDatosChecklist(CASO, construirChecklist(soportes, [], HOY));
      expect(datos.soportes.map((fila) => fila.nombre)).toEqual([tipo, tipo]);
      expect(datos.motivos).toEqual([
        { motivo: `ausente: ${tipo}` },
        { motivo: `vencido: ${tipo} (2026-08-31)` },
      ]);
      expect(datos.ausentes).toEqual([{ nombre: tipo }]);
      expect(datos.vencidos).toEqual([{ nombre: tipo, vigencia: "2026-08-31" }]);
    }
  });
});
