import { beforeAll, describe, expect, test } from "bun:test";
import {
  construirChecklist,
  evaluarSoportes,
  type SoporteEvaluado,
  type SoporteIndice,
} from "../../src/domain/checklist.ts";
import type { CampoMapeado } from "../../src/domain/mapeo.ts";
import type { ReglasSoportes } from "../../src/domain/reglas.ts";
import type { Resultado } from "../../src/domain/resultado.ts";
import type { FechaISO } from "../../src/domain/tipos.ts";
import { evaluarVigencia } from "../../src/domain/vigencias.ts";

const HOY: FechaISO = "2026-09-03";
const DIAS_AVISO = 30;
const AVISO_CO = "Emitido en CO: confirmar si el cliente lo acepta";
const RUTA_INDICE = new URL(
  "../../reto-01/fixtures/reto-01/repositorio/soportes/index.json",
  import.meta.url,
);
const RUTA_REGLAS = new URL("../../src/knowledge/reglas.json", import.meta.url);
const SOPORTES_HN = ["camara_comercio", "rut", "parafiscales"];
const SOPORTES_EC = [
  "camara_comercio",
  "rut",
  "certificacion_bancaria",
  "estados_financieros",
  "certificado_cumplimiento_tributario",
];
const SOPORTES_CO = ["camara_comercio", "rut", "certificacion_bancaria", "estados_financieros"];

let indice: readonly SoporteIndice[];
let presentes: ReadonlySet<string>;
let reglasSoportes: ReglasSoportes;

beforeAll(async () => {
  indice = JSON.parse(await Bun.file(RUTA_INDICE).text());
  presentes = new Set(indice.map((entrada) => entrada.archivo));
  reglasSoportes = JSON.parse(await Bun.file(RUTA_REGLAS).text()).soportes;
});

function soportesDe(resultado: Resultado<readonly SoporteEvaluado[]>): readonly SoporteEvaluado[] {
  if (!resultado.ok) throw new Error(resultado.error);
  return resultado.data;
}

function porTipo(soportes: readonly SoporteEvaluado[], tipo: string): SoporteEvaluado | undefined {
  return soportes.find((soporte) => soporte.tipo === tipo);
}

function campo(etiqueta: string, estado: CampoMapeado["estado"], nota: string | null = null): CampoMapeado {
  return {
    etiqueta,
    ruta: estado === "faltante" ? null : "nit",
    estado,
    regla: estado === "faltante" ? "sin_fuente" : "glosario_exacto",
    confianza: estado === "faltante" ? 0 : 1,
    valor: estado === "faltante" ? null : "900123456",
    nota,
    propuesta: null,
  };
}

describe("evaluarVigencia (PAQ-05, D-23)", () => {
  test("a 27 días del vencimiento está vigente y avisa 'vence en 27 días'", () => {
    expect(evaluarVigencia("2026-09-30", HOY, DIAS_AVISO)).toEqual({
      estado: "vigente",
      dias_restantes: 27,
      aviso: "vence en 27 días",
    });
  });

  test("el día siguiente al vencimiento está vencido", () => {
    expect(evaluarVigencia("2026-09-02", HOY, DIAS_AVISO).estado).toBe("vencido");
    expect(evaluarVigencia("2026-08-31", HOY, DIAS_AVISO).estado).toBe("vencido");
    expect(evaluarVigencia("2026-08-31", HOY, DIAS_AVISO).aviso).toBeNull();
  });

  test("el mismo día del vencimiento sigue vigente y avisa 'vence en 0 días'", () => {
    expect(evaluarVigencia("2026-09-03", HOY, DIAS_AVISO)).toEqual({
      estado: "vigente",
      dias_restantes: 0,
      aviso: "vence en 0 días",
    });
  });

  test("sin vigencia es vigente y no avisa", () => {
    expect(evaluarVigencia(null, HOY, DIAS_AVISO)).toEqual({
      estado: "vigente",
      dias_restantes: null,
      aviso: null,
    });
  });

  test("a 30 días avisa y a 31 días no", () => {
    expect(evaluarVigencia("2026-10-03", HOY, DIAS_AVISO).aviso).toBe("vence en 30 días");
    expect(evaluarVigencia("2026-10-04", HOY, DIAS_AVISO)).toEqual({
      estado: "vigente",
      dias_restantes: 31,
      aviso: null,
    });
  });

  test("los días se cuentan exactos a través de un cambio de mes y de año", () => {
    expect(evaluarVigencia("2027-01-01", "2026-12-31", DIAS_AVISO).dias_restantes).toBe(1);
    expect(evaluarVigencia("2026-12-31", HOY, DIAS_AVISO).dias_restantes).toBe(119);
  });
});

