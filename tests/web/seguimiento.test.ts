import { describe, expect, test } from "bun:test";
import { DISTANCIA_PEGADO_AL_FINAL, SENAL_SEGUIMIENTO } from "@web/config/constants/ui.constants.ts";
import { reducirSeguimiento, seguimientoInicial } from "@web/state/seguimiento.ts";
import type { EstadoSeguimiento, SenalSeguimiento } from "@web/types/ui.type.ts";

const POSICION_DE_LECTURA = 1_000;
const DISTANCIA_DE_LECTURA = 300;
const POSICION_TIPO_A = 344;
const DISTANCIA_TIPO_A = 326;
const POSICION_ANTES_DEL_ANCLAJE = 788;
const POSICION_TRAS_EL_ANCLAJE = 1_174;
const DISTANCIA_TIPO_B = 424;
const POSICION_INICIAL_DEMO_375 = 300;
const PASO_DE_POSICION_DEMO_375 = 120;
const POSICION_ANTES_DE_PAGE_UP = 2_000;
const ALTO_DE_PAGE_UP = 600;
const PASO_DE_FLECHA = 40;
const POSICION_INICIO_INERCIA = 1_500;
const PASOS_DE_INERCIA = [80, 75, 70, 65, 60, 55, 50, 45, 40, 30, 20, 10] as const;
const CRECIMIENTO_DURANTE_INERCIA = 20;
const POSICION_ANTES_DEL_PLIEGUE = 1_600;
const POSICION_TRAS_EL_PLIEGUE = 1_300;
const SUBIDA_DENTRO_DEL_UMBRAL = 50;
const DISTANCIAS_DEMO_375 = [
  310, 326, 340, 300, 355, 372, 388, 401, 415, 430, 424, 333, 347, 362, 391, 408,
] as const;

function ajustePropio(posicion: number): SenalSeguimiento {
  return { tipo: SENAL_SEGUIMIENTO.AJUSTE_PROPIO, posicion };
}

function desplazamiento(posicion: number, distancia: number): SenalSeguimiento {
  return { tipo: SENAL_SEGUIMIENTO.DESPLAZAMIENTO, posicion, distancia };
}

const CRECIMIENTO: SenalSeguimiento = { tipo: SENAL_SEGUIMIENTO.CRECIMIENTO };

function aplicar(estado: EstadoSeguimiento, senales: readonly SenalSeguimiento[]): EstadoSeguimiento {
  return senales.reduce(reducirSeguimiento, estado);
}

function recorrer(estado: EstadoSeguimiento, senales: readonly SenalSeguimiento[]): EstadoSeguimiento[] {
  const estados: EstadoSeguimiento[] = [];
  let actual = estado;
  for (const senal of senales) {
    actual = reducirSeguimiento(actual, senal);
    estados.push(actual);
  }
  return estados;
}

function posicionesDeInercia(): number[] {
  const posiciones: number[] = [];
  let posicion = POSICION_INICIO_INERCIA;
  for (const paso of PASOS_DE_INERCIA) {
    posicion -= paso;
    posiciones.push(posicion);
  }
  return posiciones;
}

function despegado(): EstadoSeguimiento {
  return aplicar(seguimientoInicial, [
    ajustePropio(POSICION_DE_LECTURA),
    desplazamiento(POSICION_DE_LECTURA - DISTANCIA_DE_LECTURA, DISTANCIA_DE_LECTURA),
  ]);
}

function conContenidoNuevo(): EstadoSeguimiento {
  return reducirSeguimiento(despegado(), CRECIMIENTO);
}

