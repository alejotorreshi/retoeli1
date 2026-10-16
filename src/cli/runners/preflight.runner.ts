import { parseArgs } from "node:util";
import { EventSourceParserStream } from "eventsource-parser/stream";
import type { z } from "zod";
import {
  archivosGuionSchema,
  configSchema,
  confirmacionGuionSchema,
  errorGuionSchema,
  finHerramientaGuionSchema,
  finTurnoGuionSchema,
  inicioTurnoGuionSchema,
  saludSchema,
  usoTurnoGuionSchema,
} from "@/cli/schemas/preflight.schema.ts";
import type {
  ConfirmacionGuion,
  FinHerramientaGuion,
  FinTurnoGuion,
  LecturaTurnoGuion,
  OpcionesPreflight,
  PasoPreflight,
  PlazosPreflight,
  ResultadoPreflight,
  UsoGuion,
  UsoTurnoGuion,
} from "@/cli/types/preflight.type.ts";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { ARCHIVOS_SALIDA } from "@/config/constants/files.constants.ts";
import {
  CABECERA,
  METODO_POST,
  PARAMETRO_CASO,
  PREFIJO_BEARER,
  RESPUESTA_HTTP,
  RUTA_API,
  TIPO_CONTENIDO,
  VALOR_CABECERA,
} from "@/config/constants/http.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import {
  CASO_GUION_PRD,
  HERRAMIENTA_ENVIO_GUION,
  HERRAMIENTAS_TURNO_PROCESAR,
  MS_POR_SEGUNDO,
  OPCION_CLI,
  PAUSA_SONDEO_MS,
  PLAZO_DESPERTAR_MS,
  TIMEOUT_SONDEO_SALUD_MS,
  TIMEOUT_TURNO_GUION_MS,
  TIPO_BLOQUEO_GUION,
  TIPO_OPCION_CLI,
  TURNO_GUION,
} from "@/config/constants/preflight.constants.ts";
import { readPreflightEnv } from "@/config/env.ts";
import { TEXTO_PREFLIGHT } from "@/config/strings.ts";
import type { ChatBody, HealthResponse } from "@/http/types/api.type.ts";

const PLAZOS_POR_DEFECTO: PlazosPreflight = {
  despertarMs: PLAZO_DESPERTAR_MS,
  sondeoMs: TIMEOUT_SONDEO_SALUD_MS,
  pausaMs: PAUSA_SONDEO_MS,
  turnoMs: TIMEOUT_TURNO_GUION_MS,
};

type SaludLista = { readonly salud: HealthResponse; readonly ms: number };

type LecturaEnCurso = {
  sesionId: string | null;
  herramientas: FinHerramientaGuion[];
  confirmaciones: ConfirmacionGuion[];
  usos: UsoTurnoGuion[];
  errores: string[];
  fin: FinTurnoGuion | null;
};

const CABECERAS_SSE = [
  [CABECERA.CACHE_CONTROL, VALOR_CABECERA.SIN_CACHE_NI_TRANSFORMACION],
  [CABECERA.X_ACCEL_BUFFERING, VALOR_CABECERA.SIN_BUFFER],
] as const;

const RUTA_ARCHIVOS_GUION = RUTA_API.ARCHIVOS.replace(
  `:${PARAMETRO_CASO}`,
  encodeURIComponent(CASO_GUION_PRD),
);

function exito<T>(valor: T): PasoPreflight<T> {
  return { ok: true, valor };
}

function fallido(mensaje: string): { readonly ok: false; readonly mensaje: string } {
  return { ok: false, mensaje };
}

function segundos(ms: number): number {
  return Math.ceil(ms / MS_POR_SEGUNDO);
}

function autorizacion(opciones: OpcionesPreflight): Record<string, string> {
  return { [CABECERA.AUTORIZACION]: `${PREFIJO_BEARER}${opciones.codigo}` };
}

async function pedir(opciones: OpcionesPreflight, ruta: string, init: RequestInit): Promise<Response | null> {
  try {
    return await opciones.fetch(new URL(ruta, opciones.url), init);
  } catch {
    return null;
  }
}

async function descartar(respuesta: Response | null): Promise<void> {
  try {
    await respuesta?.body?.cancel();
  } catch {
    return;
  }
}

