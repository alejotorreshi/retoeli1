import { describe, expect, test } from "bun:test";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { TEXTO_MASCARA } from "@/config/strings.ts";
import { redactarResultadoVisible, resultadoVisible } from "@/loop/services/resultado-visible.service.ts";

const LEER = NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD];
const MAPEAR = NOMBRE_VISIBLE[HERRAMIENTA.MAPEAR_CAMPOS];
const GENERAR = NOMBRE_VISIBLE[HERRAMIENTA.GENERAR_FORMULARIO];
const ARMAR = NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE];
const SIMULAR = NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO];

const SIN_DATOS = {
  pais: null,
  formato: null,
  conteo: null,
  listoParaFirma: null,
  bloqueosLegibles: null,
  ruta: null,
  aviso: null,
};

function soporte(tipo: string, estado: string, vigencia_hasta: string | null) {
  return { tipo, estado, vigencia_hasta, archivo: null, aviso: null, pais_emisor: "CO", aviso_emisor: null };
}

function paquete(caso: string, listo: boolean, bloqueos: string[], soportes: unknown[]) {
  return {
    ok: true,
    data: {
      ruta: `out/${caso}/paquete`,
      listo_para_firma: listo,
      bloqueos,
      checklist: { fecha_ejecucion: "2026-09-03", soportes, faltantes: [], requiere_confirmacion: [] },
      archivos: [`out/${caso}/paquete/checklist.md`],
    },
    resumen: `${caso}: paquete armado`,
  };
}

function mapeo(caso: string, pais: string, lleno: number, faltante: number, requiere_confirmacion: number) {
  return {
    ok: true,
    data: {
      caso,
      pais,
      conteo: { lleno, faltante, requiere_confirmacion },
      llenos: [{ etiqueta: "Razón social", estado: "lleno", ruta: "empresa.razon_social", valor: "•••" }],
      faltantes: [],
      requiere_confirmacion: [],
      mapeo: `out/${caso}/mapeo.json`,
    },
  };
}

