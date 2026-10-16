import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { enviarMensaje } from "@web/api/flujo-chat.ts";
import { ACCION_UI, ESTADO_TARJETA_CONFIRMACION } from "@web/config/constants/ui.constants.ts";
import { TEXTO_CHAT, TEXTO_CONFIRMACION } from "@web/config/strings.ts";
import {
  anuncioDeEstado,
  estadoInicialConversacion,
  reducirConversacion,
} from "@web/features/chat/estado/conversacion.ts";
import { reducirConfirmaciones, tarjetasDelTurno } from "@web/features/confirmacion/estado/confirmaciones.ts";
import type {
  AccionDeTarjeta,
  AccionUi,
  EstadoConversacion,
  TarjetaDeConfirmacion,
  TurnoConversacion,
} from "@web/types/chat.type.ts";
import { ACCION, CODIGO_AGENTE, MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { TIPO_ACCION } from "@/config/constants/confirmation.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import type { SseEvent } from "@/http/types/api.type.ts";

const SESION = "sesion-de-confirmaciones";
const TURNO = "turno-confirmaciones";
const EC = "ec-corp-andina";
const HN = "hn-agroexport-sula";
const ARMAR = NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE];
const ENVIAR = NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO];
const VENCIDO = "Certificado bancario vencido";
const SIN_FIRMA = "Falta la firma del representante legal";
const { ABIERTA, REGISTRADA, CANCELADA, REEMPLAZADA } = ESTADO_TARJETA_CONFIRMACION;

let secuencia = 0;

function evento(eventoDelServidor: SseEvent): AccionUi {
  return { tipo: ACCION_UI.EVENTO, evento: eventoDelServidor };
}

function turno(mensaje: string, accion?: AccionDeTarjeta): readonly AccionUi[] {
  return [
    accion === undefined ? { tipo: ACCION_UI.ENVIAR, mensaje } : { tipo: ACCION_UI.ENVIAR, mensaje, accion },
    evento({
      tipo: TIPO_EVENTO.INICIO_TURNO,
      sesionId: SESION,
      turnoId: TURNO,
      sesionNueva: false,
      sesionExpirada: false,
    }),
  ];
}

function llamada(herramienta: string, caso: string, ok = true): readonly AccionUi[] {
  secuencia += 1;
  const llamadaId = `call_${secuencia}`;
  return [
    evento({
      tipo: TIPO_EVENTO.INICIO_HERRAMIENTA,
      turnoId: TURNO,
      llamadaId,
      herramienta,
      caso,
      argumentos: { caso },
    }),
    evento({
      tipo: TIPO_EVENTO.FIN_HERRAMIENTA,
      turnoId: TURNO,
      llamadaId,
      herramienta,
      caso,
      ok,
      codigo: ok ? null : CODIGO_ERROR.CASO_NO_ENCONTRADO,
      resumen: null,
      resultado: null,
    }),
  ];
}

function confirmacion(caso: string, bloqueosLegibles: readonly string[] = [VENCIDO]): AccionUi {
  return evento({
    tipo: TIPO_EVENTO.CONFIRMACION_REQUERIDA,
    turnoId: TURNO,
    caso,
    accion: ACCION.ENVIO,
    bloqueos: [],
    bloqueosLegibles,
  });
}

const finDeTurno = evento({
  tipo: TIPO_EVENTO.FIN_TURNO,
  turnoId: TURNO,
  motivo: MOTIVO_FIN.FINAL,
  needsConfirmation: false,
});

function aplicar(acciones: readonly AccionUi[], desde: EstadoConversacion = estadoInicialConversacion) {
  return acciones.reduce(reducirConversacion, desde);
}

function confirmar(caso: string): AccionDeTarjeta {
  return { tipo: TIPO_ACCION.CONFIRMAR, caso };
}

function cancelarCaso(caso: string): AccionDeTarjeta {
  return { tipo: TIPO_ACCION.CANCELAR, caso };
}

function resumen(tarjetas: readonly TarjetaDeConfirmacion[]) {
  return tarjetas.map(({ caso, turno: abiertaEn, estado, enviando }) => ({
    caso,
    abiertaEn,
    estado,
    enviando,
  }));
}

