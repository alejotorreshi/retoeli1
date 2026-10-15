import { describe, expect, test } from "bun:test";
import { ACCION_UI, ESTADO_ACCESO, RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import { TEXTO_ERROR } from "@web/config/strings.ts";
import {
  accionDeConfig,
  esFalloDeTurno,
  estadoInicialConversacion,
  reducirConversacion,
} from "@web/state/conversacion.ts";
import type { AccionUi, EstadoConversacion } from "@web/types/chat.type.ts";
import { CODIGO_AGENTE, MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { RESPUESTA_HTTP } from "@/config/constants/http.constants.ts";
import type { ConfigResponse, SseEvent } from "@/http/types/api.type.ts";

const SESION = "sesion-de-prueba";
const TURNO = "turno-1";
const MENSAJE = "procesa el caso co-industrias-delta";
const RESPUESTA = "Listo: el caso co-industrias-delta quedó mapeado.\nRevisa los faltantes.";
const MENSAJE_ERROR_AGENTE = "El proveedor tardó demasiado en responder. La sesión sigue abierta.";
const MENSAJE_MUY_LARGO = "El mensaje supera los 2000 caracteres. Acórtalo y vuelve a enviarlo.";
const TOPE_DIARIO =
  "Se alcanzó el tope diario de uso del modelo. Vuelve a intentarlo después de la medianoche (America/Bogota).";
const ACCESO_VENCIDO = "Tu acceso venció. Escribe el código de nuevo para seguir.";
const CONFIG: ConfigResponse = {
  fechaEjecucion: "2026-09-03",
  zona: "America/Bogota",
  casos: ["co-industrias-delta", "ec-corp-andina"],
  presupuestoSesion: 300_000,
  mensajeMaximo: 2000,
};

function evento(eventoDelServidor: SseEvent): AccionUi {
  return { tipo: ACCION_UI.EVENTO, evento: eventoDelServidor };
}

function aplicar(estado: EstadoConversacion, acciones: readonly AccionUi[]): EstadoConversacion {
  return acciones.reduce(reducirConversacion, estado);
}

const turnoCompleto: readonly AccionUi[] = [
  { tipo: ACCION_UI.ENVIAR, mensaje: MENSAJE },
  evento({
    tipo: TIPO_EVENTO.INICIO_TURNO,
    sesionId: SESION,
    turnoId: TURNO,
    sesionNueva: true,
    sesionExpirada: false,
  }),
  evento({ tipo: TIPO_EVENTO.TEXTO, turnoId: TURNO, texto: RESPUESTA }),
  evento({ tipo: TIPO_EVENTO.FIN_TURNO, turnoId: TURNO, motivo: MOTIVO_FIN.FINAL, needsConfirmation: false }),
];

describe("reducirConversacion", () => {
  test("el estado inicial no tiene sesión, turnos, turno en curso ni config, y verifica el acceso", () => {
    expect(estadoInicialConversacion).toEqual({
      sesionId: null,
      turnos: [],
      enCurso: false,
      acceso: { tipo: ESTADO_ACCESO.VERIFICANDO },
      config: null,
      borrador: "",
    });
  });

  test("ENVIAR agrega la burbuja de la usuaria y deja el turno en curso", () => {
    const estado = reducirConversacion(estadoInicialConversacion, {
      tipo: ACCION_UI.ENVIAR,
      mensaje: MENSAJE,
    });
    expect(estado.enCurso).toBe(true);
    expect(estado.turnos.map((turno) => turno.mensaje)).toEqual([MENSAJE]);
  });

  test("turn_start, text y turn_end dejan una burbuja, un texto del agente, la sesión y el turno cerrado", () => {
    const estado = aplicar(estadoInicialConversacion, turnoCompleto);
    expect(estado.sesionId).toBe(SESION);
    expect(estado.enCurso).toBe(false);
    expect(estado.turnos).toHaveLength(1);
    expect(estado.turnos[0]?.mensaje).toBe(MENSAJE);
    expect(estado.turnos[0]?.textos.map((texto) => texto.texto)).toEqual([RESPUESTA]);
  });

  test("un segundo ENVIAR conserva el sessionId del turno anterior", () => {
    const estado = aplicar(estadoInicialConversacion, [
      ...turnoCompleto,
      { tipo: ACCION_UI.ENVIAR, mensaje: "¿y el siguiente?" },
    ]);
    expect(estado.sesionId).toBe(SESION);
    expect(estado.enCurso).toBe(true);
    expect(estado.turnos).toHaveLength(2);
    expect(estado.turnos.map((turno) => turno.clave)).toEqual([0, 1]);
  });

  test("el evento error conserva el turno y guarda su código y su mensaje", () => {
    const estado = aplicar(estadoInicialConversacion, [
      ...turnoCompleto.slice(0, 2),
      evento({
        tipo: TIPO_EVENTO.ERROR,
        turnoId: TURNO,
        codigo: CODIGO_AGENTE.PROVEEDOR_TIMEOUT,
        mensaje: MENSAJE_ERROR_AGENTE,
      }),
    ]);
    expect(estado.turnos).toHaveLength(1);
    expect(estado.turnos[0]?.mensaje).toBe(MENSAJE);
    expect(estado.turnos[0]?.error).toEqual({
      codigo: CODIGO_AGENTE.PROVEEDOR_TIMEOUT,
      mensaje: MENSAJE_ERROR_AGENTE,
    });
    expect(estado.enCurso).toBe(true);
  });

  test("el error del turno sigue visible después de turn_end", () => {
    const estado = aplicar(estadoInicialConversacion, [
      ...turnoCompleto.slice(0, 2),
      evento({
        tipo: TIPO_EVENTO.ERROR,
        turnoId: TURNO,
        codigo: CODIGO_AGENTE.PROVEEDOR_TIMEOUT,
        mensaje: MENSAJE_ERROR_AGENTE,
      }),
      evento({
        tipo: TIPO_EVENTO.FIN_TURNO,
        turnoId: TURNO,
        motivo: MOTIVO_FIN.ERROR,
        needsConfirmation: false,
      }),
    ]);
    expect(estado.enCurso).toBe(false);
    expect(estado.turnos[0]?.error?.mensaje).toBe(MENSAJE_ERROR_AGENTE);
  });

  test("ERROR_HTTP 413 guarda el mensaje del servidor y cierra el turno", () => {
    const estado = aplicar(estadoInicialConversacion, [
      { tipo: ACCION_UI.ENVIAR, mensaje: MENSAJE },
      { tipo: ACCION_UI.ERROR_HTTP, status: 413, mensaje: MENSAJE_MUY_LARGO },
    ]);
    expect(estado.enCurso).toBe(false);
    expect(estado.turnos).toHaveLength(1);
    expect(estado.turnos[0]?.error).toEqual({ codigo: null, mensaje: MENSAJE_MUY_LARGO });
  });

  test("ERROR_RED guarda la copia de red caída del front y cierra el turno", () => {
    const estado = aplicar(estadoInicialConversacion, [
      { tipo: ACCION_UI.ENVIAR, mensaje: MENSAJE },
      { tipo: ACCION_UI.ERROR_RED },
    ]);
    expect(estado.enCurso).toBe(false);
    expect(estado.turnos[0]?.error).toEqual({ codigo: null, mensaje: TEXTO_ERROR.sinConexion });
  });

  test("FIN_STREAM sin turn_end guarda la copia de stream cortado, conserva el texto y cierra el turno", () => {
    const estado = aplicar(estadoInicialConversacion, [
      ...turnoCompleto.slice(0, 3),
      { tipo: ACCION_UI.FIN_STREAM },
    ]);
    expect(estado.enCurso).toBe(false);
    expect(estado.sesionId).toBe(SESION);
    expect(estado.turnos[0]?.textos.map((texto) => texto.texto)).toEqual([RESPUESTA]);
    expect(estado.turnos[0]?.error).toEqual({ codigo: null, mensaje: TEXTO_ERROR.streamCortado });
  });

  test("FIN_STREAM después de turn_end no cambia el estado", () => {
    const cerrado = aplicar(estadoInicialConversacion, turnoCompleto);
    expect(reducirConversacion(cerrado, { tipo: ACCION_UI.FIN_STREAM })).toBe(cerrado);
  });

  test("los eventos que la pantalla todavía no pinta solo mueven la marca de eventos del turno", () => {
    const enCurso = reducirConversacion(estadoInicialConversacion, {
      tipo: ACCION_UI.ENVIAR,
      mensaje: MENSAJE,
    });
    const estado = reducirConversacion(
      enCurso,
      evento({
        tipo: TIPO_EVENTO.USO,
        turnoId: TURNO,
        entrada: 10,
        salida: 5,
        cacheHit: 0,
        totalSesion: 15,
        proveedor: "falso",
        modelo: "modelo-falso",
      }),
    );
    expect(estado).toEqual({
      ...enCurso,
      turnos: enCurso.turnos.map((turno) => ({ ...turno, eventos: turno.eventos + 1 })),
    });
  });

  test("ERROR_HTTP 401 pide el acceso con el mensaje del servidor y conserva el sessionId", () => {
    const estado = aplicar(estadoInicialConversacion, [
      { tipo: ACCION_UI.CONFIG_RECIBIDA, config: CONFIG },
      ...turnoCompleto,
      { tipo: ACCION_UI.ENVIAR, mensaje: "¿y el siguiente?" },
      { tipo: ACCION_UI.ERROR_HTTP, status: RESPUESTA_HTTP.NO_AUTORIZADO, mensaje: ACCESO_VENCIDO },
    ]);
    expect(estado.acceso).toEqual({ tipo: ESTADO_ACCESO.PEDIDO, aviso: ACCESO_VENCIDO });
    expect(estado.sesionId).toBe(SESION);
    expect(estado.config).toEqual(CONFIG);
    expect(estado.enCurso).toBe(false);
  });

  test("ERROR_HTTP 401 quita el turno que el servidor no recibió y deja intacta la conversación anterior", () => {
    const estado = aplicar(estadoInicialConversacion, [
      ...turnoCompleto,
      { tipo: ACCION_UI.ENVIAR, mensaje: "¿y el siguiente?" },
      { tipo: ACCION_UI.ERROR_HTTP, status: RESPUESTA_HTTP.NO_AUTORIZADO, mensaje: ACCESO_VENCIDO },
    ]);
    expect(estado.turnos.map((turno) => turno.mensaje)).toEqual([MENSAJE]);
    expect(estado.turnos[0]?.textos.map((texto) => texto.texto)).toEqual([RESPUESTA]);
    expect(estado.turnos[0]?.error).toBeNull();
  });

  test("volver a recibir la config después del 401 regresa al chat con la misma sesión", () => {
    const estado = aplicar(estadoInicialConversacion, [
      ...turnoCompleto,
      { tipo: ACCION_UI.ENVIAR, mensaje: "¿y el siguiente?" },
      { tipo: ACCION_UI.ERROR_HTTP, status: RESPUESTA_HTTP.NO_AUTORIZADO, mensaje: ACCESO_VENCIDO },
      { tipo: ACCION_UI.CONFIG_RECIBIDA, config: CONFIG },
    ]);
    expect(estado.acceso).toEqual({ tipo: ESTADO_ACCESO.CONCEDIDO });
    expect(estado.sesionId).toBe(SESION);
    expect(estado.turnos).toHaveLength(1);
  });

  test("CONFIG_RECIBIDA sin config conserva la config que ya había", () => {
    const estado = aplicar(estadoInicialConversacion, [
      { tipo: ACCION_UI.CONFIG_RECIBIDA, config: CONFIG },
      { tipo: ACCION_UI.CONFIG_RECIBIDA, config: null },
    ]);
    expect(estado.acceso).toEqual({ tipo: ESTADO_ACCESO.CONCEDIDO });
    expect(estado.config).toEqual(CONFIG);
  });
});

describe("el borrador del compositor", () => {
  const escrito: readonly AccionUi[] = [
    { tipo: ACCION_UI.CAMBIAR_BORRADOR, borrador: MENSAJE },
    { tipo: ACCION_UI.ENVIAR, mensaje: MENSAJE },
  ];

  test("CAMBIAR_BORRADOR guarda lo que la usuaria escribe", () => {
    const estado = reducirConversacion(estadoInicialConversacion, {
      tipo: ACCION_UI.CAMBIAR_BORRADOR,
      borrador: MENSAJE,
    });
    expect(estado.borrador).toBe(MENSAJE);
  });

  test("ENVIAR no vacía el borrador mientras el servidor no acepta el pedido", () => {
    expect(aplicar(estadoInicialConversacion, escrito).borrador).toBe(MENSAJE);
  });

  test("ACEPTADO vacía el borrador que se envió", () => {
    const estado = aplicar(estadoInicialConversacion, [
      ...escrito,
      { tipo: ACCION_UI.ACEPTADO, mensaje: MENSAJE },
    ]);
    expect(estado.borrador).toBe("");
  });

  test("ACEPTADO conserva lo que la usuaria escribió después de enviar", () => {
    const estado = aplicar(estadoInicialConversacion, [
      ...escrito,
      { tipo: ACCION_UI.CAMBIAR_BORRADOR, borrador: `${MENSAJE} y el siguiente` },
      { tipo: ACCION_UI.ACEPTADO, mensaje: MENSAJE },
    ]);
    expect(estado.borrador).toBe(`${MENSAJE} y el siguiente`);
  });

  test("ERROR_HTTP 413 deja el texto en el compositor y el mensaje del servidor bajo la burbuja", () => {
    const estado = aplicar(estadoInicialConversacion, [
      ...escrito,
      {
        tipo: ACCION_UI.ERROR_HTTP,
        status: RESPUESTA_HTTP.CUERPO_DEMASIADO_GRANDE,
        mensaje: MENSAJE_MUY_LARGO,
      },
    ]);
    expect(estado.borrador).toBe(MENSAJE);
    expect(estado.enCurso).toBe(false);
    expect(estado.turnos.at(-1)?.error).toEqual({ codigo: null, mensaje: MENSAJE_MUY_LARGO });
  });

  test("ERROR_HTTP 429 y ERROR_RED dejan el texto en el compositor", () => {
    const limitado = aplicar(estadoInicialConversacion, [
      ...escrito,
      {
        tipo: ACCION_UI.ERROR_HTTP,
        status: RESPUESTA_HTTP.DEMASIADOS_PEDIDOS,
        mensaje: MENSAJE_ERROR_AGENTE,
      },
    ]);
    const sinRed = aplicar(estadoInicialConversacion, [...escrito, { tipo: ACCION_UI.ERROR_RED }]);
    expect(limitado.borrador).toBe(MENSAJE);
    expect(sinRed.borrador).toBe(MENSAJE);
  });

  test("un 429 o un 503 muestran el mensaje del servidor tal cual bajo la burbuja y dejan el texto", () => {
    for (const status of [RESPUESTA_HTTP.DEMASIADOS_PEDIDOS, RESPUESTA_HTTP.NO_DISPONIBLE]) {
      const estado = aplicar(estadoInicialConversacion, [
        ...escrito,
        { tipo: ACCION_UI.ERROR_HTTP, status, mensaje: TOPE_DIARIO },
      ]);
      expect(estado.borrador).toBe(MENSAJE);
      expect(estado.enCurso).toBe(false);
      expect(estado.turnos.at(-1)?.mensaje).toBe(MENSAJE);
      expect(estado.turnos.at(-1)?.error).toEqual({ codigo: null, mensaje: TOPE_DIARIO });
    }
  });

  test("un 401 deja el texto en el compositor para cuando vuelva el acceso", () => {
    const estado = aplicar(estadoInicialConversacion, [
      ...escrito,
      { tipo: ACCION_UI.ERROR_HTTP, status: RESPUESTA_HTTP.NO_AUTORIZADO, mensaje: ACCESO_VENCIDO },
      { tipo: ACCION_UI.CONFIG_RECIBIDA, config: CONFIG },
    ]);
    expect(estado.borrador).toBe(MENSAJE);
  });
});

describe("accionDeConfig", () => {
  test("una config válida abre el chat con ella", () => {
    expect(accionDeConfig({ tipo: RESULTADO_API.OK, valor: CONFIG })).toEqual({
      tipo: ACCION_UI.CONFIG_RECIBIDA,
      config: CONFIG,
    });
  });

  test("un 401 al cargar pide el acceso sin aviso de vencimiento", () => {
    expect(accionDeConfig({ tipo: RESULTADO_API.ACCESO_VENCIDO, mensaje: ACCESO_VENCIDO })).toEqual({
      tipo: ACCION_UI.ACCESO_PEDIDO,
      aviso: null,
    });
  });

  test("sin red o con otro rechazo abre el chat sin config; un 401 posterior pedirá el código", () => {
    expect(accionDeConfig({ tipo: RESULTADO_API.SIN_RED })).toEqual({
      tipo: ACCION_UI.CONFIG_RECIBIDA,
      config: null,
    });
    expect(accionDeConfig({ tipo: RESULTADO_API.RECHAZO, status: 503, mensaje: "x" })).toEqual({
      tipo: ACCION_UI.CONFIG_RECIBIDA,
      config: null,
    });
  });
});

describe("esFalloDeTurno", () => {
  const errorDelAgente = evento({
    tipo: TIPO_EVENTO.ERROR,
    turnoId: TURNO,
    codigo: CODIGO_AGENTE.PROVEEDOR_TIMEOUT,
    mensaje: MENSAJE_ERROR_AGENTE,
  });

  test("el evento error marca el turno como fallido para refrescar health al cerrarlo", () => {
    expect(esFalloDeTurno(errorDelAgente)).toBe(true);
  });

  test("un turno sin error no pide refrescar health", () => {
    expect(turnoCompleto.some(esFalloDeTurno)).toBe(false);
    expect(esFalloDeTurno({ tipo: ACCION_UI.ACEPTADO, mensaje: MENSAJE })).toBe(false);
  });

  test("los rechazos HTTP 413, 429 y 503 marcan el turno como fallido", () => {
    const rechazos = [
      RESPUESTA_HTTP.CUERPO_DEMASIADO_GRANDE,
      RESPUESTA_HTTP.DEMASIADOS_PEDIDOS,
      RESPUESTA_HTTP.NO_DISPONIBLE,
    ].map((status): AccionUi => ({ tipo: ACCION_UI.ERROR_HTTP, status, mensaje: TOPE_DIARIO }));
    expect(rechazos.map(esFalloDeTurno)).toEqual([true, true, true]);
  });

  test("la red caída y el stream cortado marcan el turno como fallido", () => {
    expect(esFalloDeTurno({ tipo: ACCION_UI.ERROR_RED })).toBe(true);
    expect(esFalloDeTurno({ tipo: ACCION_UI.FIN_STREAM })).toBe(true);
  });

  test("un 401 pide el acceso y no cuenta como falla del modelo", () => {
    expect(
      esFalloDeTurno({
        tipo: ACCION_UI.ERROR_HTTP,
        status: RESPUESTA_HTTP.NO_AUTORIZADO,
        mensaje: ACCESO_VENCIDO,
      }),
    ).toBe(false);
  });
});
