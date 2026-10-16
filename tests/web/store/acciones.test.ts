import { describe, expect, test } from "bun:test";
import { ACCION_UI, AVISO_SESION, ESTADO_ACCESO, RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import { TEXTO_CONFIRMACION } from "@web/config/strings.ts";
import { crearInstancia } from "@web/store/instancia.ts";
import type {
  AccionDeTarjeta,
  AccionUi,
  Despachar,
  ResultadoApi,
  VistaSesionUi,
} from "@web/types/chat.type.ts";
import type { Dependencias, InstanciaAlmacen } from "@web/types/store.type.ts";
import { ACCION, MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { TIPO_ACCION } from "@/config/constants/confirmation.constants.ts";
import { RESPUESTA_HTTP } from "@/config/constants/http.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import type { ChatBody, ConfigResponse, HealthResponse, SseEvent } from "@/http/types/api.type.ts";

const SESION = "s-1";
const TURNO = "turno-1";
const MENSAJE = "hola";
const RESPUESTA = "Listo";
const CASO = "co-industrias-delta";
const SIN_RED = { tipo: RESULTADO_API.SIN_RED } as const;
const CONFIG: ConfigResponse = {
  fechaEjecucion: "2026-09-03",
  zona: "America/Bogota",
  casos: [CASO],
  presupuestoSesion: 300_000,
  mensajeMaximo: 2000,
};
const SALUD_DISPONIBLE: HealthResponse = {
  ok: true,
  provider: "deepseek",
  model: "deepseek-flash",
  llm: ESTADO_LLM.DISPONIBLE,
};
const SALUD_SIN_CLAVE: HealthResponse = { ...SALUD_DISPONIBLE, llm: ESTADO_LLM.SIN_CLAVE };
const VISTA: VistaSesionUi = {
  sesionId: SESION,
  turnos: [],
  pendientes: [],
  casosEnviados: [],
  tokensUsados: 0,
  ocupada: false,
};

type LlamadaAlTurno = {
  readonly pedido: ChatBody;
  readonly despachar: Despachar;
  readonly signal: AbortSignal;
  readonly alTerminarTurno: () => void;
};

type GuionDelTurno = (llamada: LlamadaAlTurno) => Promise<void>;

type PedidoRetenido<T> = {
  readonly signal: AbortSignal | null;
  readonly responder: (resultado: T) => void;
};

type OpcionesFalsas = {
  readonly guion?: GuionDelTurno;
  readonly sesionGuardada?: string;
  readonly config?: (signal: AbortSignal | null) => Promise<ResultadoApi<ConfigResponse>>;
  readonly sesion?: (sesionId: string, signal: AbortSignal | null) => Promise<ResultadoApi<VistaSesionUi>>;
};

type Falsos = {
  readonly dependencias: Dependencias;
  readonly turnos: LlamadaAlTurno[];
  readonly registro: string[];
  readonly guardada: { valor: string | null };
  readonly saludes: PedidoRetenido<ResultadoApi<HealthResponse>>[];
};

function evento(eventoDelServidor: SseEvent): AccionUi {
  return { tipo: ACCION_UI.EVENTO, evento: eventoDelServidor };
}

const INICIO: AccionUi = evento({
  tipo: TIPO_EVENTO.INICIO_TURNO,
  sesionId: SESION,
  turnoId: TURNO,
  sesionNueva: true,
  sesionExpirada: false,
});

const TEXTO: AccionUi = evento({ tipo: TIPO_EVENTO.TEXTO, turnoId: TURNO, texto: RESPUESTA });

const FIN: AccionUi = evento({
  tipo: TIPO_EVENTO.FIN_TURNO,
  turnoId: TURNO,
  motivo: MOTIVO_FIN.FINAL,
  needsConfirmation: false,
});

const CONFIRMACION: AccionUi = evento({
  tipo: TIPO_EVENTO.CONFIRMACION_REQUERIDA,
  turnoId: TURNO,
  caso: CASO,
  accion: ACCION.ENVIO,
  bloqueos: [],
  bloqueosLegibles: [],
});

function guionCon(acciones: readonly AccionUi[]): GuionDelTurno {
  return async ({ despachar }) => {
    for (const accion of acciones) despachar(accion);
  };
}

const turnoCompleto = guionCon([INICIO, TEXTO, FIN]);

function crearFalsos(opciones: OpcionesFalsas = {}): Falsos {
  const turnos: LlamadaAlTurno[] = [];
  const registro: string[] = [];
  const guardada = { valor: opciones.sesionGuardada ?? null };
  const saludes: PedidoRetenido<ResultadoApi<HealthResponse>>[] = [];
  const guion = opciones.guion ?? turnoCompleto;
  const dependencias: Dependencias = {
    enviarTurno: async (pedido, despachar, signal, alTerminarTurno) => {
      const llamada = { pedido, despachar, signal, alTerminarTurno };
      turnos.push(llamada);
      await guion(llamada);
    },
    obtenerConfig: opciones.config ?? (async () => SIN_RED),
    obtenerSalud: (signal) => {
      const { promise, resolve } = Promise.withResolvers<ResultadoApi<HealthResponse>>();
      saludes.push({ signal, responder: resolve });
      return promise;
    },
    obtenerSesionAsentada: opciones.sesion ?? (async () => SIN_RED),
    leerSesionGuardada: () => guardada.valor,
    guardarSesionId: (sesionId) => {
      registro.push(`guardar:${sesionId}`);
      guardada.valor = sesionId;
    },
    olvidarSesion: () => {
      registro.push("olvidar");
      guardada.valor = null;
    },
  };
  return { dependencias, turnos, registro, guardada, saludes };
}

function turnoRetenido(): { readonly guion: GuionDelTurno; readonly soltar: () => void } {
  const { promise, resolve } = Promise.withResolvers<void>();
  return { guion: () => promise, soltar: () => resolve() };
}

async function esperarTurnos(): Promise<void> {
  for (let vuelta = 0; vuelta < 5; vuelta += 1) await Promise.resolve();
}

function conversacion(instancia: InstanciaAlmacen) {
  return instancia.almacen.leer().conversacion;
}

function confirmar(): AccionDeTarjeta {
  return { tipo: TIPO_ACCION.CONFIRMAR, caso: CASO };
}

describe("acciones del almacén: envío de un turno", () => {
  test("enviarTexto lleva el mensaje por enviarTurno y deja el turno terminado en el estado", async () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto(MENSAJE);
    await esperarTurnos();
    const estado = conversacion(instancia);
    expect(estado.turnos).toHaveLength(1);
    expect(estado.turnos[0]?.mensaje).toBe(MENSAJE);
    expect(estado.turnos[0]?.textos.map(({ texto }) => texto)).toEqual([RESPUESTA]);
    expect(estado.enCurso).toBe(false);
    expect(estado.sesionId).toBe(SESION);
    expect(falsos.registro).toEqual([`guardar:${SESION}`]);
  });

  test("enviarTurno recibe el cuerpo, una señal de aborto y el refresco de salud del almacén", async () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto(` ${MENSAJE} `);
    await esperarTurnos();
    expect(falsos.turnos).toHaveLength(1);
    expect(falsos.turnos[0]?.pedido).toEqual({ sessionId: null, message: MENSAJE });
    expect(falsos.turnos[0]?.signal).toBeInstanceOf(AbortSignal);
    expect(falsos.turnos[0]?.alTerminarTurno).toBe(instancia.acciones.refrescarSalud);
  });

  test("ENVIAR se despacha antes de llamar a enviarTurno", () => {
    const enCursoAlEnviar: boolean[] = [];
    const falsos = crearFalsos({
      guion: async () => {
        enCursoAlEnviar.push(conversacion(instancia).enCurso);
      },
    });
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto(MENSAJE);
    expect(enCursoAlEnviar).toEqual([true]);
  });

  test("enviar manda el borrador que escribió cambiarBorrador", async () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.cambiarBorrador(MENSAJE);
    instancia.acciones.enviar();
    await esperarTurnos();
    expect(falsos.turnos[0]?.pedido.message).toBe(MENSAJE);
  });

  test("enviarTexto con un mensaje en blanco no llama a enviarTurno", async () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto("   ");
    await esperarTurnos();
    expect(falsos.turnos).toHaveLength(0);
    expect(conversacion(instancia).turnos).toHaveLength(0);
  });

  test("un segundo enviarTexto mientras el primer turno sigue abierto no llama otra vez a enviarTurno", async () => {
    const retenido = turnoRetenido();
    const falsos = crearFalsos({ guion: retenido.guion });
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto(MENSAJE);
    instancia.acciones.enviarTexto(MENSAJE);
    await esperarTurnos();
    expect(falsos.turnos).toHaveLength(1);
    retenido.soltar();
  });

  test("la sesión guardada arranca hidratando y bloquea el envío hasta cargarla", async () => {
    const falsos = crearFalsos({ sesionGuardada: SESION });
    const instancia = crearInstancia(falsos.dependencias);
    expect(conversacion(instancia).sesionId).toBe(SESION);
    expect(conversacion(instancia).hidratando).toBe(true);
    instancia.acciones.enviarTexto(MENSAJE);
    await esperarTurnos();
    expect(falsos.turnos).toHaveLength(0);
  });
});