const procesarEc: readonly AccionUi[] = [
  ...turno(`Procesa el caso ${EC}`),
  ...llamada(ARMAR, EC),
  confirmacion(EC),
  finDeTurno,
];

describe("reducirConfirmaciones: la tarjeta sigue solo los eventos del servidor (D-69)", () => {
  test("sin confirmation_required no hay tarjetas", () => {
    const estado = aplicar([...turno("hola"), finDeTurno]);
    expect(estado.tarjetasConfirmacion).toEqual([]);
  });

  test("confirmation_required abre una tarjeta en el turno que la pidió", () => {
    const estado = aplicar(procesarEc);
    expect(estado.tarjetasConfirmacion).toEqual([
      {
        clave: 0,
        caso: EC,
        turno: 0,
        bloqueosLegibles: [VENCIDO],
        estado: ABIERTA,
        resueltaEnTurno: null,
        enviando: null,
      },
    ]);
  });

  test("la tarjeta no se abre hasta turn_end aunque ya llegó el evento", () => {
    const enCurso = aplicar([...turno(`Procesa el caso ${EC}`), ...llamada(ARMAR, EC), confirmacion(EC)]);
    expect(enCurso.tarjetasConfirmacion).toEqual([]);
  });

  test("si el turno siguiente vuelve a pedir la confirmación, la tarjeta sigue abierta con los bloqueos nuevos", () => {
    const estado = aplicar([
      ...procesarEc,
      ...turno("¿Qué falta?"),
      confirmacion(EC, [VENCIDO, SIN_FIRMA]),
      finDeTurno,
    ]);
    expect(estado.tarjetasConfirmacion).toHaveLength(1);
    expect(estado.tarjetasConfirmacion[0]).toMatchObject({
      caso: EC,
      turno: 0,
      estado: ABIERTA,
      bloqueosLegibles: [VENCIDO, SIN_FIRMA],
    });
  });

  test("un simular_envio con ok para su caso la deja en 'Envío registrado'", () => {
    const estado = aplicar([
      ...procesarEc,
      ...turno(`Sí, envía ${EC}`, confirmar(EC)),
      ...llamada(ENVIAR, EC),
      finDeTurno,
    ]);
    expect(resumen(estado.tarjetasConfirmacion)).toEqual([
      { caso: EC, abiertaEn: 0, estado: REGISTRADA, enviando: null },
    ]);
    expect(estado.tarjetasConfirmacion[0]?.resueltaEnTurno).toBe(1);
  });

  test("un simular_envio con ok false no registra nada y la tarjeta sigue abierta si el servidor la repite", () => {
    const estado = aplicar([
      ...procesarEc,
      ...turno(`Sí, envía ${EC}`, confirmar(EC)),
      ...llamada(ENVIAR, EC, false),
      confirmacion(EC),
      finDeTurno,
    ]);
    expect(resumen(estado.tarjetasConfirmacion)).toEqual([
      { caso: EC, abiertaEn: 0, estado: ABIERTA, enviando: null },
    ]);
  });

  test("un paquete nuevo del caso la deja 'Reemplazada' y abre otra tarjeta en ese turno", () => {
    const estado = aplicar([
      ...procesarEc,
      ...turno(`Arma de nuevo el paquete de ${EC}`),
      ...llamada(ARMAR, EC),
      confirmacion(EC, [SIN_FIRMA]),
      finDeTurno,
    ]);
    expect(resumen(estado.tarjetasConfirmacion)).toEqual([
      { caso: EC, abiertaEn: 0, estado: REEMPLAZADA, enviando: null },
      { caso: EC, abiertaEn: 1, estado: ABIERTA, enviando: null },
    ]);
    expect(estado.tarjetasConfirmacion[1]?.bloqueosLegibles).toEqual([SIN_FIRMA]);
  });

  test("si el caso sale de la compuerta sin envío, la tarjeta queda 'Envío cancelado'", () => {
    const estado = aplicar([...procesarEc, ...turno("No, no envíes nada"), finDeTurno]);
    expect(resumen(estado.tarjetasConfirmacion)).toEqual([
      { caso: EC, abiertaEn: 0, estado: CANCELADA, enviando: null },
    ]);
  });

  test("después de un envío registrado, una confirmación nueva del mismo caso abre otra tarjeta", () => {
    const estado = aplicar([
      ...procesarEc,
      ...turno(`Sí, envía ${EC}`, confirmar(EC)),
      ...llamada(ENVIAR, EC),
      finDeTurno,
      ...turno(`Arma de nuevo el paquete de ${EC}`),
      ...llamada(ARMAR, EC),
      confirmacion(EC),
      finDeTurno,
    ]);
    expect(resumen(estado.tarjetasConfirmacion)).toEqual([
      { caso: EC, abiertaEn: 0, estado: REGISTRADA, enviando: null },
      { caso: EC, abiertaEn: 2, estado: ABIERTA, enviando: null },
    ]);
  });

  test("un turno cortado no cancela ni cierra la tarjeta: sin turn_end no se sabe qué quedó pendiente", () => {
    const estado = aplicar([...procesarEc, ...turno("¿Qué falta?"), { tipo: ACCION_UI.FIN_STREAM }]);
    expect(resumen(estado.tarjetasConfirmacion)).toEqual([
      { caso: EC, abiertaEn: 0, estado: ABIERTA, enviando: null },
    ]);
  });

  test("un turno cortado sí refleja el envío que el servidor alcanzó a informar", () => {
    const estado = aplicar([
      ...procesarEc,
      ...turno(`Sí, envía ${EC}`, confirmar(EC)),
      ...llamada(ENVIAR, EC),
      { tipo: ACCION_UI.ERROR_RED },
    ]);
    expect(resumen(estado.tarjetasConfirmacion)).toEqual([
      { caso: EC, abiertaEn: 0, estado: REGISTRADA, enviando: null },
    ]);
  });

  test("la sesión ocupada responde sin repetir pendientes y la tarjeta sigue abierta", () => {
    const estado = aplicar([
      ...procesarEc,
      ...turno(`Sí, envía ${EC}`, confirmar(EC)),
      evento({
        tipo: TIPO_EVENTO.ERROR,
        turnoId: TURNO,
        codigo: CODIGO_AGENTE.SESION_OCUPADA,
        mensaje: "La sesión está ocupada.",
      }),
      evento({
        tipo: TIPO_EVENTO.FIN_TURNO,
        turnoId: TURNO,
        motivo: MOTIVO_FIN.ERROR,
        needsConfirmation: false,
      }),
    ]);
    expect(resumen(estado.tarjetasConfirmacion)).toEqual([
      { caso: EC, abiertaEn: 0, estado: ABIERTA, enviando: null },
    ]);
  });

  test("es pura: no muta la lista que recibe", () => {
    const tarjetas: readonly TarjetaDeConfirmacion[] = Object.freeze([
      Object.freeze({
        clave: 0,
        caso: EC,
        turno: 0,
        bloqueosLegibles: [VENCIDO],
        estado: ABIERTA,
        resueltaEnTurno: null,
        enviando: TIPO_ACCION.CONFIRMAR,
      }),
    ]);
    const vacio: TurnoConversacion = {
      clave: 1,
      mensaje: "hola",
      llamadas: [],
      eventos: 0,
      textos: [],
      confirmaciones: [],
      error: null,
    };
    expect(reducirConfirmaciones(tarjetas, { turno: vacio, completo: true })[0]?.estado).toBe(CANCELADA);
    expect(tarjetas[0]?.estado).toBe(ABIERTA);
  });
});

