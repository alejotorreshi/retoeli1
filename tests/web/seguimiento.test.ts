import { describe, expect, test } from "bun:test";
import { DISTANCIA_PEGADO_AL_FINAL, SENAL_SEGUIMIENTO } from "@web/config/constants/ui.constants.ts";
import { reducirSeguimiento, seguimientoInicial } from "@web/features/chat/estado/seguimiento.ts";
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
const POSICION_INICIO_WR_04 = 2_000;
const PULSACIONES_WR_04 = 10;
const CRECIMIENTO_ENTRE_PULSACIONES = 50;
const PASO_DE_TRACKPAD_LENTO = 4;
const POSICION_FRACCIONARIA_AL_FONDO = 1_000.5;
const DISTANCIA_FRACCIONARIA_AL_FONDO = 0.5;
const CRECIMIENTO_DEBAJO = 80;
const DISTANCIA_TRAS_CRECER = DISTANCIA_DE_LECTURA + CRECIMIENTO_DEBAJO;
const POSICION_ANTES_DE_LA_FLECHA_375 = 8_149;
const AJUSTE_DEL_ANCLAJE_375 = 80;
const FOTOGRAMAS_DE_LA_FLECHA_375 = [
  { posicion: 8_147, distancia: 2 },
  { posicion: 8_143, distancia: 5 },
  { posicion: 8_108, distancia: 41 },
] as const;
const DISTANCIA_TRAS_LA_FLECHA_375 = 41;
const POSICION_TRAS_LA_FLECHA_375 = 8_108;
const POSICION_TRAS_EL_ANCLAJE_375 = POSICION_TRAS_LA_FLECHA_375 + AJUSTE_DEL_ANCLAJE_375;
const SUBIDA_DE_RUEDA = 160;
const PASO_DE_FLECHA_ABAJO = 20;
const DISTANCIAS_DEMO_375 = [
  310, 326, 340, 300, 355, 372, 388, 401, 415, 430, 424, 333, 347, 362, 391, 408,
] as const;

function ajustePropio(posicion: number): SenalSeguimiento {
  return { tipo: SENAL_SEGUIMIENTO.AJUSTE_PROPIO, posicion };
}

function desplazamiento(posicion: number, distancia: number): SenalSeguimiento {
  return { tipo: SENAL_SEGUIMIENTO.DESPLAZAMIENTO, posicion, distancia };
}

function crecimiento(distancia: number): SenalSeguimiento {
  return { tipo: SENAL_SEGUIMIENTO.CRECIMIENTO, distancia };
}

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

function secuenciaWr04(): SenalSeguimiento[] {
  const pulsaciones = Array.from({ length: PULSACIONES_WR_04 }, (_, indice) => {
    const posicionPrevia = POSICION_INICIO_WR_04 + indice * (CRECIMIENTO_ENTRE_PULSACIONES - PASO_DE_FLECHA);
    const distancia = (indice + 1) * PASO_DE_FLECHA;
    const trasLaFlecha = posicionPrevia - PASO_DE_FLECHA;
    return [
      desplazamiento(trasLaFlecha, distancia),
      crecimiento(distancia),
      desplazamiento(trasLaFlecha + CRECIMIENTO_ENTRE_PULSACIONES, distancia),
    ];
  });
  return [ajustePropio(POSICION_INICIO_WR_04), ...pulsaciones.flat()];
}

function despegado(): EstadoSeguimiento {
  return aplicar(seguimientoInicial, [
    ajustePropio(POSICION_DE_LECTURA),
    desplazamiento(POSICION_DE_LECTURA - DISTANCIA_DE_LECTURA, DISTANCIA_DE_LECTURA),
  ]);
}

function conContenidoNuevo(): EstadoSeguimiento {
  return reducirSeguimiento(despegado(), crecimiento(DISTANCIA_TRAS_CRECER));
}