describe("acciones del almacén: detener", () => {
  test("detener corta el turno retenido, aborta la señal e ignora lo que el turno despache después", async () => {
    const retenido = turnoRetenido();
    const falsos = crearFalsos({ guion: retenido.guion });
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto(MENSAJE);
    instancia.acciones.detener();
    const tras = instancia.almacen.leer();
    expect(tras.conversacion.enCurso).toBe(false);
    expect(falsos.turnos[0]?.signal.aborted).toBe(true);
    falsos.turnos[0]?.despachar(INICIO);
    falsos.turnos[0]?.despachar(TEXTO);
    expect(instancia.almacen.leer()).toBe(tras);
    expect(falsos.registro).toEqual([]);
    retenido.soltar();
  });

  test("detener libera el turno, así que el siguiente envío vuelve a llamar a enviarTurno", async () => {
    const retenido = turnoRetenido();
    const falsos = crearFalsos({ guion: retenido.guion });
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto(MENSAJE);
    instancia.acciones.detener();
    instancia.acciones.enviarTexto(MENSAJE);
    expect(falsos.turnos).toHaveLength(2);
    retenido.soltar();
  });

  test("detener sin turno activo no despacha nada", () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    const antes = instancia.almacen.leer();
    instancia.acciones.detener();
    expect(instancia.almacen.leer()).toBe(antes);
  });
});

