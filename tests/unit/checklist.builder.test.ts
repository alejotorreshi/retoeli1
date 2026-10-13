import { describe, expect, test } from "bun:test";
import { ESTADO_CAMPO, REGLA_MAPEO } from "@/config/constants/mapping.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import {
  construirChecklist,
  construirDatosChecklist,
  motivosDeBloqueo,
} from "@/domain/builders/checklist.builder.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";
import type { CampoMapeado } from "@/domain/types/mapeo.type.ts";
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

  test("un vencido sin fecha nunca deja un paréntesis vacío en el bloqueo (IN-02)", () => {
    const sinFecha = [soporte("parafiscales", ESTADO_SOPORTE.VENCIDO, "parafiscales-ficticio.txt", null)];
    expect(construirChecklist(sinFecha, [], HOY).bloqueos).toEqual(["vencido: parafiscales (no aplica)"]);
    const motivos = motivosDeBloqueo(construirChecklist(sinFecha, [], HOY));
    expect(motivos.every((motivo) => !motivo.includes("()"))).toBe(true);
  });

  test("motivosDeBloqueo da los mismos bloqueos en el mismo orden con el nombre del soporte", () => {
    expect(motivosDeBloqueo(construirChecklist(SOPORTES, [], HOY))).toEqual([
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
    expect(datos.vencidos).toEqual([
      { nombre: "Certificación de aportes parafiscales", vigencia: "2026-08-31" },
    ]);
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

describe("construirChecklist: una sola fuente para los bloqueos crudos y los nombrados (IN-03)", () => {
  test("bloqueos y motivosDeBloqueo salen de motivos_bloqueo, en el mismo orden y con la misma cantidad", () => {
    const checklist = construirChecklist(SOPORTES, [], HOY);
    expect(checklist.motivos_bloqueo).toEqual([
      { tipo: "certificado_cumplimiento_tributario", causa: ESTADO_SOPORTE.AUSENTE },
      { tipo: "parafiscales", causa: ESTADO_SOPORTE.VENCIDO, vigencia: "2026-08-31" },
    ]);
    expect(checklist.bloqueos).toHaveLength(checklist.motivos_bloqueo.length);
    expect(motivosDeBloqueo(checklist)).toHaveLength(checklist.motivos_bloqueo.length);
    expect(checklist.listo_para_firma).toBe(false);
  });

  test("motivosDeBloqueo renderiza lo que trae el checklist y no vuelve a leer los soportes", () => {
    const checklist = { motivos_bloqueo: [{ tipo: "rut", causa: ESTADO_SOPORTE.AUSENTE }] } as const;
    expect(motivosDeBloqueo(checklist)).toEqual(["ausente: Registro Único Tributario"]);
  });
});

describe("construirChecklist: confirmaciones que se le piden al cliente (WR-02, RN2)", () => {
  function porConfirmar(etiqueta: string, ruta: string | null): CampoMapeado {
    return {
      etiqueta,
      ruta,
      estado: ESTADO_CAMPO.REQUIERE_CONFIRMACION,
      regla: REGLA_MAPEO.GLOSARIO_EXACTO,
      confianza: 0.5,
      valor: null,
      nota: "Nota ficticia para la analista",
      propuesta: null,
    };
  }

  test("excluye los campos con ruta bancaria y conserva el resto en orden", () => {
    const campos = [
      porConfirmar("Identificador ficticio", "nit"),
      porConfirmar("Cuenta ficticia", "banco.numero_cuenta"),
      porConfirmar("Sin ruta ficticia", null),
    ];
    const checklist = construirChecklist([], campos, HOY);
    expect(checklist.requiere_confirmacion.map((campo) => campo.etiqueta)).toEqual([
      "Identificador ficticio",
      "Cuenta ficticia",
      "Sin ruta ficticia",
    ]);
    expect(checklist.confirmaciones_al_cliente).toEqual(["Identificador ficticio", "Sin ruta ficticia"]);
    expect(checklist.confirmaciones_internas).toEqual(["Cuenta ficticia"]);
  });

  test("el checklist pide confirmar internamente el campo bancario y con el cliente el resto (WR-01)", () => {
    const campos = [
      porConfirmar("Identificador ficticio", "nit"),
      porConfirmar("Cuenta ficticia", "banco.numero_cuenta"),
    ];
    const datos = construirDatosChecklist(CASO, construirChecklist([], campos, HOY));
    expect(datos.por_confirmar.map((campo) => campo.etiqueta)).toEqual([
      "Identificador ficticio",
      "Cuenta ficticia",
    ]);
    expect(datos.confirmar_con_cliente).toEqual([{ etiqueta: "Identificador ficticio" }]);
    expect(datos.confirmar_internamente).toEqual([{ etiqueta: "Cuenta ficticia" }]);
  });
});

describe("construirDatosChecklist: acción por cada soporte con aviso de emisor (IN-04)", () => {
  test("lista el nombre y el país emisor de los soportes con aviso y omite los demás", () => {
    const soportes = [
      {
        ...soporte("rut", ESTADO_SOPORTE.PRESENTE, "rut-ficticio.txt", null),
        pais_emisor: "CO",
        aviso_emisor: "Aviso",
      },
      { ...soporte("camara_comercio", ESTADO_SOPORTE.PRESENTE, "camara.txt", null), pais_emisor: "HN" },
      soporte("certificado_cumplimiento_tributario", ESTADO_SOPORTE.AUSENTE, null, null),
    ];
    const datos = construirDatosChecklist(CASO, construirChecklist(soportes, [], HOY));
    expect(datos.con_aviso_emisor).toEqual([{ nombre: "Registro Único Tributario", pais_emisor: "CO" }]);
  });
});