describe("el botón de la tarjeta queda 'Enviando…' hasta turn_end (UI-03)", () => {
  test("ENVIAR con accion marca enviando solo la tarjeta de su caso", () => {
    const estado = aplicar([...procesarEc, ...turno(`Sí, envía ${EC}`, confirmar(EC))]);
    expect(estado.enCurso).toBe(true);
    expect(resumen(estado.tarjetasConfirmacion)).toEqual([
      { caso: EC, abiertaEn: 0, estado: ABIERTA, enviando: TIPO_ACCION.CONFIRMAR },
    ]);
  });

  test("ENVIAR sin accion no marca ninguna tarjeta", () => {
    const estado = aplicar([...procesarEc, ...turno(`Sí, envía ${EC}`)]);
    expect(estado.tarjetasConfirmacion[0]?.enviando).toBeNull();
  });

  test("turn_end suelta el enviando aunque la tarjeta siga abierta", () => {
    const estado = aplicar([
      ...procesarEc,
      ...turno(`Sí, envía ${EC}`, confirmar(EC)),
      confirmacion(EC),
      finDeTurno,
    ]);
    expect(estado.tarjetasConfirmacion[0]?.enviando).toBeNull();
  });

  test("un error HTTP antes del stream suelta el enviando y deja la tarjeta abierta", () => {
    const estado = aplicar([
      ...procesarEc,
      { tipo: ACCION_UI.ENVIAR, mensaje: `Sí, envía ${EC}`, accion: confirmar(EC) },
      { tipo: ACCION_UI.ERROR_HTTP, status: 429, mensaje: "Demasiados mensajes seguidos." },
    ]);
    expect(resumen(estado.tarjetasConfirmacion)).toEqual([
      { caso: EC, abiertaEn: 0, estado: ABIERTA, enviando: null },
    ]);
  });
});