describe("reducirSeguimiento", () => {
  test("arranca pegado al final, sin contenido nuevo y sin posición conocida", () => {
    expect(seguimientoInicial.pegado).toBe(true);
    expect(seguimientoInicial.contenidoNuevo).toBe(false);
    expect(seguimientoInicial.posicion).toBeNull();
  });

  test("el ajuste propio solo anota la posición que fijó la bajada", () => {
    const estado = reducirSeguimiento(seguimientoInicial, ajustePropio(POSICION_TIPO_A));
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
    expect(estado.posicion).toBe(POSICION_TIPO_A);
  });

  test("despegado, el crecimiento marca contenido nuevo", () => {
    const estado = despegado();
    expect(estado.pegado).toBe(false);
    expect(estado.contenidoNuevo).toBe(false);
    const conNuevo = reducirSeguimiento(estado, CRECIMIENTO);
    expect(conNuevo.pegado).toBe(false);
    expect(conNuevo.contenidoNuevo).toBe(true);
  });

  test("bajar hasta el umbral vuelve a pegar y apaga el contenido nuevo", () => {
    const estado = reducirSeguimiento(
      conContenidoNuevo(),
      desplazamiento(POSICION_DE_LECTURA, DISTANCIA_PEGADO_AL_FINAL),
    );
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
  });

  test("mandar un mensaje vuelve a pegar, apaga el contenido nuevo y conserva la posición", () => {
    const anterior = conContenidoNuevo();
    const estado = reducirSeguimiento(anterior, { tipo: SENAL_SEGUIMIENTO.ENVIO });
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
    expect(estado.posicion).toBe(anterior.posicion);
  });

  test("'Ir al final' vuelve a pegar, apaga el contenido nuevo y conserva la posición", () => {
    const anterior = conContenidoNuevo();
    const estado = reducirSeguimiento(anterior, { tipo: SENAL_SEGUIMIENTO.IR_AL_FINAL });
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
    expect(estado.posicion).toBe(anterior.posicion);
  });

  test("las señales que no cambian nada devuelven el mismo estado", () => {
    expect(reducirSeguimiento(seguimientoInicial, CRECIMIENTO)).toBe(seguimientoInicial);
    expect(reducirSeguimiento(seguimientoInicial, { tipo: SENAL_SEGUIMIENTO.ENVIO })).toBe(
      seguimientoInicial,
    );
    const anotado = reducirSeguimiento(seguimientoInicial, ajustePropio(POSICION_TIPO_A));
    expect(reducirSeguimiento(anotado, ajustePropio(POSICION_TIPO_A))).toBe(anotado);
    expect(reducirSeguimiento(anotado, desplazamiento(POSICION_TIPO_A, DISTANCIA_TIPO_A))).toBe(anotado);
    const conNuevo = conContenidoNuevo();
    expect(reducirSeguimiento(conNuevo, CRECIMIENTO)).toBe(conNuevo);
  });
});

