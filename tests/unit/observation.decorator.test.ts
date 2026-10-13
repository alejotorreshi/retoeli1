import { describe, expect, test } from "bun:test";
import {
  crearAdaptadorGuion,
  exito,
  falla,
  MODELO_PRIMARIO,
  opcionesCon,
  PROVEEDOR_PRIMARIO,
} from "@tests/helpers/adaptador-guion.helper.ts";
import { TIPO_ERROR_LLM } from "@/config/constants/llm.constants.ts";
import { withObservation } from "@/llm/decorators/observation.decorator.ts";
import type { ErrorLlm, FalloLlm, ObservadorLlm } from "@/llm/types/llm.type.ts";

function observadorQueAnota(): {
  readonly fallos: FalloLlm[];
  readonly cambios: ErrorLlm[];
  readonly observador: ObservadorLlm;
} {
  const fallos: FalloLlm[] = [];
  const cambios: ErrorLlm[] = [];
  return {
    fallos,
    cambios,
    observador: { fallo: (fallo) => fallos.push(fallo), cambio: (error) => cambios.push(error) },
  };
}

describe("withObservation", () => {
  test("informa cada intento fallido con el proveedor, el modelo, la duración y el error", async () => {
    const error = falla(TIPO_ERROR_LLM.SERVIDOR);
    const { fallos, observador } = observadorQueAnota();
    const resultado = await withObservation(crearAdaptadorGuion([error])).enviar([], [], {
      ...opcionesCon(),
      observador,
    });
    expect(resultado).toEqual(error);
    expect(fallos).toHaveLength(1);
    expect(fallos[0]).toMatchObject({
      proveedor: PROVEEDOR_PRIMARIO,
      modelo: MODELO_PRIMARIO,
      error: { tipo: TIPO_ERROR_LLM.SERVIDOR },
    });
    expect(fallos[0]?.duracionMs).toBeGreaterThanOrEqual(0);
  });

  test("un intento exitoso no se informa y el resultado no cambia", async () => {
    const { fallos, observador } = observadorQueAnota();
    const resultado = await withObservation(crearAdaptadorGuion([exito()])).enviar([], [], {
      ...opcionesCon(),
      observador,
    });
    expect(resultado).toEqual(exito());
    expect(fallos).toEqual([]);
  });

  test("sin observador en las opciones también funciona", async () => {
    const error = falla(TIPO_ERROR_LLM.RED);
    expect(await withObservation(crearAdaptadorGuion([error])).enviar([], [], opcionesCon())).toEqual(error);
  });

  test("conserva el proveedor y el modelo de la base", () => {
    const decorado = withObservation(crearAdaptadorGuion([exito()]));
    expect([decorado.proveedor, decorado.modelo]).toEqual([PROVEEDOR_PRIMARIO, MODELO_PRIMARIO]);
  });
});