describe("Cancelar envío termina solo su tarjeta y varias tarjetas conviven (D-69)", () => {
  const dosPendientes: readonly AccionUi[] = [
    ...turno("Procesa los 4 casos"),
    ...llamada(ARMAR, EC),
    ...llamada(ARMAR, HN),
    confirmacion(EC),
    confirmacion(HN, [VENCIDO, SIN_FIRMA]),
    finDeTurno,
  ];

  test("dos casos pendientes abren dos tarjetas apiladas en el mismo turno", () => {
    const estado = aplicar(dosPendientes);
    expect(resumen(tarjetasDelTurno(estado.tarjetasConfirmacion, 0))).toEqual([
      { caso: EC, abiertaEn: 0, estado: ABIERTA, enviando: null },
      { caso: HN, abiertaEn: 0, estado: ABIERTA, enviando: null },
    ]);
    expect(anuncioDeEstado(estado)).toBe(
      `${TEXTO_CHAT.respuestaLista}. Confirmación requerida para ${EC}, ${HN}`,
    );
  });

  test("mientras corre el turno del clic solo la tarjeta pulsada queda enviando", () => {
    const estado = aplicar([...dosPendientes, ...turno(`Cancela el envío de ${HN}`, cancelarCaso(HN))]);
    expect(resumen(estado.tarjetasConfirmacion)).toEqual([
      { caso: EC, abiertaEn: 0, estado: ABIERTA, enviando: null },
      { caso: HN, abiertaEn: 0, estado: ABIERTA, enviando: TIPO_ACCION.CANCELAR },
    ]);
    expect(estado.enCurso).toBe(true);
  });

  test("Cancelar en hn la deja 'Envío cancelado' y ec sigue abierta con sus botones", () => {
    const estado = aplicar([
      ...dosPendientes,
      ...turno(`Cancela el envío de ${HN}`, cancelarCaso(HN)),
      confirmacion(EC),
      finDeTurno,
    ]);
    expect(resumen(estado.tarjetasConfirmacion)).toEqual([
      { caso: EC, abiertaEn: 0, estado: ABIERTA, enviando: null },
      { caso: HN, abiertaEn: 0, estado: CANCELADA, enviando: null },
    ]);
    expect(estado.enCurso).toBe(false);
  });

  test("después de cancelar hn, Confirmar en ec registra su envío y hn no cambia", () => {
    const estado = aplicar([
      ...dosPendientes,
      ...turno(`Cancela el envío de ${HN}`, cancelarCaso(HN)),
      confirmacion(EC),
      finDeTurno,
      ...turno(`Sí, envía ${EC}`, confirmar(EC)),
      ...llamada(ENVIAR, EC),
      finDeTurno,
    ]);
    expect(resumen(estado.tarjetasConfirmacion)).toEqual([
      { caso: EC, abiertaEn: 0, estado: REGISTRADA, enviando: null },
      { caso: HN, abiertaEn: 0, estado: CANCELADA, enviando: null },
    ]);
  });

  test("un rechazo por texto, que cancela todo en el servidor, cierra todas las tarjetas", () => {
    const estado = aplicar([...dosPendientes, ...turno("No, no envíes nada"), finDeTurno]);
    expect(estado.tarjetasConfirmacion.map((tarjeta) => tarjeta.estado)).toEqual([CANCELADA, CANCELADA]);
  });

  test("el botón Cancelar manda el texto visible 'Cancela el envío de {caso}'", () => {
    expect(TEXTO_CONFIRMACION.cancelar).toBe("Cancelar envío");
    expect(TEXTO_CONFIRMACION.mensaje(cancelarCaso(HN))).toBe(`Cancela el envío de ${HN}`);
  });
});