describe("acciones del almacén: foco del campo del mensaje", () => {
  test("enfocarCampoDelMensaje enfoca el campo registrado y no hace nada sin campo", () => {
    const instancia = crearInstancia(crearFalsos().dependencias);
    let enfoques = 0;
    instancia.acciones.enfocarCampoDelMensaje();
    instancia.acciones.registrarCampoDelMensaje({ focus: () => (enfoques += 1) });
    instancia.acciones.enfocarCampoDelMensaje();
    instancia.acciones.registrarCampoDelMensaje(null);
    instancia.acciones.enfocarCampoDelMensaje();
    expect(enfoques).toBe(1);
  });
});

describe("acciones del almacén: sesiones", () => {
  test("nuevaSesion y volverASesionAnterior no hacen nada mientras hay un turno activo", async () => {
    const retenido = turnoRetenido();
    const falsos = crearFalsos({ guion: retenido.guion, sesionGuardada: SESION });
    const instancia = crearInstancia(falsos.dependencias);
    await instancia.acciones.cargarSesion(SESION, new AbortController().signal);
    instancia.acciones.enviarTexto(MENSAJE);
    const antes = instancia.almacen.leer();
    instancia.acciones.nuevaSesion();
    instancia.acciones.volverASesionAnterior();
    expect(instancia.almacen.leer()).toBe(antes);
    expect(falsos.registro).toEqual([]);
    retenido.soltar();
  });

  test("nuevaSesion olvida la sesión guardada y volverASesionAnterior la guarda de nuevo", async () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto(MENSAJE);
    await esperarTurnos();
    instancia.acciones.nuevaSesion();
    expect(falsos.registro).toEqual([`guardar:${SESION}`, "olvidar"]);
    expect(conversacion(instancia).sesionId).toBeNull();
    expect(conversacion(instancia).sesionAnterior).toBe(SESION);
    instancia.acciones.volverASesionAnterior();
    expect(falsos.registro).toEqual([`guardar:${SESION}`, "olvidar", `guardar:${SESION}`]);
    expect(conversacion(instancia).sesionId).toBe(SESION);
    expect(conversacion(instancia).hidratando).toBe(true);
  });

  test("nuevaSesion sin sesión guardada no toca el almacenamiento pero despacha", () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.cambiarBorrador(MENSAJE);
    let avisos = 0;
    instancia.almacen.suscribir(() => {
      avisos += 1;
    });
    instancia.acciones.nuevaSesion();
    expect(falsos.registro).toEqual([]);
    expect(avisos).toBe(1);
    expect(conversacion(instancia).borrador).toBe(MENSAJE);
  });

  test("cargarSesion con un 404 olvida la sesión guardada y despacha la sesión expirada", async () => {
    const falsos = crearFalsos({
      sesionGuardada: SESION,
      sesion: async () => ({
        tipo: RESULTADO_API.RECHAZO,
        status: RESPUESTA_HTTP.NO_ENCONTRADO,
        mensaje: "x",
      }),
    });
    const instancia = crearInstancia(falsos.dependencias);
    await instancia.acciones.cargarSesion(SESION, new AbortController().signal);
    expect(falsos.registro).toEqual(["olvidar"]);
    expect(conversacion(instancia).hidratando).toBe(false);
    expect(conversacion(instancia).avisoSesion?.tipo).toBe(AVISO_SESION.EXPIRADA);
  });

  test("cargarSesion con la vista hidrata sin tocar el almacenamiento", async () => {
    const pedidas: string[] = [];
    const falsos = crearFalsos({
      sesionGuardada: SESION,
      sesion: async (sesionId) => {
        pedidas.push(sesionId);
        return { tipo: RESULTADO_API.OK, valor: VISTA };
      },
    });
    const instancia = crearInstancia(falsos.dependencias);
    await instancia.acciones.cargarSesion(SESION, new AbortController().signal);
    expect(pedidas).toEqual([SESION]);
    expect(falsos.registro).toEqual([]);
    expect(conversacion(instancia).hidratando).toBe(false);
  });

  test("cargarSesion abortada no despacha ni olvida", async () => {
    const controlador = new AbortController();
    const falsos = crearFalsos({
      sesionGuardada: SESION,
      sesion: async () => {
        controlador.abort();
        return { tipo: RESULTADO_API.RECHAZO, status: RESPUESTA_HTTP.NO_ENCONTRADO, mensaje: "x" };
      },
    });
    const instancia = crearInstancia(falsos.dependencias);
    const antes = instancia.almacen.leer();
    await instancia.acciones.cargarSesion(SESION, controlador.signal);
    expect(instancia.almacen.leer()).toBe(antes);
    expect(falsos.registro).toEqual([]);
  });
});

