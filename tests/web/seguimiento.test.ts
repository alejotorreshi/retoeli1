import { describe, expect, test } from "bun:test";
import {
  DISTANCIA_PEGADO_AL_FINAL,
  SENAL_SEGUIMIENTO,
  VENTANA_INTENCION_USUARIA_MS,
} from "@web/config/constants/ui.constants.ts";
import { reducirSeguimiento, seguimientoInicial } from "@web/state/seguimiento.ts";
import type { EstadoSeguimiento, SenalSeguimiento } from "@web/types/ui.type.ts";

const INICIO_MS = 1_000;
const PASO_MS = 40;
const DISTANCIA_TIPO_A = 326;
const DISTANCIA_TIPO_B = 424;
const DISTANCIA_DE_LECTURA = 300;
const DISTANCIAS_DEMO_375 = [
  310, 326, 340, 300, 355, 372, 388, 401, 415, 430, 424, 333, 347, 362, 391, 408,
] as const;

function aplicar(estado: EstadoSeguimiento, senales: readonly SenalSeguimiento[]): EstadoSeguimiento {
  return senales.reduce(reducirSeguimiento, estado);
}

function crecimientoYDesplazamiento(ms: number, distancia: number): readonly SenalSeguimiento[] {
  return [{ tipo: SENAL_SEGUIMIENTO.CRECIMIENTO }, { tipo: SENAL_SEGUIMIENTO.DESPLAZAMIENTO, ms, distancia }];
}

function despegado(): EstadoSeguimiento {
  return aplicar(seguimientoInicial, [
    { tipo: SENAL_SEGUIMIENTO.INTENCION, ms: INICIO_MS },
    { tipo: SENAL_SEGUIMIENTO.DESPLAZAMIENTO, ms: INICIO_MS + 100, distancia: DISTANCIA_DE_LECTURA },
  ]);
}

describe("reducirSeguimiento", () => {
  test("arranca pegado al final y sin contenido nuevo", () => {
    expect(seguimientoInicial.pegado).toBe(true);
    expect(seguimientoInicial.contenidoNuevo).toBe(false);
    expect(seguimientoInicial.intencionMs).toBeNull();
  });

  test("tipo A: el scroll de la propia bajada tras un crecimiento de 326 px no despega", () => {
    const estado = aplicar(seguimientoInicial, crecimientoYDesplazamiento(INICIO_MS, DISTANCIA_TIPO_A));
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
  });

  test("tipo B: el ajuste del scroll anchoring con 424 px de distancia no despega", () => {
    const estado = reducirSeguimiento(seguimientoInicial, {
      tipo: SENAL_SEGUIMIENTO.DESPLAZAMIENTO,
      ms: INICIO_MS,
      distancia: DISTANCIA_TIPO_B,
    });
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
  });

  test("regresión de 2 o más casos a 375×667: 16 crecimientos y scrolls sin intención dejan la vista pegada", () => {
    const senales = DISTANCIAS_DEMO_375.flatMap((distancia, indice) =>
      crecimientoYDesplazamiento(INICIO_MS + indice * PASO_MS, distancia),
    );
    const cierreDelTurno: readonly SenalSeguimiento[] = [
      { tipo: SENAL_SEGUIMIENTO.CRECIMIENTO },
      {
        tipo: SENAL_SEGUIMIENTO.DESPLAZAMIENTO,
        ms: INICIO_MS + DISTANCIAS_DEMO_375.length * PASO_MS,
        distancia: DISTANCIA_TIPO_B,
      },
    ];
    const estado = aplicar(seguimientoInicial, [...senales, ...cierreDelTurno]);
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
  });

  test("con intención de la usuaria y distancia mayor que el umbral se despega y el crecimiento marca contenido nuevo", () => {
    const estado = despegado();
    expect(estado.pegado).toBe(false);
    expect(estado.contenidoNuevo).toBe(false);
    const conNuevo = reducirSeguimiento(estado, { tipo: SENAL_SEGUIMIENTO.CRECIMIENTO });
    expect(conNuevo.pegado).toBe(false);
    expect(conNuevo.contenidoNuevo).toBe(true);
  });

  test("mandar un mensaje vuelve a pegar y apaga el contenido nuevo", () => {
    const conNuevo = reducirSeguimiento(despegado(), { tipo: SENAL_SEGUIMIENTO.CRECIMIENTO });
    const estado = reducirSeguimiento(conNuevo, { tipo: SENAL_SEGUIMIENTO.ENVIO });
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
    expect(estado.intencionMs).toBeNull();
  });

  test("'Ir al final' vuelve a pegar y apaga el contenido nuevo", () => {
    const conNuevo = reducirSeguimiento(despegado(), { tipo: SENAL_SEGUIMIENTO.CRECIMIENTO });
    const estado = reducirSeguimiento(conNuevo, { tipo: SENAL_SEGUIMIENTO.IR_AL_FINAL });
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
    expect(estado.intencionMs).toBeNull();
  });

  test("un scroll que llega después de la ventana de intención se ignora", () => {
    const estado = aplicar(seguimientoInicial, [
      { tipo: SENAL_SEGUIMIENTO.INTENCION, ms: INICIO_MS },
      {
        tipo: SENAL_SEGUIMIENTO.DESPLAZAMIENTO,
        ms: INICIO_MS + VENTANA_INTENCION_USUARIA_MS + 1,
        distancia: DISTANCIA_DE_LECTURA,
      },
    ]);
    expect(estado.pegado).toBe(true);
  });

  test("con intención y distancia dentro del umbral vuelve a pegar y apaga el contenido nuevo", () => {
    const conNuevo = reducirSeguimiento(despegado(), { tipo: SENAL_SEGUIMIENTO.CRECIMIENTO });
    const estado = aplicar(conNuevo, [
      { tipo: SENAL_SEGUIMIENTO.INTENCION, ms: INICIO_MS + 2_000 },
      {
        tipo: SENAL_SEGUIMIENTO.DESPLAZAMIENTO,
        ms: INICIO_MS + 2_050,
        distancia: DISTANCIA_PEGADO_AL_FINAL,
      },
    ]);
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
  });

  test("las señales que no cambian nada devuelven el mismo estado", () => {
    expect(reducirSeguimiento(seguimientoInicial, { tipo: SENAL_SEGUIMIENTO.CRECIMIENTO })).toBe(
      seguimientoInicial,
    );
    expect(
      reducirSeguimiento(seguimientoInicial, {
        tipo: SENAL_SEGUIMIENTO.DESPLAZAMIENTO,
        ms: INICIO_MS,
        distancia: DISTANCIA_TIPO_A,
      }),
    ).toBe(seguimientoInicial);
  });
});