describe("reducirSeguimiento", () => {
  test("arranca pegado al final, sin contenido nuevo y sin posición conocida", () => {
    expect(seguimientoInicial.pegado).toBe(true);
    expect(seguimientoInicial.contenidoNuevo).toBe(false);
    expect(seguimientoInicial.posicion).toBeNull();
    expect(seguimientoInicial.distancia).toBeNull();
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
    const conNuevo = reducirSeguimiento(estado, crecimiento(DISTANCIA_TRAS_CRECER));
    expect(conNuevo.pegado).toBe(false);
    expect(conNuevo.contenidoNuevo).toBe(true);
    expect(conNuevo.distancia).toBe(DISTANCIA_TRAS_CRECER);
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
    expect(reducirSeguimiento(seguimientoInicial, crecimiento(DISTANCIA_DE_LECTURA))).toBe(
      seguimientoInicial,
    );
    expect(reducirSeguimiento(seguimientoInicial, { tipo: SENAL_SEGUIMIENTO.ENVIO })).toBe(
      seguimientoInicial,
    );
    const anotado = reducirSeguimiento(seguimientoInicial, ajustePropio(POSICION_TIPO_A));
    expect(reducirSeguimiento(anotado, ajustePropio(POSICION_TIPO_A))).toBe(anotado);
    const medido = reducirSeguimiento(anotado, desplazamiento(POSICION_TIPO_A, DISTANCIA_TIPO_A));
    expect(reducirSeguimiento(medido, desplazamiento(POSICION_TIPO_A, DISTANCIA_TIPO_A))).toBe(medido);
    const conNuevo = conContenidoNuevo();
    expect(reducirSeguimiento(conNuevo, crecimiento(DISTANCIA_TRAS_CRECER))).toBe(conNuevo);
  });
});