describe("acciones del almacén: confirmación", () => {
  test("responderConfirmacion sin tarjeta abierta para el caso no envía nada", async () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.responderConfirmacion(confirmar());
    await esperarTurnos();
    expect(falsos.turnos).toHaveLength(0);
  });

  test("responderConfirmacion con la tarjeta abierta envía el mensaje explícito con la acción", async () => {
    const falsos = crearFalsos({ guion: guionCon([INICIO, CONFIRMACION, FIN]) });
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto(MENSAJE);
    await esperarTurnos();
    instancia.acciones.responderConfirmacion(confirmar());
    await esperarTurnos();
    expect(falsos.turnos).toHaveLength(2);
    expect(falsos.turnos[1]?.pedido).toEqual({
      sessionId: SESION,
      message: TEXTO_CONFIRMACION.mensaje(confirmar()),
      accion: confirmar(),
    });
  });
});

describe("acciones del almacén: salud", () => {
  test("refrescarSalud marca la comprobación y guarda la respuesta al terminar", async () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.refrescarSalud();
    expect(instancia.almacen.leer().salud.comprobando).toBe(true);
    falsos.saludes[0]?.responder({ tipo: RESULTADO_API.OK, valor: SALUD_DISPONIBLE });
    await esperarTurnos();
    expect(instancia.almacen.leer().salud).toEqual({ salud: SALUD_DISPONIBLE, comprobando: false });
  });

  test("dos refrescos seguidos abortan el primero; su respuesta tardía no pisa la salud y comprobando sigue hasta el segundo", async () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.refrescarSalud();
    instancia.acciones.refrescarSalud();
    expect(falsos.saludes[0]?.signal?.aborted).toBe(true);
    expect(falsos.saludes[1]?.signal?.aborted).toBe(false);
    falsos.saludes[0]?.responder({ tipo: RESULTADO_API.OK, valor: SALUD_SIN_CLAVE });
    await esperarTurnos();
    expect(instancia.almacen.leer().salud).toEqual({ salud: null, comprobando: true });
    falsos.saludes[1]?.responder({ tipo: RESULTADO_API.OK, valor: SALUD_DISPONIBLE });
    await esperarTurnos();
    expect(instancia.almacen.leer().salud).toEqual({ salud: SALUD_DISPONIBLE, comprobando: false });
  });

  test("una respuesta sin éxito apaga la comprobación y conserva la salud anterior", async () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.refrescarSalud();
    falsos.saludes[0]?.responder({ tipo: RESULTADO_API.OK, valor: SALUD_DISPONIBLE });
    await esperarTurnos();
    instancia.acciones.refrescarSalud();
    falsos.saludes[1]?.responder(SIN_RED);
    await esperarTurnos();
    expect(instancia.almacen.leer().salud).toEqual({ salud: SALUD_DISPONIBLE, comprobando: false });
  });

  test("cancelarSalud aborta el pedido en curso y su respuesta no se guarda", async () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.refrescarSalud();
    instancia.acciones.cancelarSalud();
    expect(falsos.saludes[0]?.signal?.aborted).toBe(true);
    falsos.saludes[0]?.responder({ tipo: RESULTADO_API.OK, valor: SALUD_DISPONIBLE });
    await esperarTurnos();
    expect(instancia.almacen.leer().salud.salud).toBeNull();
  });

  test("al terminar un turno se refresca la salud una vez", async () => {
    const falsos = crearFalsos({
      guion: async (llamada) => {
        await turnoCompleto(llamada);
        llamada.alTerminarTurno();
      },
    });
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto(MENSAJE);
    await esperarTurnos();
    expect(falsos.saludes).toHaveLength(1);
  });
});