describe("resultadoVisible proyecta la respuesta JSON de cada herramienta", () => {
  test("co-industrias-delta: 17/0/0, xlsx de CO y paquete listo para firma sin bloqueos", () => {
    const caso = "co-industrias-delta";
    expect(
      resultadoVisible(LEER, { ok: true, data: { caso, pais: "CO", formato: "xlsx", campos: [] } }),
    ).toEqual({
      herramienta: HERRAMIENTA.LEER_SOLICITUD,
      ...SIN_DATOS,
      pais: "CO",
      formato: "xlsx",
    });
    expect(resultadoVisible(MAPEAR, mapeo(caso, "CO", 17, 0, 0))).toEqual({
      herramienta: HERRAMIENTA.MAPEAR_CAMPOS,
      ...SIN_DATOS,
      pais: "CO",
      conteo: { lleno: 17, faltante: 0, requiere_confirmacion: 0 },
    });
    expect(
      resultadoVisible(GENERAR, { ok: true, data: { ruta: `out/${caso}/formulario.xlsx`, formato: "xlsx" } }),
    ).toEqual({
      herramienta: HERRAMIENTA.GENERAR_FORMULARIO,
      ...SIN_DATOS,
      formato: "xlsx",
      ruta: `out/${caso}/formulario.xlsx`,
    });
    const listo = paquete(caso, true, [], [soporte("rut", "presente", null)]);
    expect(resultadoVisible(ARMAR, listo)).toEqual({
      herramienta: HERRAMIENTA.ARMAR_PAQUETE,
      ...SIN_DATOS,
      listoParaFirma: true,
      bloqueosLegibles: [],
      ruta: `out/${caso}/paquete`,
    });
  });

  test("ec-corp-andina: 13/1/1 y el soporte ausente con su nombre legible", () => {
    const caso = "ec-corp-andina";
    expect(resultadoVisible(MAPEAR, mapeo(caso, "EC", 13, 1, 1))?.conteo).toEqual({
      lleno: 13,
      faltante: 1,
      requiere_confirmacion: 1,
    });
    const bloqueado = paquete(
      caso,
      false,
      ["ausente: certificado_cumplimiento_tributario"],
      [soporte("rut", "presente", null), soporte("certificado_cumplimiento_tributario", "ausente", null)],
    );
    expect(resultadoVisible(ARMAR, bloqueado)).toEqual({
      herramienta: HERRAMIENTA.ARMAR_PAQUETE,
      ...SIN_DATOS,
      listoParaFirma: false,
      bloqueosLegibles: ["ausente: Certificado de cumplimiento tributario"],
      ruta: `out/${caso}/paquete`,
    });
  });

  test("hn-agroexport-sula: 9/1/1 y los parafiscales vencidos con su nombre legible y su vigencia", () => {
    const caso = "hn-agroexport-sula";
    expect(resultadoVisible(MAPEAR, mapeo(caso, "HN", 9, 1, 1))).toEqual({
      herramienta: HERRAMIENTA.MAPEAR_CAMPOS,
      ...SIN_DATOS,
      pais: "HN",
      conteo: { lleno: 9, faltante: 1, requiere_confirmacion: 1 },
    });
    const vencido = paquete(
      caso,
      false,
      ["vencido: parafiscales (2026-08-31)"],
      [
        soporte("camara_comercio", "presente", "2026-09-30"),
        soporte("parafiscales", "vencido", "2026-08-31"),
      ],
    );
    expect(resultadoVisible(ARMAR, vencido)?.bloqueosLegibles).toEqual([
      "vencido: Certificación de aportes parafiscales (2026-08-31)",
    ]);
  });

  test("pa-logistica-istmo: los valores para portal llevan el aviso de formato no soportado", () => {
    const caso = "pa-logistica-istmo";
    const portal = {
      ok: true,
      data: { ruta: `out/${caso}/valores-portal.md`, formato: "portal", aviso: "formato no soportado" },
      resumen: `${caso}: valores para portal generados`,
    };
    expect(resultadoVisible(GENERAR, portal)).toEqual({
      herramienta: HERRAMIENTA.GENERAR_FORMULARIO,
      ...SIN_DATOS,
      formato: "portal",
      ruta: `out/${caso}/valores-portal.md`,
      aviso: "formato no soportado",
    });
  });

  test("el conteo del formulario se toma si la respuesta lo trae", () => {
    const conteo = { lleno: 8, faltante: 0, requiere_confirmacion: 1 };
    const respuesta = {
      ok: true,
      data: { ruta: "out/x/formulario.pdf", formato: "pdf", conteo, aviso: null },
    };
    expect(resultadoVisible(GENERAR, respuesta)?.conteo).toEqual(conteo);
  });

  test("el envío simulado solo deja su ruta", () => {
    const envio = { ok: true, data: { ruta: "out/x/ENVIO-SIMULADO.md", bloqueos: ["ausente: rut"] } };
    expect(resultadoVisible(SIMULAR, envio)).toEqual({
      herramienta: HERRAMIENTA.SIMULAR_ENVIO,
      ...SIN_DATOS,
      ruta: "out/x/ENVIO-SIMULADO.md",
    });
  });

  test("una respuesta fallida, una que no se entiende y una herramienta desconocida dan null", () => {
    const fallo = {
      ok: false,
      error: "No existe un caso con ese identificador.",
      codigo: "CASO_NO_ENCONTRADO",
    };
    expect(resultadoVisible(LEER, fallo)).toBeNull();
    expect(resultadoVisible(MAPEAR, null)).toBeNull();
    expect(
      resultadoVisible(GENERAR, { ok: true, data: { ruta: "out/x/formulario.doc", formato: "doc" } }),
    ).toBeNull();
    expect(resultadoVisible(ARMAR, { ok: true, data: { ruta: "out/x/paquete" } })).toBeNull();
    expect(resultadoVisible("proveedor_borrar_todo", { ok: true, data: { ruta: "out/x" } })).toBeNull();
  });

  test("ningún valor del maestro de la respuesta pasa al resultado visible", () => {
    const respuesta = mapeo("co-industrias-delta", "CO", 17, 0, 0);
    expect(JSON.stringify(resultadoVisible(MAPEAR, respuesta))).not.toContain("Razón social");
    expect(JSON.stringify(resultadoVisible(MAPEAR, respuesta))).not.toContain("empresa.razon_social");
  });
});

describe("redactarResultadoVisible", () => {
  test("enmascara los secretos y conserva la forma", () => {
    const secreto = "sk-secreto-de-prueba-123";
    const visible = resultadoVisible(GENERAR, {
      ok: true,
      data: { ruta: `out/${secreto}/formulario.xlsx`, formato: "xlsx" },
    });
    expect(redactarResultadoVisible(visible, [secreto])?.ruta).toBe(
      `out/${TEXTO_MASCARA.oculto}/formulario.xlsx`,
    );
  });

  test("null sigue siendo null", () => {
    expect(redactarResultadoVisible(null, [])).toBeNull();
  });
});
