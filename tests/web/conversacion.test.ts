import { describe, expect, test } from "bun:test";
import {
  ACCION_AVISO,
  ACCION_UI,
  AVISO_SESION,
  ESTADO_ACCESO,
  ESTADO_TARJETA_CONFIRMACION,
  RESULTADO_API,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_ERROR } from "@web/config/strings.ts";
import {
  accionDeConfig,
  configResuelta,
  estadoInicialConversacion,
  faltaConfig,
  reducirConversacion,
  usoDeSesion,
} from "@web/state/conversacion.ts";
import type { AccionUi, EstadoConversacion, EstadoHidratado } from "@web/types/chat.type.ts";
import { ACCION, CODIGO_AGENTE, MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { TIPO_ACCION } from "@/config/constants/confirmation.constants.ts";
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
  test("el estado inicial no tiene sesión, turnos, turno en curso, config ni carga pendiente, y verifica el acceso", () => {
    expect(estadoInicialConversacion).toEqual({
      sesionId: null,
      sesionAnterior: null,
      turnos: [],
      enCurso: false,
      tarjetasConfirmacion: [],
      acceso: { tipo: ESTADO_ACCESO.VERIFICANDO },
      config: null,
      borrador: "",
      hidratando: false,
      avisoSesion: null,
      tokensSesion: 0,
      esperandoAvisoExpirada: false,
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
      accion: null,
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
    expect(estado.turnos[0]?.error).toEqual({ codigo: null, mensaje: MENSAJE_MUY_LARGO, accion: null });
  });

  test("ERROR_RED guarda la copia de red caída del front y cierra el turno", () => {
    const estado = aplicar(estadoInicialConversacion, [
      { tipo: ACCION_UI.ENVIAR, mensaje: MENSAJE },
      { tipo: ACCION_UI.ERROR_RED },
    ]);
    expect(estado.enCurso).toBe(false);
    expect(estado.turnos[0]?.error).toEqual({ codigo: null, mensaje: TEXTO_ERROR.sinConexion, accion: null });
  });

  test("FIN_STREAM sin turn_end guarda la copia de stream cortado con la acción de recargar, conserva el texto y cierra el turno", () => {
    const estado = aplicar(estadoInicialConversacion, [
      ...turnoCompleto.slice(0, 3),
      { tipo: ACCION_UI.FIN_STREAM },
    ]);
    expect(estado.enCurso).toBe(false);
    expect(estado.sesionId).toBe(SESION);
    expect(estado.turnos[0]?.textos.map((texto) => texto.texto)).toEqual([RESPUESTA]);
    expect(estado.turnos[0]?.error).toEqual({
      codigo: null,
      mensaje: TEXTO_ERROR.streamCortado,
      accion: ACCION_AVISO.RECARGAR,
    });
  });

  test("FIN_STREAM antes de turn_start no ofrece recargar, porque no hay sesión que pedir", () => {
    const estado = aplicar(estadoInicialConversacion, [
      { tipo: ACCION_UI.ENVIAR, mensaje: MENSAJE },
      { tipo: ACCION_UI.FIN_STREAM },
    ]);
    expect(estado.turnos[0]?.error).toEqual({
      codigo: null,
      mensaje: TEXTO_ERROR.streamCortado,
      accion: null,
    });
  });

  test("FIN_STREAM después de turn_end no cambia el estado", () => {
    const cerrado = aplicar(estadoInicialConversacion, turnoCompleto);
    expect(reducirConversacion(cerrado, { tipo: ACCION_UI.FIN_STREAM })).toBe(cerrado);
  });

  test("usage deja el uso de la sesión en su totalSesion y mueve la marca de eventos del turno", () => {
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
      tokensSesion: 15,
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
    expect(estado.turnos.at(-1)?.error).toEqual({ codigo: null, mensaje: MENSAJE_MUY_LARGO, accion: null });
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
      expect(estado.turnos.at(-1)?.error).toEqual({ codigo: null, mensaje: TOPE_DIARIO, accion: null });
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

describe("reintento de la config tras entrar (IN-08)", () => {
  test("falta la config cuando el acceso está concedido y la config no llegó", () => {
    const sinConfig = reducirConversacion(
      estadoInicialConversacion,
      accionDeConfig({ tipo: RESULTADO_API.SIN_RED }),
    );
    expect(faltaConfig(sinConfig)).toBe(true);
    const conConfig = reducirConversacion(
      sinConfig,
      accionDeConfig({ tipo: RESULTADO_API.OK, valor: CONFIG }),
    );
    expect(faltaConfig(conConfig)).toBe(false);
    expect(conConfig.config).toEqual(CONFIG);
    expect(faltaConfig(estadoInicialConversacion)).toBe(false);
  });

  test("solo una config válida o un 401 resuelven el reintento; sin red o un rechazo siguen esperando", () => {
    expect(configResuelta({ tipo: RESULTADO_API.OK, valor: CONFIG })).toBe(true);
    expect(configResuelta({ tipo: RESULTADO_API.ACCESO_VENCIDO, mensaje: ACCESO_VENCIDO })).toBe(true);
    expect(configResuelta({ tipo: RESULTADO_API.SIN_RED })).toBe(false);
    expect(
      configResuelta({ tipo: RESULTADO_API.RECHAZO, status: RESPUESTA_HTTP.ERROR_INTERNO, mensaje: "x" }),
    ).toBe(false);
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

const CASO = "ec-corp-andina";

const turnoConConfirmacion: readonly AccionUi[] = [
  { tipo: ACCION_UI.ENVIAR, mensaje: MENSAJE },
  evento({
    tipo: TIPO_EVENTO.INICIO_TURNO,
    sesionId: SESION,
    turnoId: TURNO,
    sesionNueva: true,
    sesionExpirada: false,
  }),
  evento({
    tipo: TIPO_EVENTO.CONFIRMACION_REQUERIDA,
    turnoId: TURNO,
    caso: CASO,
    accion: ACCION.ENVIO,
    bloqueos: [],
    bloqueosLegibles: [],
  }),
  evento({ tipo: TIPO_EVENTO.FIN_TURNO, turnoId: TURNO, motivo: MOTIVO_FIN.FINAL, needsConfirmation: true }),
];

const vistaDelServidor: EstadoHidratado = {
  sesionId: SESION,
  turnos: [
    {
      clave: 0,
      mensaje: MENSAJE,
      llamadas: [],
      eventos: 0,
      textos: [{ clave: 0, texto: RESPUESTA }],
      confirmaciones: [],
      error: null,
    },
    {
      clave: 1,
      mensaje: "Sí, envía ec-corp-andina",
      llamadas: [],
      eventos: 0,
      textos: [],
      confirmaciones: [],
      error: null,
    },
  ],
  tarjetasConfirmacion: [],
  tokensUsados: 0,
};

describe("Detener respuesta y Recargar conversación", () => {
  test("DETENER cierra el turno sin error, suelta las tarjetas que estaban enviando y pide la vista del servidor", () => {
    const estado = aplicar(estadoInicialConversacion, [
      ...turnoConConfirmacion,
      {
        tipo: ACCION_UI.ENVIAR,
        mensaje: "Sí, envía ec-corp-andina",
        accion: { tipo: TIPO_ACCION.CONFIRMAR, caso: CASO },
      },
      { tipo: ACCION_UI.DETENER },
    ]);
    expect(estado.enCurso).toBe(false);
    expect(estado.hidratando).toBe(true);
    expect(estado.turnos.at(-1)?.error).toBeNull();
    expect(estado.tarjetasConfirmacion.map((tarjeta) => [tarjeta.estado, tarjeta.enviando])).toEqual([
      [ESTADO_TARJETA_CONFIRMACION.ABIERTA, null],
    ]);
  });

  test("después de DETENER, HIDRATAR deja la línea de tiempo que guardó el servidor y la tarjeta abierta desaparece", () => {
    const estado = aplicar(estadoInicialConversacion, [
      ...turnoConConfirmacion,
      {
        tipo: ACCION_UI.ENVIAR,
        mensaje: "Sí, envía ec-corp-andina",
        accion: { tipo: TIPO_ACCION.CONFIRMAR, caso: CASO },
      },
      { tipo: ACCION_UI.DETENER },
      { tipo: ACCION_UI.HIDRATAR, hidratado: vistaDelServidor },
    ]);
    expect(estado.hidratando).toBe(false);
    expect(estado.enCurso).toBe(false);
    expect(estado.turnos).toEqual(vistaDelServidor.turnos);
    expect(estado.tarjetasConfirmacion).toEqual([]);
  });

  test("DETENER antes de turn_start cierra el turno sin pedir ninguna vista", () => {
    const estado = aplicar(estadoInicialConversacion, [
      { tipo: ACCION_UI.ENVIAR, mensaje: MENSAJE },
      { tipo: ACCION_UI.DETENER },
    ]);
    expect(estado.enCurso).toBe(false);
    expect(estado.hidratando).toBe(false);
    expect(estado.turnos[0]?.error).toBeNull();
  });

  test("DETENER sin turno en curso no cambia el estado", () => {
    const cerrado = aplicar(estadoInicialConversacion, turnoCompleto);
    expect(reducirConversacion(cerrado, { tipo: ACCION_UI.DETENER })).toBe(cerrado);
  });

  test("FIN_STREAM seguido de RECARGAR y HIDRATAR reemplaza la línea de tiempo por la vista del servidor", () => {
    const cortado = aplicar(estadoInicialConversacion, [
      ...turnoCompleto.slice(0, 2),
      { tipo: ACCION_UI.FIN_STREAM },
    ]);
    const recargando = reducirConversacion(cortado, { tipo: ACCION_UI.RECARGAR });
    expect(recargando.hidratando).toBe(true);
    const estado = reducirConversacion(recargando, { tipo: ACCION_UI.HIDRATAR, hidratado: vistaDelServidor });
    expect(estado.hidratando).toBe(false);
    expect(estado.turnos).toEqual(vistaDelServidor.turnos);
    expect(estado.turnos.every((turno) => turno.error === null)).toBe(true);
  });

  test("RECARGAR sin sesión o con un turno en curso no pide nada", () => {
    expect(reducirConversacion(estadoInicialConversacion, { tipo: ACCION_UI.RECARGAR })).toBe(
      estadoInicialConversacion,
    );
    const enCurso = aplicar(estadoInicialConversacion, turnoCompleto.slice(0, 2));
    expect(reducirConversacion(enCurso, { tipo: ACCION_UI.RECARGAR })).toBe(enCurso);
  });
});

const EXPIRADA = "La sesión anterior expiró; empezamos de cero.";
const SESION_NUEVA = "sesion-nueva";
const PRESUPUESTO_AGOTADO =
  "Esta sesión agotó su presupuesto de tokens. Abre una sesión nueva para continuar.";

describe("sesión expirada, presupuesto agotado, uso y Nueva sesión (UI-08)", () => {
  const conTarjetaAbierta = aplicar(estadoInicialConversacion, [
    { tipo: ACCION_UI.CONFIG_RECIBIDA, config: CONFIG },
    ...turnoConConfirmacion,
  ]);
  const expirado = aplicar(conTarjetaAbierta, [
    { tipo: ACCION_UI.ENVIAR, mensaje: "¿y el siguiente?" },
    evento({
      tipo: TIPO_EVENTO.INICIO_TURNO,
      sesionId: SESION_NUEVA,
      turnoId: "turno-2",
      sesionNueva: true,
      sesionExpirada: true,
    }),
    evento({ tipo: TIPO_EVENTO.TEXTO, turnoId: "turno-2", texto: EXPIRADA }),
    evento({ tipo: TIPO_EVENTO.TEXTO, turnoId: "turno-2", texto: RESPUESTA }),
    evento({
      tipo: TIPO_EVENTO.FIN_TURNO,
      turnoId: "turno-2",
      motivo: MOTIVO_FIN.FINAL,
      needsConfirmation: false,
    }),
  ]);

  test("turn_start con sesionExpirada vuelve AvisoSistema el texto siguiente del servidor, no una burbuja del agente", () => {
    expect(expirado.avisoSesion).toEqual({ tipo: AVISO_SESION.EXPIRADA, mensaje: EXPIRADA });
    expect(expirado.turnos.flatMap((turno) => turno.textos.map((texto) => texto.texto))).toEqual([RESPUESTA]);
    expect(expirado.esperandoAvisoExpirada).toBe(false);
  });

  test("la sesión nueva empieza con el turno actual: la conversación vencida y sus tarjetas salen de la pantalla", () => {
    expect(expirado.sesionId).toBe(SESION_NUEVA);
    expect(expirado.turnos.map((turno) => [turno.clave, turno.mensaje])).toEqual([[0, "¿y el siguiente?"]]);
    expect(expirado.tarjetasConfirmacion).toEqual([]);
  });

  test("un texto después de un turn_start sin sesionExpirada sigue siendo burbuja del agente", () => {
    const estado = aplicar(estadoInicialConversacion, turnoCompleto);
    expect(estado.avisoSesion).toBeNull();
    expect(estado.turnos[0]?.textos.map((texto) => texto.texto)).toEqual([RESPUESTA]);
  });

  test("el error PRESUPUESTO_AGOTADO marca su aviso con la acción de empezar una sesión nueva", () => {
    const estado = aplicar(estadoInicialConversacion, [
      ...turnoCompleto.slice(0, 2),
      evento({
        tipo: TIPO_EVENTO.ERROR,
        turnoId: TURNO,
        codigo: CODIGO_AGENTE.PRESUPUESTO_AGOTADO,
        mensaje: PRESUPUESTO_AGOTADO,
      }),
    ]);
    expect(estado.turnos[0]?.error).toEqual({
      codigo: CODIGO_AGENTE.PRESUPUESTO_AGOTADO,
      mensaje: PRESUPUESTO_AGOTADO,
      accion: ACCION_AVISO.NUEVA_SESION,
    });
  });

  test("HIDRATAR deja el uso de la sesión que guardó el servidor", () => {
    const estado = reducirConversacion(conTarjetaAbierta, {
      tipo: ACCION_UI.HIDRATAR,
      hidratado: { ...vistaDelServidor, tokensUsados: 42_000 },
    });
    expect(estado.tokensSesion).toBe(42_000);
  });

  test("NUEVA_SESION vacía conversación, tarjetas, avisos y uso, y conserva acceso, config y borrador", () => {
    const conBorrador = reducirConversacion(expirado, { tipo: ACCION_UI.CAMBIAR_BORRADOR, borrador: "hola" });
    const estado = reducirConversacion(conBorrador, { tipo: ACCION_UI.NUEVA_SESION });
    expect(estado).toEqual({
      ...estadoInicialConversacion,
      acceso: { tipo: ESTADO_ACCESO.CONCEDIDO },
      config: CONFIG,
      borrador: "hola",
      sesionAnterior: SESION_NUEVA,
    });
  });

  test("el uso de la sesión se lee en miles hacia abajo, con el tope de la config del servidor", () => {
    const estado = { ...conTarjetaAbierta, tokensSesion: 12_999 };
    expect(usoDeSesion(estado)).toEqual({ usados: 12, tope: CONFIG.presupuestoSesion / 1000 });
    expect(usoDeSesion({ ...estado, config: null })).toBeNull();
  });
});

const SESION_ACEPTADA = "sesion-aceptada";
const TOPE_SESIONES =
  "Abriste demasiadas sesiones nuevas en la última hora. Podrás abrir otra en 60 minutos.";

describe("volver a la sesión anterior tras un 429 de sesión nueva (G-03-04)", () => {
  const enSesion = aplicar(estadoInicialConversacion, [
    { tipo: ACCION_UI.CONFIG_RECIBIDA, config: CONFIG },
    ...turnoCompleto,
  ]);
  const nueva = reducirConversacion(enSesion, { tipo: ACCION_UI.NUEVA_SESION });
  const rechazada = aplicar(nueva, [
    { tipo: ACCION_UI.CAMBIAR_BORRADOR, borrador: MENSAJE },
    { tipo: ACCION_UI.ENVIAR, mensaje: MENSAJE },
    { tipo: ACCION_UI.ERROR_HTTP, status: RESPUESTA_HTTP.DEMASIADOS_PEDIDOS, mensaje: TOPE_SESIONES },
  ]);

  test("NUEVA_SESION guarda la sesión vigente como anterior y conserva acceso, config y borrador", () => {
    const conBorrador = reducirConversacion(enSesion, { tipo: ACCION_UI.CAMBIAR_BORRADOR, borrador: "hola" });
    const estado = reducirConversacion(conBorrador, { tipo: ACCION_UI.NUEVA_SESION });
    expect(estado.sesionId).toBeNull();
    expect(estado.sesionAnterior).toBe(SESION);
    expect(estado.turnos).toEqual([]);
    expect(estado.acceso).toEqual({ tipo: ESTADO_ACCESO.CONCEDIDO });
    expect(estado.config).toEqual(CONFIG);
    expect(estado.borrador).toBe("hola");
  });

  test("una segunda NUEVA_SESION sin mandar nada conserva la misma sesión anterior", () => {
    const estado = reducirConversacion(nueva, { tipo: ACCION_UI.NUEVA_SESION });
    expect(estado.sesionAnterior).toBe(SESION);
  });

  test("un 429 de la sesión nueva ofrece volver a la anterior y deja el texto en el compositor", () => {
    expect(rechazada.enCurso).toBe(false);
    expect(rechazada.borrador).toBe(MENSAJE);
    expect(rechazada.turnos.at(-1)?.error).toEqual({
      codigo: null,
      mensaje: TOPE_SESIONES,
      accion: ACCION_AVISO.VOLVER_SESION_ANTERIOR,
    });
  });

  test("VOLVER_SESION_ANTERIOR recupera el id anterior, pide su historial y conserva el borrador", () => {
    const estado = reducirConversacion(rechazada, { tipo: ACCION_UI.VOLVER_SESION_ANTERIOR });
    expect(estado).toEqual({
      ...estadoInicialConversacion,
      sesionId: SESION,
      hidratando: true,
      acceso: { tipo: ESTADO_ACCESO.CONCEDIDO },
      config: CONFIG,
      borrador: MENSAJE,
    });
  });

  test("VOLVER_SESION_ANTERIOR no hace nada sin sesión anterior o con un turno en curso", () => {
    expect(reducirConversacion(enSesion, { tipo: ACCION_UI.VOLVER_SESION_ANTERIOR })).toBe(enSesion);
    const enCurso = reducirConversacion(nueva, { tipo: ACCION_UI.ENVIAR, mensaje: MENSAJE });
    expect(reducirConversacion(enCurso, { tipo: ACCION_UI.VOLVER_SESION_ANTERIOR })).toBe(enCurso);
  });

  test("el turn_start de la sesión nueva olvida la anterior", () => {
    const estado = aplicar(nueva, [
      { tipo: ACCION_UI.ENVIAR, mensaje: MENSAJE },
      evento({
        tipo: TIPO_EVENTO.INICIO_TURNO,
        sesionId: SESION_ACEPTADA,
        turnoId: "turno-2",
        sesionNueva: true,
        sesionExpirada: false,
      }),
    ]);
    expect(estado.sesionId).toBe(SESION_ACEPTADA);
    expect(estado.sesionAnterior).toBeNull();
  });

  test("sin sesión anterior un 429 no ofrece volver", () => {
    const estado = aplicar(estadoInicialConversacion, [
      { tipo: ACCION_UI.ENVIAR, mensaje: MENSAJE },
      { tipo: ACCION_UI.ERROR_HTTP, status: RESPUESTA_HTTP.DEMASIADOS_PEDIDOS, mensaje: TOPE_SESIONES },
    ]);
    expect(estado.turnos.at(-1)?.error).toEqual({ codigo: null, mensaje: TOPE_SESIONES, accion: null });
  });

  test("con sesión anterior un 413 o un 503 no ofrecen volver", () => {
    for (const status of [RESPUESTA_HTTP.CUERPO_DEMASIADO_GRANDE, RESPUESTA_HTTP.NO_DISPONIBLE]) {
      const estado = aplicar(nueva, [
        { tipo: ACCION_UI.ENVIAR, mensaje: MENSAJE },
        { tipo: ACCION_UI.ERROR_HTTP, status, mensaje: TOPE_DIARIO },
      ]);
      expect(estado.turnos.at(-1)?.error).toEqual({ codigo: null, mensaje: TOPE_DIARIO, accion: null });
    }
  });
});