async function leerJson(respuesta: Response): Promise<unknown> {
  try {
    return await respuesta.json();
  } catch {
    return undefined;
  }
}

async function sondearSalud(opciones: OpcionesPreflight): Promise<PasoPreflight<HealthResponse> | null> {
  const respuesta = await pedir(opciones, RUTA_API.SALUD, {
    signal: AbortSignal.timeout(opciones.plazos.sondeoMs),
  });
  if (respuesta === null || respuesta.status !== RESPUESTA_HTTP.OK) {
    await descartar(respuesta);
    return null;
  }
  const salud = saludSchema.safeParse(await leerJson(respuesta));
  return salud.success ? exito(salud.data) : fallido(TEXTO_PREFLIGHT.respuestaInvalida(RUTA_API.SALUD));
}

async function esperarSalud(opciones: OpcionesPreflight): Promise<PasoPreflight<SaludLista>> {
  const { despertarMs, pausaMs } = opciones.plazos;
  const inicio = opciones.ahora();
  let ultimoFallo: { readonly ok: false; readonly mensaje: string } | null = null;
  for (;;) {
    const sondeo = await sondearSalud(opciones);
    if (sondeo?.ok === true) return exito({ salud: sondeo.valor, ms: opciones.ahora() - inicio });
    ultimoFallo = sondeo ?? ultimoFallo;
    if (opciones.ahora() - inicio + pausaMs > despertarMs) break;
    await opciones.esperar(pausaMs);
  }
  return ultimoFallo ?? fallido(TEXTO_PREFLIGHT.servicioDormido(segundos(despertarMs)));
}

async function verificarSalud(opciones: OpcionesPreflight): Promise<PasoPreflight<HealthResponse>> {
  const lista = await esperarSalud(opciones);
  if (!lista.ok) return lista;
  const { salud, ms } = lista.valor;
  if (salud.llm !== ESTADO_LLM.DISPONIBLE) return fallido(TEXTO_PREFLIGHT.modeloNoDisponible(salud.llm));
  opciones.escribir(TEXTO_PREFLIGHT.saludLista(salud.provider, salud.model, Math.round(ms)));
  return exito(salud);
}

function rechazoDeAcceso(estado: number): string {
  if (estado === RESPUESTA_HTTP.NO_AUTORIZADO) return TEXTO_PREFLIGHT.codigoRechazado;
  if (estado === RESPUESTA_HTTP.DEMASIADOS_PEDIDOS) return TEXTO_PREFLIGHT.ipBloqueada;
  return TEXTO_PREFLIGHT.estadoInesperado(RUTA_API.CONFIG, estado);
}

async function verificarAcceso(opciones: OpcionesPreflight): Promise<PasoPreflight<null>> {
  const respuesta = await pedir(opciones, RUTA_API.CONFIG, {
    headers: autorizacion(opciones),
    signal: AbortSignal.timeout(opciones.plazos.sondeoMs),
  });
  if (respuesta === null) return fallido(TEXTO_PREFLIGHT.errorDeRed(RUTA_API.CONFIG));
  if (respuesta.status !== RESPUESTA_HTTP.OK) {
    await descartar(respuesta);
    return fallido(rechazoDeAcceso(respuesta.status));
  }
  const config = configSchema.safeParse(await leerJson(respuesta));
  if (!config.success) return fallido(TEXTO_PREFLIGHT.respuestaInvalida(RUTA_API.CONFIG));
  const { fechaEjecucion, casos } = config.data;
  if (fechaEjecucion !== FECHA_DEMO) return fallido(TEXTO_PREFLIGHT.fechaInesperada(fechaEjecucion));
  if (!casos.includes(CASO_GUION_PRD)) return fallido(TEXTO_PREFLIGHT.casoAusente(CASO_GUION_PRD));
  opciones.escribir(TEXTO_PREFLIGHT.accesoOk(fechaEjecucion, casos.length));
  return exito(null);
}

function leerJsonDeTexto(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return undefined;
  }
}

function anotar<T>(esquema: z.ZodType<T>, datos: unknown, guardar: (valor: T) => void): boolean {
  const lectura = esquema.safeParse(datos);
  if (lectura.success) guardar(lectura.data);
  return lectura.success;
}

