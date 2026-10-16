import { parseArgs } from "node:util";
import { configSchema, saludSchema } from "@/cli/schemas/preflight.schema.ts";
import type {
  OpcionesPreflight,
  PasoPreflight,
  PlazosPreflight,
  ResultadoPreflight,
  UsoGuion,
} from "@/cli/types/preflight.type.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { CABECERA, PREFIJO_BEARER, RESPUESTA_HTTP, RUTA_API } from "@/config/constants/http.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import {
  CASO_GUION_PRD,
  MS_POR_SEGUNDO,
  OPCION_CLI,
  PAUSA_SONDEO_MS,
  PLAZO_DESPERTAR_MS,
  TIMEOUT_SONDEO_SALUD_MS,
  TIMEOUT_TURNO_GUION_MS,
  TIPO_OPCION_CLI,
} from "@/config/constants/preflight.constants.ts";
import { readPreflightEnv } from "@/config/env.ts";
import { TEXTO_PREFLIGHT } from "@/config/strings.ts";
import type { HealthResponse } from "@/http/types/api.type.ts";

const PLAZOS_POR_DEFECTO: PlazosPreflight = {
  despertarMs: PLAZO_DESPERTAR_MS,
  sondeoMs: TIMEOUT_SONDEO_SALUD_MS,
  pausaMs: PAUSA_SONDEO_MS,
  turnoMs: TIMEOUT_TURNO_GUION_MS,
};

type SaludLista = { readonly salud: HealthResponse; readonly ms: number };

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

async function recorrer(opciones: OpcionesPreflight): Promise<PasoPreflight<UsoGuion | null>> {
  const salud = await verificarSalud(opciones);
  if (!salud.ok) return salud;
  const acceso = await verificarAcceso(opciones);
  if (!acceso.ok) return acceso;
  return exito(null);
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
