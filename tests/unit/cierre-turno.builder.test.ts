import { describe, expect, test } from "bun:test";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { HERRAMIENTA, PREFIJO_HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import { TEXTO_CHECKLIST, TEXTO_CIERRE } from "@/config/strings.ts";
import { cierreDeterminista, preguntaConfirmacion } from "@/domain/builders/cierre-turno.builder.ts";
import type { LlamadaResumida } from "@/domain/types/cierre-turno.type.ts";
import type { CasoPendiente } from "@/domain/types/compuerta.type.ts";

const EC = "ec-corp-andina";
const CO = "co-industrias-delta";

const PENDIENTE_EC: CasoPendiente = {
  caso: EC,
  bloqueos: ["ausente: certificado_cumplimiento_tributario"],
  motivos: [{ tipo: "certificado_cumplimiento_tributario", causa: ESTADO_SOPORTE.AUSENTE }],
};
const PENDIENTE_CO: CasoPendiente = { caso: CO, bloqueos: [], motivos: [] };

function sinMarkdown(texto: string): void {
  expect(texto).not.toContain("**");
  expect(texto).not.toContain("#");
  expect(texto).not.toContain("|");
}

describe("preguntaConfirmacion (ENV-03, D-41, D-44)", () => {
  test("un caso bloqueado nombra el caso y sus bloqueos legibles y termina en pregunta", () => {
    const texto = preguntaConfirmacion([PENDIENTE_EC]);
    expect(texto.endsWith("?")).toBe(true);
    expect(texto).toContain(EC);
    expect(texto).toContain(TEXTO_CHECKLIST.estado.bloqueado);
    expect(texto).toContain("Certificado de cumplimiento tributario");
    expect(texto).not.toContain("certificado_cumplimiento_tributario");
    sinMarkdown(texto);
  });

  test("un caso listo dice LISTO y termina en pregunta", () => {
    const texto = preguntaConfirmacion([PENDIENTE_CO]);
    expect(texto.endsWith("?")).toBe(true);
    expect(texto).toContain(CO);
    expect(texto).toContain(TEXTO_CHECKLIST.estado.listo);
    expect(texto).not.toContain(TEXTO_CHECKLIST.estado.bloqueado);
  });

  test("varios casos los lista todos, pide nombrar uno y termina en pregunta (D-40)", () => {
    const texto = preguntaConfirmacion([PENDIENTE_EC, PENDIENTE_CO]);
    expect(texto.endsWith("?")).toBe(true);
    expect(texto).toContain(EC);
    expect(texto).toContain(CO);
    expect(texto).toContain(TEXTO_CHECKLIST.estado.bloqueado);
    expect(texto).toContain(TEXTO_CHECKLIST.estado.listo);
    expect(texto).toContain("Certificado de cumplimiento tributario");
    expect(texto).not.toContain("certificado_cumplimiento_tributario");
    expect(texto).toContain("envía <caso>");
    sinMarkdown(texto);
  });
});

function llamada(herramienta: LlamadaResumida["herramienta"], caso: string, ok: boolean): LlamadaResumida {
  return { herramienta, caso, ok, resumen: ok ? `${caso}: resumen de ${herramienta}` : null };
}

describe("cierreDeterminista (D-53)", () => {
  test("lista lo completado y el siguiente paso canónico del caso", () => {
    const llamadas = [
      llamada(HERRAMIENTA.LEER_SOLICITUD, CO, true),
      llamada(HERRAMIENTA.MAPEAR_CAMPOS, CO, true),
      llamada(HERRAMIENTA.GENERAR_FORMULARIO, CO, true),
    ];
    const texto = cierreDeterminista(llamadas);
    for (const { resumen } of llamadas) expect(texto).toContain(resumen ?? "");
    expect(texto).toContain(`${PREFIJO_HERRAMIENTA}${HERRAMIENTA.ARMAR_PAQUETE}`);
    expect(texto).toContain(CO);
    expect(texto.indexOf("Completé")).toBeLessThan(texto.indexOf("Falta"));
    sinMarkdown(texto);
  });

  test("tras armar el paquete el paso que falta es confirmar el envío", () => {
    const texto = cierreDeterminista([
      llamada(HERRAMIENTA.GENERAR_FORMULARIO, EC, true),
      llamada(HERRAMIENTA.ARMAR_PAQUETE, EC, true),
    ]);
    expect(texto).toContain(TEXTO_CIERRE.siguientePaso[HERRAMIENTA.SIMULAR_ENVIO](EC));
  });

  test("una llamada fallida no cuenta como completada ni avanza el paso", () => {
    const texto = cierreDeterminista([
      llamada(HERRAMIENTA.LEER_SOLICITUD, CO, true),
      llamada(HERRAMIENTA.MAPEAR_CAMPOS, CO, false),
    ]);
    expect(texto).toContain(TEXTO_CIERRE.siguientePaso[HERRAMIENTA.MAPEAR_CAMPOS](CO));
  });

  test("un caso con el envío registrado no deja pasos pendientes", () => {
    const texto = cierreDeterminista([llamada(HERRAMIENTA.SIMULAR_ENVIO, EC, true)]);
    expect(texto).not.toContain("Falta");
  });

  test("sin llamadas devuelve el texto sin pasos", () => {
    expect(cierreDeterminista([])).toBe(TEXTO_CIERRE.sinPasos);
  });
});