function anotarFrame(lectura: LecturaEnCurso, evento: string | undefined, datos: unknown): boolean {
  switch (evento) {
    case TIPO_EVENTO.INICIO_TURNO:
      return anotar(inicioTurnoGuionSchema, datos, ({ sesionId }) => {
        lectura.sesionId = sesionId;
      });
    case TIPO_EVENTO.FIN_HERRAMIENTA:
      return anotar(finHerramientaGuionSchema, datos, (fin) => lectura.herramientas.push(fin));
    case TIPO_EVENTO.CONFIRMACION_REQUERIDA:
      return anotar(confirmacionGuionSchema, datos, (pendiente) => lectura.confirmaciones.push(pendiente));
    case TIPO_EVENTO.USO:
      return anotar(usoTurnoGuionSchema, datos, (uso) => lectura.usos.push(uso));
    case TIPO_EVENTO.ERROR:
      return anotar(errorGuionSchema, datos, ({ mensaje }) => lectura.errores.push(mensaje));
    case TIPO_EVENTO.FIN_TURNO:
      return anotar(finTurnoGuionSchema, datos, (fin) => {
        lectura.fin = fin;
      });
    default:
      return true;
  }
}

async function leerTurno(cuerpo: NonNullable<Response["body"]>): Promise<PasoPreflight<LecturaTurnoGuion>> {
  const lectura: LecturaEnCurso = {
    sesionId: null,
    herramientas: [],
    confirmaciones: [],
    usos: [],
    errores: [],
    fin: null,
  };
  try {
    const frames = cuerpo.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream());
    for await (const frame of frames) {
      if (!anotarFrame(lectura, frame.event, leerJsonDeTexto(frame.data))) {
        return fallido(TEXTO_PREFLIGHT.respuestaInvalida(RUTA_API.CHAT));
      }
    }
  } catch {
    return fallido(TEXTO_PREFLIGHT.errorDeRed(RUTA_API.CHAT));
  }
  return exito(lectura);
}

function cabeceraSseFaltante(respuesta: Response): string | null {
  const tipo = respuesta.headers.get(CABECERA.TIPO_CONTENIDO) ?? "";
  if (!tipo.startsWith(TIPO_CONTENIDO.SSE)) return CABECERA.TIPO_CONTENIDO;
  const faltante = CABECERAS_SSE.find(([nombre, valor]) => respuesta.headers.get(nombre) !== valor);
  return faltante?.[0] ?? null;
}

function cabecerasDelChat(opciones: OpcionesPreflight): Record<string, string> {
  return {
    ...autorizacion(opciones),
    [CABECERA.TIPO_CONTENIDO]: TIPO_CONTENIDO.JSON,
    [CABECERA.ACCEPT]: TIPO_CONTENIDO.SSE,
  };
}

async function enviarTurno(
  opciones: OpcionesPreflight,
  sesionId: string | null,
  mensaje: string,
): Promise<PasoPreflight<LecturaTurnoGuion>> {
  const cuerpo: ChatBody = { sessionId: sesionId, message: mensaje };
  const respuesta = await pedir(opciones, RUTA_API.CHAT, {
    method: METODO_POST,
    headers: cabecerasDelChat(opciones),
    body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(opciones.plazos.turnoMs),
  });
  if (respuesta === null) return fallido(TEXTO_PREFLIGHT.errorDeRed(RUTA_API.CHAT));
  if (respuesta.status !== RESPUESTA_HTTP.OK) {
    await descartar(respuesta);
    return fallido(TEXTO_PREFLIGHT.estadoInesperado(RUTA_API.CHAT, respuesta.status));
  }
  const faltante = cabeceraSseFaltante(respuesta);
  if (faltante !== null || respuesta.body === null) {
    await descartar(respuesta);
    return fallido(
      faltante === null
        ? TEXTO_PREFLIGHT.respuestaInvalida(RUTA_API.CHAT)
        : TEXTO_PREFLIGHT.cabeceraSse(faltante),
    );
  }
  const lectura = await leerTurno(respuesta.body);
  if (!lectura.ok) return lectura;
  const [error] = lectura.valor.errores;
  if (error !== undefined) return fallido(TEXTO_PREFLIGHT.errorDelAgente(error));
  if (lectura.valor.fin === null || lectura.valor.sesionId === null) {
    return fallido(TEXTO_PREFLIGHT.turnoIncompleto);
  }
  return lectura;
}