describe("evaluarSoportes (PAQ-03, D-22)", () => {
  test("hn: parafiscales vencido, cámara presente con aviso de 27 días y rut presente, todos con aviso de emisor", () => {
    const soportes = soportesDe(evaluarSoportes(SOPORTES_HN, indice, presentes, HOY, "HN", reglasSoportes));
    expect(soportes.map((soporte) => soporte.tipo)).toEqual(SOPORTES_HN);
    expect(porTipo(soportes, "parafiscales")).toEqual({
      tipo: "parafiscales",
      estado: "vencido",
      vigencia_hasta: "2026-08-31",
      archivo: "parafiscales-2026-07.txt",
      aviso: null,
      aviso_emisor: AVISO_CO,
    });
    expect(porTipo(soportes, "camara_comercio")).toEqual({
      tipo: "camara_comercio",
      estado: "presente",
      vigencia_hasta: "2026-09-30",
      archivo: "camara-comercio-2026-08.txt",
      aviso: "vence en 27 días",
      aviso_emisor: AVISO_CO,
    });
    expect(porTipo(soportes, "rut")).toEqual({
      tipo: "rut",
      estado: "presente",
      vigencia_hasta: null,
      archivo: "rut-2026.txt",
      aviso: null,
      aviso_emisor: AVISO_CO,
    });
  });

  test("co: el emisor coincide con el cliente y no hay aviso de emisor", () => {
    const soportes = soportesDe(evaluarSoportes(SOPORTES_CO, indice, presentes, HOY, "CO", reglasSoportes));
    expect(soportes.every((soporte) => soporte.estado === "presente")).toBe(true);
    expect(soportes.every((soporte) => soporte.aviso_emisor === null)).toBe(true);
  });

  test("ec: un tipo sin entrada en el índice queda ausente sin archivo", () => {
    const soportes = soportesDe(evaluarSoportes(SOPORTES_EC, indice, presentes, HOY, "EC", reglasSoportes));
    expect(porTipo(soportes, "certificado_cumplimiento_tributario")).toEqual({
      tipo: "certificado_cumplimiento_tributario",
      estado: "ausente",
      vigencia_hasta: null,
      archivo: null,
      aviso: null,
      aviso_emisor: null,
    });
  });

  test("una entrada del índice cuyo archivo no existe cuenta como ausente", () => {
    const sinRut = new Set([...presentes].filter((archivo) => archivo !== "rut-2026.txt"));
    const soportes = soportesDe(evaluarSoportes(["rut"], indice, sinRut, HOY, "CO", reglasSoportes));
    expect(soportes[0]?.estado).toBe("ausente");
    expect(soportes[0]?.archivo).toBeNull();
  });

  test("con dos entradas del mismo tipo gana la presente de vigencia más lejana, sin importar el orden", () => {
    const vencida: SoporteIndice = {
      tipo: "camara_comercio",
      archivo: "camara-comercio-2026-07.txt",
      vigencia_hasta: "2026-08-01",
      pais_emisor: "CO",
      descripcion: "Cámara vieja",
    };
    const vigente: SoporteIndice = {
      ...vencida,
      archivo: "camara-comercio-2026-08.txt",
      vigencia_hasta: "2026-09-30",
    };
    const ambos = new Set([vencida.archivo, vigente.archivo]);
    for (const orden of [
      [vencida, vigente],
      [vigente, vencida],
    ]) {
      const [soporte] = soportesDe(
        evaluarSoportes(["camara_comercio"], orden, ambos, HOY, "CO", reglasSoportes),
      );
      expect(soporte).toMatchObject({
        estado: "presente",
        archivo: vigente.archivo,
        vigencia_hasta: "2026-09-30",
      });
    }
  });

  test("si la primera entrada del tipo no tiene archivo se usa la siguiente presente, y sin vencimiento gana", () => {
    const perdida: SoporteIndice = {
      tipo: "rut",
      archivo: "rut-perdido.txt",
      vigencia_hasta: "2027-01-01",
      pais_emisor: "CO",
      descripcion: "RUT sin archivo",
    };
    const conFecha: SoporteIndice = { ...perdida, archivo: "rut-2025.txt", vigencia_hasta: "2026-12-31" };
    const sinFecha: SoporteIndice = { ...perdida, archivo: "rut-2026.txt", vigencia_hasta: null };
    const presentesRut = new Set([conFecha.archivo, sinFecha.archivo]);
    const [soporte] = soportesDe(
      evaluarSoportes(["rut"], [perdida, conFecha, sinFecha], presentesRut, HOY, "CO", reglasSoportes),
    );
    expect(soporte).toMatchObject({ estado: "presente", archivo: "rut-2026.txt", vigencia_hasta: null });
  });

  test("un aviso de emisor con una variable desconocida es REGLAS_INVALIDAS", () => {
    const reglas = { ...reglasSoportes, aviso_emisor_distinto: "Emitido en {{banco.numero_cuenta}}" };
    const resultado = evaluarSoportes(SOPORTES_HN, indice, presentes, HOY, "HN", reglas);
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.codigo).toBe("REGLAS_INVALIDAS");
  });
});