describe("D-78: el seguimiento se despega con cualquier subida de la usuaria", () => {
  test("barra: arrastrarla hacia arriba despega sin ventana de tiempo y el crecimiento marca contenido nuevo", () => {
    const anotado = reducirSeguimiento(seguimientoInicial, ajustePropio(POSICION_DE_LECTURA));
    const primerTramo = reducirSeguimiento(anotado, desplazamiento(960, 40));
    expect(primerTramo.pegado).toBe(true);
    const segundoTramo = reducirSeguimiento(primerTramo, desplazamiento(900, 100));
    expect(segundoTramo.pegado).toBe(false);
    const conNuevo = reducirSeguimiento(segundoTramo, CRECIMIENTO);
    expect(conNuevo.pegado).toBe(false);
    expect(conNuevo.contenidoNuevo).toBe(true);
  });

  test("PageUp con el foco en la página: una subida de 600 px despega sin ninguna señal de la sección", () => {
    const estado = aplicar(seguimientoInicial, [
      ajustePropio(POSICION_ANTES_DE_PAGE_UP),
      desplazamiento(POSICION_ANTES_DE_PAGE_UP - ALTO_DE_PAGE_UP, ALTO_DE_PAGE_UP),
    ]);
    expect(estado.pegado).toBe(false);
  });

  test("flechas: con 40 px por pulsación, la primera y la segunda siguen pegadas y la tercera despega", () => {
    const pulsaciones = [1, 2, 3].map((pulsacion) =>
      desplazamiento(POSICION_ANTES_DE_PAGE_UP - pulsacion * PASO_DE_FLECHA, pulsacion * PASO_DE_FLECHA),
    );
    const anotado = reducirSeguimiento(seguimientoInicial, ajustePropio(POSICION_ANTES_DE_PAGE_UP));
    const [primera, segunda, tercera] = recorrer(anotado, pulsaciones);
    expect(primera?.pegado).toBe(true);
    expect(segunda?.pegado).toBe(true);
    expect(tercera?.pegado).toBe(false);
  });

  test("inercia táctil: los scrolls hacia arriba despegan, la vista no vuelve al final y aparece contenido nuevo", () => {
    const posiciones = posicionesDeInercia();
    const senales = posiciones.flatMap((posicion, indice) => [
      CRECIMIENTO,
      desplazamiento(posicion, POSICION_INICIO_INERCIA - posicion + indice * CRECIMIENTO_DURANTE_INERCIA),
    ]);
    const estados = recorrer(seguimientoInicial, [ajustePropio(POSICION_INICIO_INERCIA), ...senales]);
    const despegue = estados.findIndex((estado) => !estado.pegado);
    expect(despegue).toBeGreaterThan(0);
    expect(estados.slice(despegue).every((estado) => !estado.pegado)).toBe(true);
    expect(estados.at(-1)?.posicion).toBe(posiciones.at(-1) ?? null);
    expect(estados.at(-1)?.contenidoNuevo).toBe(true);
  });

  test("auto-scroll propio (tipo A): el scroll de la bajada tras un crecimiento de 326 px no despega", () => {
    const estado = aplicar(seguimientoInicial, [
      ajustePropio(POSICION_TIPO_A),
      CRECIMIENTO,
      desplazamiento(POSICION_TIPO_A, DISTANCIA_TIPO_A),
    ]);
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
  });

  test("scroll anchoring (tipo B): el ajuste que baja la vista 386 px con 424 px de distancia no despega", () => {
    const estado = aplicar(seguimientoInicial, [
      ajustePropio(POSICION_ANTES_DEL_ANCLAJE),
      desplazamiento(POSICION_TRAS_EL_ANCLAJE, DISTANCIA_TIPO_B),
    ]);
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
  });

  test("encogimiento: el pliegue que deja la vista al fondo no despega", () => {
    const estado = aplicar(seguimientoInicial, [
      ajustePropio(POSICION_ANTES_DEL_PLIEGUE),
      desplazamiento(POSICION_TRAS_EL_PLIEGUE, 0),
    ]);
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
  });

  test("sin posición conocida, el primer desplazamiento solo anota la posición y la vista sigue pegada", () => {
    const estado = reducirSeguimiento(
      seguimientoInicial,
      desplazamiento(POSICION_DE_LECTURA, DISTANCIA_DE_LECTURA),
    );
    expect(estado.pegado).toBe(true);
    expect(estado.posicion).toBe(POSICION_DE_LECTURA);
  });

  test("una subida que deja la vista dentro del umbral sigue pegada", () => {
    const estado = aplicar(seguimientoInicial, [
      ajustePropio(POSICION_DE_LECTURA),
      desplazamiento(POSICION_DE_LECTURA - SUBIDA_DENTRO_DEL_UMBRAL, SUBIDA_DENTRO_DEL_UMBRAL),
    ]);
    expect(estado.pegado).toBe(true);
  });

  test("regresión de 2 o más casos a 375×667: 16 crecimientos con sus scrolls propios dejan la vista pegada", () => {
    const senales = DISTANCIAS_DEMO_375.flatMap((distancia, indice) => {
      const posicion = POSICION_INICIAL_DEMO_375 + indice * PASO_DE_POSICION_DEMO_375;
      return [ajustePropio(posicion), CRECIMIENTO, desplazamiento(posicion, distancia)];
    });
    const ultima = POSICION_INICIAL_DEMO_375 + (DISTANCIAS_DEMO_375.length - 1) * PASO_DE_POSICION_DEMO_375;
    const cierreTipoB = [
      CRECIMIENTO,
      desplazamiento(ultima + POSICION_TRAS_EL_ANCLAJE - POSICION_ANTES_DEL_ANCLAJE, DISTANCIA_TIPO_B),
    ];
    const estado = aplicar(seguimientoInicial, [...senales, ...cierreTipoB]);
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
  });
});