function terminoBien(lectura: LecturaTurnoGuion, herramienta: string): boolean {
  return lectura.herramientas.some(
    (fin) => fin.herramienta === herramienta && fin.caso === CASO_GUION_PRD && fin.ok,
  );
}

function fallaDelTurnoProcesar(lectura: LecturaTurnoGuion): string | null {
  const pendiente = lectura.confirmaciones.filter(({ caso }) => caso === CASO_GUION_PRD).at(-1);
  if (pendiente === undefined || lectura.fin?.needsConfirmation !== true) {
    return TEXTO_PREFLIGHT.sinConfirmacion(CASO_GUION_PRD);
  }
  if (!pendiente.bloqueos.some((bloqueo) => bloqueo.includes(TIPO_BLOQUEO_GUION))) {
    return TEXTO_PREFLIGHT.bloqueoAusente(TIPO_BLOQUEO_GUION);
  }
  const faltante = HERRAMIENTAS_TURNO_PROCESAR.find((herramienta) => !terminoBien(lectura, herramienta));
  if (faltante !== undefined) return TEXTO_PREFLIGHT.herramientaFaltante(faltante);
  if (lectura.herramientas.some(({ herramienta }) => herramienta === HERRAMIENTA_ENVIO_GUION)) {
    return TEXTO_PREFLIGHT.envioAntesDeTiempo;
  }
  return null;
}

function fallaDelTurnoConfirmar(lectura: LecturaTurnoGuion): string | null {
  if (!terminoBien(lectura, HERRAMIENTA_ENVIO_GUION)) return TEXTO_PREFLIGHT.envioFaltante;
  if (lectura.fin?.needsConfirmation !== false) return TEXTO_PREFLIGHT.confirmacionAbierta;
  return null;
}

async function archivosDelGuion(opciones: OpcionesPreflight): Promise<PasoPreflight<readonly string[]>> {
  const respuesta = await pedir(opciones, RUTA_ARCHIVOS_GUION, {
    headers: autorizacion(opciones),
    signal: AbortSignal.timeout(opciones.plazos.sondeoMs),
  });
  if (respuesta === null) return fallido(TEXTO_PREFLIGHT.errorDeRed(RUTA_ARCHIVOS_GUION));
  if (respuesta.status !== RESPUESTA_HTTP.OK) {
    await descartar(respuesta);
    return fallido(TEXTO_PREFLIGHT.estadoInesperado(RUTA_ARCHIVOS_GUION, respuesta.status));
  }
  const lista = archivosGuionSchema.safeParse(await leerJson(respuesta));
  if (!lista.success) return fallido(TEXTO_PREFLIGHT.respuestaInvalida(RUTA_ARCHIVOS_GUION));
  return exito(lista.data.archivos.map(({ nombre }) => nombre));
}

function sumarUsos(usos: readonly UsoTurnoGuion[]): UsoGuion {
  return {
    entrada: usos.reduce((total, uso) => total + uso.entrada, 0),
    cacheHit: usos.reduce((total, uso) => total + uso.cacheHit, 0),
    salida: usos.reduce((total, uso) => total + uso.salida, 0),
    totalSesion: usos.at(-1)?.totalSesion ?? 0,
  };
}

async function turnoProcesar(opciones: OpcionesPreflight): Promise<PasoPreflight<LecturaTurnoGuion>> {
  const turno = await enviarTurno(opciones, null, TEXTO_PREFLIGHT.mensajeGuion);
  if (!turno.ok) return turno;
  const falla = fallaDelTurnoProcesar(turno.valor);
  if (falla !== null) return fallido(falla);
  const archivos = await archivosDelGuion(opciones);
  if (!archivos.ok) return archivos;
  if (archivos.valor.includes(ARCHIVOS_SALIDA.ENVIO_SIMULADO)) {
    return fallido(TEXTO_PREFLIGHT.archivoInesperado(ARCHIVOS_SALIDA.ENVIO_SIMULADO));
  }
  opciones.escribir(TEXTO_PREFLIGHT.turnoOk(TURNO_GUION.PROCESAR));
  return turno;
}