describe("D-78: el seguimiento se despega con cualquier subida de la usuaria", () => {
  test("barra (D-78.1): el primer tramo de 40 px ya despega sin ventana de tiempo y el crecimiento marca contenido nuevo", () => {
    const anotado = reducirSeguimiento(seguimientoInicial, ajustePropio(POSICION_DE_LECTURA));
    const primerTramo = reducirSeguimiento(
      anotado,
      desplazamiento(POSICION_DE_LECTURA - PASO_DE_FLECHA, PASO_DE_FLECHA),
    );
    expect(primerTramo.pegado).toBe(false);
    const segundoTramo = reducirSeguimiento(primerTramo, desplazamiento(900, 100));
    expect(segundoTramo.pegado).toBe(false);
    const conNuevo = reducirSeguimiento(segundoTramo, crecimiento(100));
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

  test("flechas (D-78.1): con 40 px por pulsación, la primera ya despega y las siguientes siguen despegadas", () => {
    const pulsaciones = [1, 2, 3].map((pulsacion) =>
      desplazamiento(POSICION_ANTES_DE_PAGE_UP - pulsacion * PASO_DE_FLECHA, pulsacion * PASO_DE_FLECHA),
    );
    const anotado = reducirSeguimiento(seguimientoInicial, ajustePropio(POSICION_ANTES_DE_PAGE_UP));
    const [primera, segunda, tercera] = recorrer(anotado, pulsaciones);
    expect(primera?.pegado).toBe(false);
    expect(segunda?.pegado).toBe(false);
    expect(tercera?.pegado).toBe(false);
  });

  test("inercia táctil: los scrolls hacia arriba despegan, la vista no vuelve al final y aparece contenido nuevo", () => {
    const posiciones = posicionesDeInercia();
    const senales = posiciones.flatMap((posicion, indice) => {
      const distancia = POSICION_INICIO_INERCIA - posicion + indice * CRECIMIENTO_DURANTE_INERCIA;
      return [crecimiento(distancia), desplazamiento(posicion, distancia)];
    });
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
      crecimiento(DISTANCIA_TIPO_A),
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

  test("una subida que deja la vista dentro del umbral despega (D-78.1)", () => {
    const estado = aplicar(seguimientoInicial, [
      ajustePropio(POSICION_DE_LECTURA),
      desplazamiento(POSICION_DE_LECTURA - SUBIDA_DENTRO_DEL_UMBRAL, SUBIDA_DENTRO_DEL_UMBRAL),
    ]);
    expect(estado.pegado).toBe(false);
  });

  test("regresión de 2 o más casos a 375×667: 16 crecimientos con sus scrolls propios dejan la vista pegada", () => {
    const senales = DISTANCIAS_DEMO_375.flatMap((distancia, indice) => {
      const posicion = POSICION_INICIAL_DEMO_375 + indice * PASO_DE_POSICION_DEMO_375;
      return [ajustePropio(posicion), crecimiento(distancia), desplazamiento(posicion, distancia)];
    });
    const ultima = POSICION_INICIAL_DEMO_375 + (DISTANCIAS_DEMO_375.length - 1) * PASO_DE_POSICION_DEMO_375;
    const cierreTipoB = [
      crecimiento(DISTANCIA_TIPO_B),
      desplazamiento(ultima + POSICION_TRAS_EL_ANCLAJE - POSICION_ANTES_DEL_ANCLAJE, DISTANCIA_TIPO_B),
    ];
    const estado = aplicar(seguimientoInicial, [...senales, ...cierreTipoB]);
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
  });
});

describe("D-78.1: gana la dirección", () => {
  test("WR-04: 10 flechas de 40 px con crecimiento y scroll de anclaje intercalados despegan en la primera y no vuelven a pegar", () => {
    const estados = recorrer(seguimientoInicial, secuenciaWr04());
    const trasLaPrimeraFlecha = estados.slice(1);
    expect(trasLaPrimeraFlecha.length).toBe(PULSACIONES_WR_04 * 3);
    expect(trasLaPrimeraFlecha.every((estado) => !estado.pegado)).toBe(true);
    expect(estados.at(-1)?.contenidoNuevo).toBe(true);
  });

  test("trackpad lento: una subida de 4 px con crecimiento intercalado despega", () => {
    const estado = aplicar(seguimientoInicial, [
      ajustePropio(POSICION_INICIO_WR_04),
      crecimiento(PASO_DE_TRACKPAD_LENTO),
      desplazamiento(POSICION_INICIO_WR_04 - PASO_DE_TRACKPAD_LENTO, PASO_DE_TRACKPAD_LENTO),
    ]);
    expect(estado.pegado).toBe(false);
  });

  test("tolerancia del fondo: una posición fraccionaria a 1 px o menos del fondo no despega", () => {
    const estado = aplicar(seguimientoInicial, [
      ajustePropio(POSICION_FRACCIONARIA_AL_FONDO),
      desplazamiento(POSICION_DE_LECTURA, DISTANCIA_FRACCIONARIA_AL_FONDO),
    ]);
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
  });

  test("el umbral solo vuelve a pegar al bajar: a 97 px sigue despegada y a 96 px pega y apaga el contenido nuevo", () => {
    const lejos = reducirSeguimiento(conContenidoNuevo(), desplazamiento(903, DISTANCIA_PEGADO_AL_FINAL + 1));
    expect(lejos.pegado).toBe(false);
    expect(lejos.contenidoNuevo).toBe(true);
    const cerca = reducirSeguimiento(lejos, desplazamiento(904, DISTANCIA_PEGADO_AL_FINAL));
    expect(cerca.pegado).toBe(true);
    expect(cerca.contenidoNuevo).toBe(false);
  });

  test("una subida estando despegada sigue despegada aunque quede a 50 px del fondo", () => {
    const anterior = conContenidoNuevo();
    const posicion = (anterior.posicion ?? POSICION_DE_LECTURA) - SUBIDA_DENTRO_DEL_UMBRAL;
    const estado = reducirSeguimiento(anterior, desplazamiento(posicion, SUBIDA_DENTRO_DEL_UMBRAL));
    expect(estado.pegado).toBe(false);
    expect(estado.contenidoNuevo).toBe(true);
  });

  test("UI-08: con crecimientos intercalados, ni el ajuste propio ni el crecimiento vuelven a pegar; ENVIO sí", () => {
    const anterior = despegado();
    const estados = recorrer(anterior, [
      crecimiento(DISTANCIA_TRAS_CRECER),
      ajustePropio(POSICION_DE_LECTURA),
      crecimiento(DISTANCIA_TRAS_CRECER),
      ajustePropio(POSICION_INICIO_WR_04),
    ]);
    expect(estados.every((estado) => !estado.pegado)).toBe(true);
    const enviado = reducirSeguimiento(estados.at(-1) ?? anterior, { tipo: SENAL_SEGUIMIENTO.ENVIO });
    expect(enviado.pegado).toBe(true);
    expect(enviado.contenidoNuevo).toBe(false);
  });
});

function subidaConAnclaje(posicion: number, subida: number): SenalSeguimiento[] {
  return [
    ajustePropio(posicion),
    desplazamiento(posicion - subida, subida),
    crecimiento(subida),
    desplazamiento(posicion - subida + AJUSTE_DEL_ANCLAJE_375, subida),
  ];
}

function secuenciaDelDiagnostico375(): SenalSeguimiento[] {
  return [
    ajustePropio(POSICION_ANTES_DE_LA_FLECHA_375),
    desplazamiento(POSICION_TRAS_LA_FLECHA_375, DISTANCIA_TRAS_LA_FLECHA_375),
    crecimiento(DISTANCIA_TRAS_LA_FLECHA_375),
    desplazamiento(POSICION_TRAS_EL_ANCLAJE_375, DISTANCIA_TRAS_LA_FLECHA_375),
  ];
}

function trazaCompleta375(): SenalSeguimiento[] {
  return [
    ajustePropio(POSICION_ANTES_DE_LA_FLECHA_375),
    ...FOTOGRAMAS_DE_LA_FLECHA_375.map(({ posicion, distancia }) => desplazamiento(posicion, distancia)),
    crecimiento(DISTANCIA_TRAS_LA_FLECHA_375),
    desplazamiento(POSICION_TRAS_EL_ANCLAJE_375, DISTANCIA_TRAS_LA_FLECHA_375),
  ];
}

describe("G-03-7: el anclaje con la vista despegada no la vuelve a pegar", () => {
  test("G-03-7 diagnóstico a 375×667: flecha arriba, crecimiento y scroll de anclaje de +80 px dejan la vista despegada con contenido nuevo", () => {
    for (const senales of [secuenciaDelDiagnostico375(), trazaCompleta375()]) {
      const estados = recorrer(seguimientoInicial, senales);
      const desdeLaFlecha = estados.slice(1);
      expect(desdeLaFlecha.every((estado) => !estado.pegado)).toBe(true);
      expect(estados.at(-1)?.contenidoNuevo).toBe(true);
      expect(estados.at(-1)?.posicion).toBe(POSICION_TRAS_EL_ANCLAJE_375);
    }
  });

  test("G-03-7 bordes con anclaje: subidas de 95, 96 y 97 px quedan despegadas", () => {
    const bordes = [DISTANCIA_PEGADO_AL_FINAL - 1, DISTANCIA_PEGADO_AL_FINAL, DISTANCIA_PEGADO_AL_FINAL + 1];
    for (const subida of bordes) {
      const estado = aplicar(seguimientoInicial, subidaConAnclaje(POSICION_ANTES_DE_LA_FLECHA_375, subida));
      expect(estado.pegado).toBe(false);
      expect(estado.contenidoNuevo).toBe(true);
    }
  });

  test("G-03-7 bajada real: despegada lejos tras el anclaje, a 97 px sigue despegada y a 96 px vuelve a pegar", () => {
    const trasElAnclaje = aplicar(
      seguimientoInicial,
      subidaConAnclaje(POSICION_ANTES_DE_LA_FLECHA_375, SUBIDA_DE_RUEDA),
    );
    expect(trasElAnclaje.pegado).toBe(false);
    expect(trasElAnclaje.contenidoNuevo).toBe(true);
    const posicionTrasElAnclaje = POSICION_ANTES_DE_LA_FLECHA_375 - SUBIDA_DE_RUEDA + AJUSTE_DEL_ANCLAJE_375;
    const fuera = DISTANCIA_PEGADO_AL_FINAL + 1;
    const lejos = reducirSeguimiento(
      trasElAnclaje,
      desplazamiento(posicionTrasElAnclaje + SUBIDA_DE_RUEDA - fuera, fuera),
    );
    expect(lejos.pegado).toBe(false);
    expect(lejos.contenidoNuevo).toBe(true);
    const cerca = reducirSeguimiento(
      lejos,
      desplazamiento(
        posicionTrasElAnclaje + SUBIDA_DE_RUEDA - DISTANCIA_PEGADO_AL_FINAL,
        DISTANCIA_PEGADO_AL_FINAL,
      ),
    );
    expect(cerca.pegado).toBe(true);
    expect(cerca.contenidoNuevo).toBe(false);
  });

  test("G-03-7 flecha abajo de 20 px tras el anclaje vuelve a pegar", () => {
    const trasElAnclaje = aplicar(seguimientoInicial, secuenciaDelDiagnostico375());
    expect(trasElAnclaje.pegado).toBe(false);
    const estado = reducirSeguimiento(
      trasElAnclaje,
      desplazamiento(
        POSICION_TRAS_EL_ANCLAJE_375 + PASO_DE_FLECHA_ABAJO,
        DISTANCIA_TRAS_LA_FLECHA_375 - PASO_DE_FLECHA_ABAJO,
      ),
    );
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
  });

  test("G-03-7 crecimiento abajo sin anclaje: el crecimiento refresca la distancia y bajar a 81 px vuelve a pegar", () => {
    const distanciaTrasCrecer = DISTANCIA_TRAS_LA_FLECHA_375 + CRECIMIENTO_DEBAJO;
    const crecido = aplicar(seguimientoInicial, [
      ajustePropio(POSICION_ANTES_DE_LA_FLECHA_375),
      desplazamiento(POSICION_TRAS_LA_FLECHA_375, DISTANCIA_TRAS_LA_FLECHA_375),
      crecimiento(distanciaTrasCrecer),
    ]);
    expect(crecido.pegado).toBe(false);
    expect(crecido.contenidoNuevo).toBe(true);
    expect(crecido.distancia).toBe(distanciaTrasCrecer);
    const distanciaTrasBajar = distanciaTrasCrecer - PASO_DE_FLECHA;
    expect(distanciaTrasBajar).toBeGreaterThan(DISTANCIA_TRAS_LA_FLECHA_375);
    const estado = reducirSeguimiento(
      crecido,
      desplazamiento(POSICION_TRAS_LA_FLECHA_375 + PASO_DE_FLECHA, distanciaTrasBajar),
    );
    expect(estado.pegado).toBe(true);
    expect(estado.contenidoNuevo).toBe(false);
  });
});