describe("construirChecklist (RN3, PAQ-03)", () => {
  test("ec queda bloqueado por el soporte ausente y lista faltantes y por confirmar", () => {
    const soportes = soportesDe(evaluarSoportes(SOPORTES_EC, indice, presentes, HOY, "EC", reglasSoportes));
    const nota = "Identificador extranjero: confirmar si el cliente acepta el NIT colombiano";
    const campos = [
      campo("Nombre de la empresa", "lleno"),
      campo("Número de contribuyente especial", "faltante"),
      campo("RUC", "requiere_confirmacion", nota),
    ];
    const checklist = construirChecklist(soportes, campos, HOY);
    expect(checklist.listo_para_firma).toBe(false);
    expect(checklist.bloqueos).toEqual(["ausente: certificado_cumplimiento_tributario"]);
    expect(checklist.fecha_ejecucion).toBe(HOY);
    expect(checklist.faltantes).toEqual(["Número de contribuyente especial"]);
    expect(checklist.requiere_confirmacion).toEqual([{ etiqueta: "RUC", nota }]);
    expect(checklist.soportes).toEqual(soportes);
  });

  test("hn queda bloqueado por parafiscales vencido con su fecha", () => {
    const soportes = soportesDe(evaluarSoportes(SOPORTES_HN, indice, presentes, HOY, "HN", reglasSoportes));
    const checklist = construirChecklist(soportes, [], HOY);
    expect(checklist.listo_para_firma).toBe(false);
    expect(checklist.bloqueos).toEqual(["vencido: parafiscales (2026-08-31)"]);
  });

  test("un campo faltante solo nunca bloquea la firma", () => {
    const soportes = soportesDe(evaluarSoportes(SOPORTES_CO, indice, presentes, HOY, "CO", reglasSoportes));
    const checklist = construirChecklist(soportes, [campo("Referencias comerciales", "faltante")], HOY);
    expect(checklist.listo_para_firma).toBe(true);
    expect(checklist.bloqueos).toEqual([]);
    expect(checklist.faltantes).toEqual(["Referencias comerciales"]);
  });

  test("los bloqueos siguen el orden de los soportes exigidos", () => {
    const exigidos = ["parafiscales", "certificado_cumplimiento_tributario", "rut"];
    const soportes = soportesDe(evaluarSoportes(exigidos, indice, presentes, HOY, "HN", reglasSoportes));
    expect(construirChecklist(soportes, [], HOY).bloqueos).toEqual([
      "vencido: parafiscales (2026-08-31)",
      "ausente: certificado_cumplimiento_tributario",
    ]);
  });
});