describe("la tarjeta en la línea de tiempo y la región viva", () => {
  test("cada tarjeta pertenece al turno que la abrió", () => {
    const estado = aplicar([...procesarEc, ...turno("¿Qué falta?"), confirmacion(EC), finDeTurno]);
    expect(tarjetasDelTurno(estado.tarjetasConfirmacion, 0)).toHaveLength(1);
    expect(tarjetasDelTurno(estado.tarjetasConfirmacion, 1)).toHaveLength(0);
  });

  test("la región viva anuncia la confirmación requerida del turno que la abrió", () => {
    expect(anuncioDeEstado(aplicar(procesarEc))).toBe(
      `${TEXTO_CHAT.respuestaLista}. Confirmación requerida para ${EC}`,
    );
    const repetida = aplicar([...procesarEc, ...turno("¿Qué falta?"), confirmacion(EC), finDeTurno]);
    expect(anuncioDeEstado(repetida)).toBe(TEXTO_CHAT.respuestaLista);
  });
});

describe("copia de la tarjeta de confirmación", () => {
  test("usa los textos del contrato y nunca habla de un correo real", () => {
    expect(TEXTO_CONFIRMACION.titulo).toBe("Confirmación requerida · Envío simulado");
    expect(TEXTO_CONFIRMACION.accion).toBe("Acción: Envío simulado");
    expect(TEXTO_CONFIRMACION.nota).toBe(
      "Confirmar registra solo ENVIO-SIMULADO.md. No se envía ningún correo real.",
    );
    expect(TEXTO_CONFIRMACION.conBloqueos(2)).toBe("Se registrará con 2 bloqueo(s).");
    expect(TEXTO_CONFIRMACION.confirmar).toBe("Confirmar envío simulado");
    expect(TEXTO_CONFIRMACION.enviando).toBe("Enviando…");
    expect(TEXTO_CONFIRMACION.ocupada).toBe("Espera a que termine la respuesta actual.");
    expect(TEXTO_CONFIRMACION.desenlace(REGISTRADA)).toBe("Envío registrado");
    expect(TEXTO_CONFIRMACION.desenlace(CANCELADA)).toBe("Envío cancelado");
    expect(TEXTO_CONFIRMACION.desenlace(REEMPLAZADA)).toBe("Reemplazada por una confirmación nueva");
  });

  test("el botón Confirmar manda el texto visible 'Sí, envía {caso}'", () => {
    expect(TEXTO_CONFIRMACION.mensaje(confirmar(HN))).toBe(`Sí, envía ${HN}`);
  });
});

describe("enviarMensaje con la accion estructurada (D-68)", () => {
  let restaurar: (() => void) | null = null;

  afterEach(() => {
    restaurar?.();
    restaurar = null;
  });

  async function cuerpoEnviado(pedido: Parameters<typeof enviarMensaje>[0]): Promise<unknown> {
    const espia = spyOn(globalThis, "fetch").mockImplementation(
      Object.assign(async () => new Response("", { status: 200 }), { preconnect: () => undefined }),
    );
    restaurar = () => espia.mockRestore();
    await enviarMensaje(pedido, () => undefined, new AbortController().signal);
    const [, init] = espia.mock.calls[0] ?? [];
    return JSON.parse(String(init?.body));
  }

  test("manda el texto visible junto con { tipo, caso }", async () => {
    const pedido = { sessionId: SESION, message: `Sí, envía ${EC}`, accion: confirmar(EC) };
    expect(await cuerpoEnviado(pedido)).toEqual(pedido);
  });

  test("sin accion el cuerpo no lleva la clave", async () => {
    const cuerpo = await cuerpoEnviado({ sessionId: SESION, message: "hola" });
    expect(cuerpo).toEqual({ sessionId: SESION, message: "hola" });
  });
});