describe("acciones del almacén: configuración, acceso y diálogo", () => {
  test("cargarConfig despacha la config recibida y concede el acceso", async () => {
    const falsos = crearFalsos({ config: async () => ({ tipo: RESULTADO_API.OK, valor: CONFIG }) });
    const instancia = crearInstancia(falsos.dependencias);
    await instancia.acciones.cargarConfig(new AbortController().signal);
    expect(conversacion(instancia).config).toEqual(CONFIG);
    expect(conversacion(instancia).acceso).toEqual({ tipo: ESTADO_ACCESO.CONCEDIDO });
  });

  test("cargarConfig abortada no despacha", async () => {
    const controlador = new AbortController();
    const falsos = crearFalsos({
      config: async () => {
        controlador.abort();
        return { tipo: RESULTADO_API.OK, valor: CONFIG };
      },
    });
    const instancia = crearInstancia(falsos.dependencias);
    const antes = instancia.almacen.leer();
    await instancia.acciones.cargarConfig(controlador.signal);
    expect(instancia.almacen.leer()).toBe(antes);
  });

  test("reintentarConfig solo despacha cuando la config quedó resuelta", async () => {
    const respuestas: ResultadoApi<ConfigResponse>[] = [SIN_RED, { tipo: RESULTADO_API.OK, valor: CONFIG }];
    const falsos = crearFalsos({ config: async () => respuestas.shift() ?? SIN_RED });
    const instancia = crearInstancia(falsos.dependencias);
    const antes = instancia.almacen.leer();
    await instancia.acciones.reintentarConfig(new AbortController().signal);
    expect(instancia.almacen.leer()).toBe(antes);
    await instancia.acciones.reintentarConfig(new AbortController().signal);
    expect(conversacion(instancia).config).toEqual(CONFIG);
  });

  test("recibirConfig con acceso vencido pide el código", () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.recibirConfig({ tipo: RESULTADO_API.ACCESO_VENCIDO, mensaje: "x" });
    expect(conversacion(instancia).acceso).toEqual({ tipo: ESTADO_ACCESO.PEDIDO, aviso: null });
  });

  test("vencerAcceso pide el código con el aviso", () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.vencerAcceso(RESPUESTA);
    expect(conversacion(instancia).acceso).toEqual({ tipo: ESTADO_ACCESO.PEDIDO, aviso: RESPUESTA });
  });

  test("recargar vuelve a hidratar la sesión actual", async () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    instancia.acciones.enviarTexto(MENSAJE);
    await esperarTurnos();
    instancia.acciones.recargar();
    expect(conversacion(instancia).hidratando).toBe(true);
  });

  test("abrirNuevaSesion y cerrarNuevaSesion mueven el diálogo, y cerrar dos veces no cambia la raíz", () => {
    const falsos = crearFalsos();
    const instancia = crearInstancia(falsos.dependencias);
    let avisos = 0;
    instancia.almacen.suscribir(() => {
      avisos += 1;
    });
    instancia.acciones.abrirNuevaSesion();
    expect(instancia.almacen.leer().dialogoSesion.abierto).toBe(true);
    instancia.acciones.cerrarNuevaSesion();
    const cerrado = instancia.almacen.leer();
    instancia.acciones.cerrarNuevaSesion();
    expect(instancia.almacen.leer()).toBe(cerrado);
    expect(avisos).toBe(2);
  });
});