async function turnoConfirmar(
  opciones: OpcionesPreflight,
  sesionId: string | null,
): Promise<PasoPreflight<LecturaTurnoGuion>> {
  const turno = await enviarTurno(opciones, sesionId, TEXTO_PREFLIGHT.mensajeConfirmacion);
  if (!turno.ok) return turno;
  const falla = fallaDelTurnoConfirmar(turno.valor);
  if (falla !== null) return fallido(falla);
  const archivos = await archivosDelGuion(opciones);
  if (!archivos.ok) return archivos;
  if (!archivos.valor.includes(ARCHIVOS_SALIDA.ENVIO_SIMULADO)) {
    return fallido(TEXTO_PREFLIGHT.archivoFaltante(ARCHIVOS_SALIDA.ENVIO_SIMULADO));
  }
  opciones.escribir(TEXTO_PREFLIGHT.turnoOk(TURNO_GUION.CONFIRMAR));
  return turno;
}

async function correrGuion(opciones: OpcionesPreflight): Promise<PasoPreflight<UsoGuion>> {
  const procesar = await turnoProcesar(opciones);
  if (!procesar.ok) return procesar;
  const confirmar = await turnoConfirmar(opciones, procesar.valor.sesionId);
  if (!confirmar.ok) return confirmar;
  const tokens = sumarUsos([...procesar.valor.usos, ...confirmar.valor.usos]);
  opciones.escribir(
    TEXTO_PREFLIGHT.tokens(tokens.entrada, tokens.cacheHit, tokens.salida, tokens.totalSesion),
  );
  return exito(tokens);
}

async function recorrer(opciones: OpcionesPreflight): Promise<PasoPreflight<UsoGuion | null>> {
  const salud = await verificarSalud(opciones);
  if (!salud.ok) return salud;
  const acceso = await verificarAcceso(opciones);
  if (!acceso.ok) return acceso;
  return opciones.guion ? correrGuion(opciones) : exito(null);
}

export async function ejecutarPreflight(opciones: OpcionesPreflight): Promise<ResultadoPreflight> {
  opciones.escribir(TEXTO_PREFLIGHT.despertando(opciones.url.origin, segundos(opciones.plazos.despertarMs)));
  const resultado = await recorrer(opciones);
  if (!resultado.ok) {
    opciones.escribir(resultado.mensaje);
    opciones.escribir(TEXTO_PREFLIGHT.resultadoFallido);
    return { fallido: true, tokens: null };
  }
  opciones.escribir(TEXTO_PREFLIGHT.resultadoOk);
  return { fallido: false, tokens: resultado.valor };
}

function leerOpciones(argumentos: readonly string[]) {
  try {
    return parseArgs({
      args: [...argumentos],
      strict: true,
      allowPositionals: false,
      options: {
        [OPCION_CLI.URL]: { type: TIPO_OPCION_CLI.TEXTO },
        [OPCION_CLI.GUION]: { type: TIPO_OPCION_CLI.BOOLEANO, default: false },
      },
    }).values;
  } catch {
    return null;
  }
}

async function correrComando(argumentos: readonly string[]): Promise<boolean> {
  const valores = leerOpciones(argumentos);
  if (valores === null) {
    console.log(TEXTO_PREFLIGHT.uso);
    return true;
  }
  const entorno = readPreflightEnv(valores[OPCION_CLI.URL]);
  if (!entorno.success) {
    const variables = entorno.error.issues.map(({ path, message }) => [path.join(), message] as const);
    console.log(TEXTO_PREFLIGHT.entornoInvalido(variables));
    console.log(TEXTO_PREFLIGHT.uso);
    return true;
  }
  const { PREFLIGHT_URL, PREFLIGHT_ACCESS_CODE } = entorno.data;
  if (PREFLIGHT_URL === undefined) {
    console.log(TEXTO_PREFLIGHT.faltaUrl);
    return true;
  }
  const resultado = await ejecutarPreflight({
    url: new URL(PREFLIGHT_URL),
    codigo: PREFLIGHT_ACCESS_CODE,
    guion: valores[OPCION_CLI.GUION] ?? false,
    fetch: (url, init) => fetch(url, init),
    plazos: PLAZOS_POR_DEFECTO,
    escribir: console.log,
    esperar: (ms) => Bun.sleep(ms),
    ahora: () => performance.now(),
  });
  return resultado.fallido;
}

if (import.meta.main) {
  if (await correrComando(Bun.argv.slice(2))) process.exitCode = 1;
}
