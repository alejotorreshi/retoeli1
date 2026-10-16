import type {
  GuionChat,
  OpcionesRedWeb,
  PedidoWeb,
  RedWeb,
  RespuestaFalsa,
} from "@tests/helpers/types/red-web.type.ts";
import { ACCION, MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import {
  CABECERA,
  MENSAJE_MAXIMO_CARACTERES_POR_DEFECTO,
  METODO_POST,
  RESPUESTA_HTTP,
  RUTA_API,
  TIPO_CONTENIDO,
} from "@/config/constants/http.constants.ts";
import { ESTADO_LLM, PRESET_DEEPSEEK, PROVEEDOR_DEEPSEEK } from "@/config/constants/llm.constants.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";
import type { ConfigResponse, HealthResponse, SseEvent } from "@/http/types/api.type.ts";
import type { LlmHealthState } from "@/llm/types/resilience.type.ts";
import type { ResultadoVisible } from "@/loop/types/resultado-visible.type.ts";

const METODO_GET = "GET";

const ORIGEN_DE_PRUEBA = "http://localhost:3000";

const SEPARADOR_CONSULTA = "?";

const EVENTO_ABORTO = "abort";

export const CASOS_DE_PRUEBA = [
  "co-industrias-delta",
  "ec-corp-andina",
  "hn-agroexport-sula",
  "pa-logistica-istmo",
] as const;

export const CONFIG_DE_PRUEBA: ConfigResponse = {
  fechaEjecucion: "2026-09-03",
  zona: "America/Bogota",
  casos: CASOS_DE_PRUEBA,
  presupuestoSesion: 300_000,
  mensajeMaximo: MENSAJE_MAXIMO_CARACTERES_POR_DEFECTO,
};

const RUTAS_PUBLICAS: ReadonlySet<string> = new Set([RUTA_API.SALUD, RUTA_API.ACCESO]);

function rutaDe(entrada: string | URL | Request): string {
  const texto = typeof entrada === "string" ? entrada : "url" in entrada ? entrada.url : entrada.href;
  const sinOrigen = texto.startsWith(ORIGEN_DE_PRUEBA) ? texto.slice(ORIGEN_DE_PRUEBA.length) : texto;
  return sinOrigen.split(SEPARADOR_CONSULTA)[0] ?? sinOrigen;
}

function cuerpoDe(cuerpo: unknown): unknown {
  if (typeof cuerpo !== "string") return null;
  try {
    return JSON.parse(cuerpo);
  } catch {
    return cuerpo;
  }
}

function codigoDe(cuerpo: unknown): string | null {
  if (typeof cuerpo !== "object" || cuerpo === null || !("codigo" in cuerpo)) return null;
  return typeof cuerpo.codigo === "string" ? cuerpo.codigo : null;
}

export const TURNO_DE_PRUEBA = "turno-de-prueba";

export function eventoInicio(sesionId: string): SseEvent {
  return {
    tipo: TIPO_EVENTO.INICIO_TURNO,
    sesionId,
    turnoId: TURNO_DE_PRUEBA,
    sesionNueva: true,
    sesionExpirada: false,
  };
}

export function eventoTexto(texto: string): SseEvent {
  return { tipo: TIPO_EVENTO.TEXTO, turnoId: TURNO_DE_PRUEBA, texto };
}

export function eventoFin(needsConfirmation = false): SseEvent {
  return {
    tipo: TIPO_EVENTO.FIN_TURNO,
    turnoId: TURNO_DE_PRUEBA,
    motivo: MOTIVO_FIN.FINAL,
    needsConfirmation,
  };
}

export function eventoConfirmacion(caso: string, bloqueosLegibles: readonly string[]): SseEvent {
  return {
    tipo: TIPO_EVENTO.CONFIRMACION_REQUERIDA,
    turnoId: TURNO_DE_PRUEBA,
    caso,
    accion: ACCION.ENVIO,
    bloqueos: [],
    bloqueosLegibles,
  };
}

export function eventosDeHerramienta(
  herramienta: string,
  caso: string,
  resultado: ResultadoVisible | null,
): readonly SseEvent[] {
  const llamadaId = `${herramienta}-${caso}`;
  return [
    {
      tipo: TIPO_EVENTO.INICIO_HERRAMIENTA,
      turnoId: TURNO_DE_PRUEBA,
      llamadaId,
      herramienta,
      caso,
      argumentos: { caso },
    },
    {
      tipo: TIPO_EVENTO.FIN_HERRAMIENTA,
      turnoId: TURNO_DE_PRUEBA,
      llamadaId,
      herramienta,
      caso,
      ok: true,
      codigo: null,
      resumen: null,
      resultado,
    },
  ];
}

function marco(evento: SseEvent): string {
  return `event: ${evento.tipo}\ndata: ${JSON.stringify(evento)}\n\n`;
}

export function crearRedWeb(opciones: OpcionesRedWeb): RedWeb {
  const { Response: RespuestaNativa } = opciones.nativos;
  const pedidos: PedidoWeb[] = [];
  const guiones: GuionChat[] = [...(opciones.guiones ?? [])];
  const rutas = new Map<string, RespuestaFalsa>(Object.entries(opciones.rutas ?? {}));
  const config = opciones.config ?? CONFIG_DE_PRUEBA;
  const codificador = new TextEncoder();
  let salud: LlmHealthState = opciones.salud ?? ESTADO_LLM.DISPONIBLE;
  let configDisponible = opciones.configDisponible ?? true;
  let accesoConcedido = opciones.codigoAcceso === undefined;
  let soltarRetenido: (() => void) | null = null;

  function json(estado: number, cuerpo: unknown): Response {
    return new RespuestaNativa(JSON.stringify(cuerpo), {
      status: estado,
      headers: { [CABECERA.TIPO_CONTENIDO]: TIPO_CONTENIDO.JSON },
    });
  }

  function flujoDe(guion: GuionChat, signal: AbortSignal | null | undefined): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
      start(controlador) {
        const emitir = (eventos: readonly SseEvent[]) => {
          for (const evento of eventos) controlador.enqueue(codificador.encode(marco(evento)));
        };
        emitir(guion.eventos);
        const retenidos = guion.retenidos;
        if (retenidos === undefined) {
          controlador.close();
          return;
        }
        let abierto = true;
        signal?.addEventListener(
          EVENTO_ABORTO,
          () => {
            if (!abierto) return;
            abierto = false;
            controlador.error(new Error("pedido abortado"));
          },
          { once: true },
        );
        soltarRetenido = () => {
          if (!abierto) return;
          abierto = false;
          emitir(retenidos);
          controlador.close();
        };
      },
    });
  }

  function responderChat(signal: AbortSignal | null | undefined): Response {
    const guion = guiones.shift();
    if (guion === undefined)
      return json(RESPUESTA_HTTP.ERROR_INTERNO, { mensaje: MENSAJE_HTTP.errorInterno });
    return new RespuestaNativa(flujoDe(guion, signal), {
      status: RESPUESTA_HTTP.OK,
      headers: { [CABECERA.TIPO_CONTENIDO]: TIPO_CONTENIDO.SSE },
    });
  }

  function responderAcceso(cuerpo: unknown): Response {
    if (opciones.codigoAcceso === undefined || codigoDe(cuerpo) !== opciones.codigoAcceso) {
      return json(RESPUESTA_HTTP.NO_AUTORIZADO, { mensaje: MENSAJE_HTTP.codigoInvalido });
    }
    accesoConcedido = true;
    return new RespuestaNativa(null, { status: RESPUESTA_HTTP.SIN_CONTENIDO });
  }

  function responder(pedido: PedidoWeb, signal: AbortSignal | null | undefined): Response {
    const { metodo, ruta, cuerpo } = pedido;
    if (!accesoConcedido && !RUTAS_PUBLICAS.has(ruta)) {
      return json(RESPUESTA_HTTP.NO_AUTORIZADO, { mensaje: MENSAJE_HTTP.accesoVencido });
    }
    if (ruta === RUTA_API.SALUD) {
      const respuesta: HealthResponse = {
        ok: true,
        provider: PROVEEDOR_DEEPSEEK,
        model: PRESET_DEEPSEEK.model,
        llm: salud,
      };
      return json(RESPUESTA_HTTP.OK, respuesta);
    }
    if (ruta === RUTA_API.ACCESO && metodo === METODO_POST) return responderAcceso(cuerpo);
    if (ruta === RUTA_API.CONFIG) {
      return configDisponible
        ? json(RESPUESTA_HTTP.OK, config)
        : json(RESPUESTA_HTTP.NO_DISPONIBLE, { mensaje: MENSAJE_HTTP.errorInterno });
    }
    if (ruta === RUTA_API.CHAT && metodo === METODO_POST) return responderChat(signal);
    const fija = rutas.get(ruta);
    if (fija !== undefined) return json(fija.estado, fija.cuerpo);
    return json(RESPUESTA_HTTP.NO_ENCONTRADO, { mensaje: MENSAJE_HTTP.rutaNoEncontrada });
  }

  async function fetchFalso(entrada: string | URL | Request, init?: RequestInit): Promise<Response> {
    const pedido: PedidoWeb = {
      metodo: init?.method ?? METODO_GET,
      ruta: rutaDe(entrada),
      cuerpo: cuerpoDe(init?.body),
    };
    pedidos.push(pedido);
    if (init?.signal?.aborted === true) throw new Error("pedido abortado");
    return responder(pedido, init?.signal);
  }

  return {
    fetch: Object.assign(fetchFalso, { preconnect: () => undefined }),
    pedidos,
    pedidosA: (ruta, metodo) =>
      pedidos.filter((pedido) => pedido.ruta === ruta && (metodo === undefined || pedido.metodo === metodo)),
    encolarGuion: (guion) => {
      guiones.push(guion);
    },
    fijarSalud: (estado) => {
      salud = estado;
    },
    fijarRuta: (ruta, respuesta) => {
      rutas.set(ruta, respuesta);
    },
    fijarConfigDisponible: (disponible) => {
      configDisponible = disponible;
    },
    soltar: () => {
      const soltar = soltarRetenido;
      soltarRetenido = null;
      soltar?.();
    },
  };
}
