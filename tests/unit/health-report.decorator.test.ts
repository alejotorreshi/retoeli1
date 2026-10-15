import { describe, expect, test } from "bun:test";
import { crearAdaptadorGuion, exito, falla, opcionesCon } from "@tests/helpers/adaptador-guion.helper.ts";
import { diferido } from "@tests/helpers/fetch-falso.helper.ts";
import type { PasoGuion } from "@tests/helpers/types/adaptador-guion.type.ts";
import { ESTADO_LLM, TIPO_ERROR_LLM } from "@/config/constants/llm.constants.ts";
import { createHealthMonitor, withHealthReport } from "@/llm/decorators/health-report.decorator.ts";
import type { ResultadoEnvio } from "@/llm/types/llm.type.ts";
import type { LlmHealthState } from "@/llm/types/resilience.type.ts";

function abortada(): AbortSignal {
  const control = new AbortController();
  control.abort();
  return control.signal;
}

async function estadoTras(
  inicial: LlmHealthState,
  resultado: ResultadoEnvio,
  signal?: AbortSignal,
): Promise<LlmHealthState> {
  const monitor = createHealthMonitor(inicial);
  await withHealthReport(crearAdaptadorGuion([resultado]), monitor).enviar([], [], opcionesCon(signal));
  return monitor.current();
}

function pasoQueEspera(espera: Promise<void>, resultado: ResultadoEnvio): PasoGuion {
  return async () => {
    await espera;
    return resultado;
  };
}

describe("createHealthMonitor", () => {
  test("arranca en el estado inicial y devuelve el último publicado", () => {
    const monitor = createHealthMonitor(ESTADO_LLM.DISPONIBLE);
    expect(monitor.current()).toBe(ESTADO_LLM.DISPONIBLE);
    monitor.publish(ESTADO_LLM.SALDO_AGOTADO);
    expect(monitor.current()).toBe(ESTADO_LLM.SALDO_AGOTADO);
  });
});

describe("withHealthReport", () => {
  test("recorre disponible, saldo agotado, disponible, sin cambio y no disponible según cada resultado", async () => {
    const monitor = createHealthMonitor(ESTADO_LLM.DISPONIBLE);
    const adaptador = withHealthReport(
      crearAdaptadorGuion([
        exito(),
        falla(TIPO_ERROR_LLM.SALDO),
        exito(),
        falla(TIPO_ERROR_LLM.ABORTADO),
        falla(TIPO_ERROR_LLM.PETICION_INVALIDA),
        falla(TIPO_ERROR_LLM.SERVIDOR),
      ]),
      monitor,
    );
    const vistos: LlmHealthState[] = [];
    for (let paso = 0; paso < 6; paso += 1) {
      await adaptador.enviar([], [], opcionesCon());
      vistos.push(monitor.current());
    }
    expect(vistos).toEqual([
      ESTADO_LLM.DISPONIBLE,
      ESTADO_LLM.SALDO_AGOTADO,
      ESTADO_LLM.DISPONIBLE,
      ESTADO_LLM.DISPONIBLE,
      ESTADO_LLM.DISPONIBLE,
      ESTADO_LLM.NO_DISPONIBLE,
    ]);
  });

  test("devuelve el resultado de la base sin tocarlo", async () => {
    const error = falla(TIPO_ERROR_LLM.SALDO);
    const monitor = createHealthMonitor(ESTADO_LLM.DISPONIBLE);
    const resultado = await withHealthReport(crearAdaptadorGuion([error]), monitor).enviar(
      [],
      [],
      opcionesCon(),
    );
    expect(resultado).toEqual(error);
  });

  test.each([
    [TIPO_ERROR_LLM.AUTENTICACION, ESTADO_LLM.NO_DISPONIBLE],
    [TIPO_ERROR_LLM.LIMITE_TASA, ESTADO_LLM.NO_DISPONIBLE],
    [TIPO_ERROR_LLM.RED, ESTADO_LLM.NO_DISPONIBLE],
    [TIPO_ERROR_LLM.TIMEOUT, ESTADO_LLM.NO_DISPONIBLE],
    [TIPO_ERROR_LLM.RESPUESTA_INVALIDA, ESTADO_LLM.NO_DISPONIBLE],
    [TIPO_ERROR_LLM.SALDO, ESTADO_LLM.SALDO_AGOTADO],
  ])("un error %p deja el estado en %p", async (tipo, esperado) => {
    expect(await estadoTras(ESTADO_LLM.DISPONIBLE, falla(tipo))).toBe(esperado);
  });

  test.each([TIPO_ERROR_LLM.ABORTADO, TIPO_ERROR_LLM.PETICION_INVALIDA, TIPO_ERROR_LLM.FILTRO_CONTENIDO])(
    "un error %p no cambia el estado publicado",
    async (tipo) => {
      expect(await estadoTras(ESTADO_LLM.SALDO_AGOTADO, falla(tipo))).toBe(ESTADO_LLM.SALDO_AGOTADO);
    },
  );

  test("una llamada que la analista abortó no cambia el estado aunque la base devuelva un error transitorio", async () => {
    expect(await estadoTras(ESTADO_LLM.DISPONIBLE, falla(TIPO_ERROR_LLM.SERVIDOR), abortada())).toBe(
      ESTADO_LLM.DISPONIBLE,
    );
  });

  test("una llamada que la analista abortó no cambia el estado aunque la base responda bien", async () => {
    expect(await estadoTras(ESTADO_LLM.SALDO_AGOTADO, exito(), abortada())).toBe(ESTADO_LLM.SALDO_AGOTADO);
  });

  test("con dos llamadas superpuestas gana la que terminó última aunque haya empezado primero", async () => {
    const lenta = diferido();
    const rapida = diferido();
    const monitor = createHealthMonitor(ESTADO_LLM.DISPONIBLE);
    const adaptador = withHealthReport(
      crearAdaptadorGuion([
        pasoQueEspera(lenta.promesa, falla(TIPO_ERROR_LLM.SALDO)),
        pasoQueEspera(rapida.promesa, exito()),
      ]),
      monitor,
    );
    const primera = adaptador.enviar([], [], opcionesCon());
    const segunda = adaptador.enviar([], [], opcionesCon());
    rapida.soltar();
    await segunda;
    expect(monitor.current()).toBe(ESTADO_LLM.DISPONIBLE);
    lenta.soltar();
    await primera;
    expect(monitor.current()).toBe(ESTADO_LLM.SALDO_AGOTADO);
  });

  test("con dos llamadas superpuestas, si la primera termina primero gana la segunda", async () => {
    const lenta = diferido();
    const rapida = diferido();
    const monitor = createHealthMonitor(ESTADO_LLM.DISPONIBLE);
    const adaptador = withHealthReport(
      crearAdaptadorGuion([
        pasoQueEspera(rapida.promesa, falla(TIPO_ERROR_LLM.SALDO)),
        pasoQueEspera(lenta.promesa, exito()),
      ]),
      monitor,
    );
    const primera = adaptador.enviar([], [], opcionesCon());
    const segunda = adaptador.enviar([], [], opcionesCon());
    rapida.soltar();
    await primera;
    expect(monitor.current()).toBe(ESTADO_LLM.SALDO_AGOTADO);
    lenta.soltar();
    await segunda;
    expect(monitor.current()).toBe(ESTADO_LLM.DISPONIBLE);
  });
});
