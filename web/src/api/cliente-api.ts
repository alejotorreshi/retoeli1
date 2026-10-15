import {
  EVENTO_ABORTO,
  PEDIDO_JSON,
  REINTENTO_OCUPADA_MS,
  RESULTADO_API,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_ACCESO } from "@web/config/strings.ts";
import { sigueOcupada } from "@web/state/hidratacion.ts";
import type { EstadoModelo, ResultadoApi, ResultadoFallido, VistaSesionUi } from "@web/types/chat.type.ts";
import { PARAMETRO_SESION, RESPUESTA_HTTP, RUTA_API } from "@/config/constants/http.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import type { AccessBody, ConfigResponse, ErrorResponse, HealthResponse } from "@/http/types/api.type.ts";

const SIN_RED: ResultadoFallido = { tipo: RESULTADO_API.SIN_RED };

const ESTADOS_DEL_MODELO: ReadonlySet<string> = new Set(Object.values(ESTADO_LLM));

function esObjeto(valor: unknown): valor is object {
  return typeof valor === "object" && valor !== null;
}

function esErrorDelServidor(valor: unknown): valor is ErrorResponse {
  return (
    esObjeto(valor) &&
    "mensaje" in valor &&
    typeof valor.mensaje === "string" &&
    valor.mensaje.trim().length > 0
  );
}

function esListaDeTextos(valor: unknown): valor is readonly string[] {
  return Array.isArray(valor) && valor.every((elemento) => typeof elemento === "string");
}

function esEnteroPositivo(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isInteger(valor) && valor > 0;
}

function esConfig(valor: unknown): valor is ConfigResponse {
  return (
    esObjeto(valor) &&
    "fechaEjecucion" in valor &&
    typeof valor.fechaEjecucion === "string" &&
    "zona" in valor &&
    typeof valor.zona === "string" &&
    "casos" in valor &&
    esListaDeTextos(valor.casos) &&
    "presupuestoSesion" in valor &&
    esEnteroPositivo(valor.presupuestoSesion) &&
    "mensajeMaximo" in valor &&
    esEnteroPositivo(valor.mensajeMaximo)
  );
}

function esTextoONulo(valor: unknown): valor is string | null {
  return valor === null || typeof valor === "string";
}

function esHerramientaVista(valor: unknown): boolean {
  return (
    esObjeto(valor) &&
    "llamadaId" in valor &&
    typeof valor.llamadaId === "string" &&
    "herramienta" in valor &&
    typeof valor.herramienta === "string" &&
    "caso" in valor &&
    esTextoONulo(valor.caso) &&
    "ok" in valor &&
    typeof valor.ok === "boolean" &&
    "codigo" in valor &&
    esTextoONulo(valor.codigo) &&
    "resumen" in valor &&
    esTextoONulo(valor.resumen) &&
    "resultado" in valor &&
    (valor.resultado === null || esObjeto(valor.resultado))
  );
}

function esTurnoVista(valor: unknown): boolean {
  return (
    esObjeto(valor) &&
    "mensaje" in valor &&
    typeof valor.mensaje === "string" &&
    "herramientas" in valor &&
    Array.isArray(valor.herramientas) &&
    valor.herramientas.every(esHerramientaVista) &&
    "texto" in valor &&
    esTextoONulo(valor.texto)
  );
}

function esPendienteVista(valor: unknown): boolean {
  return (
    esObjeto(valor) &&
    "caso" in valor &&
    typeof valor.caso === "string" &&
    "bloqueosLegibles" in valor &&
    esListaDeTextos(valor.bloqueosLegibles)
  );
}

function esVistaSesion(valor: unknown): valor is VistaSesionUi {
  return (
    esObjeto(valor) &&
    "sesionId" in valor &&
    typeof valor.sesionId === "string" &&
    "turnos" in valor &&
    Array.isArray(valor.turnos) &&
    valor.turnos.every(esTurnoVista) &&
    "pendientes" in valor &&
    Array.isArray(valor.pendientes) &&
    valor.pendientes.every(esPendienteVista) &&
    "casosEnviados" in valor &&
    esListaDeTextos(valor.casosEnviados) &&
    "tokensUsados" in valor &&
    typeof valor.tokensUsados === "number" &&
    "ocupada" in valor &&
    typeof valor.ocupada === "boolean"
  );
}

function rutaDeSesion(sesionId: string): string {
  return RUTA_API.SESION.replace(`:${PARAMETRO_SESION}`, encodeURIComponent(sesionId));
}

function esEstadoDelModelo(valor: unknown): valor is EstadoModelo {
  return typeof valor === "string" && ESTADOS_DEL_MODELO.has(valor);
}

function esSalud(valor: unknown): valor is HealthResponse {
  return (
    esObjeto(valor) &&
    "ok" in valor &&
    valor.ok === true &&
    "provider" in valor &&
    typeof valor.provider === "string" &&
    "model" in valor &&
    typeof valor.model === "string" &&
    "llm" in valor &&
    esEstadoDelModelo(valor.llm)
  );
}

async function leerJson(respuesta: Response): Promise<unknown> {
  try {
    return await respuesta.json();
  } catch {
    return null;
  }
}

export async function pedir(ruta: string, opciones: RequestInit): Promise<Response | null> {
  try {
    return await fetch(ruta, opciones);
  } catch {
    return null;
  }
}

export async function resultadoDelRechazo(respuesta: Response): Promise<ResultadoFallido> {
  const valor = await leerJson(respuesta);
  const mensaje = esErrorDelServidor(valor) ? valor.mensaje : null;
  if (respuesta.status === RESPUESTA_HTTP.NO_AUTORIZADO) {
    return { tipo: RESULTADO_API.ACCESO_VENCIDO, mensaje: mensaje ?? TEXTO_ACCESO.vencido };
  }
  if (mensaje === null) return SIN_RED;
  return { tipo: RESULTADO_API.RECHAZO, status: respuesta.status, mensaje };
}

export async function obtenerConfig(
  signal: AbortSignal | null = null,
): Promise<ResultadoApi<ConfigResponse>> {
  const respuesta = await pedir(RUTA_API.CONFIG, { signal });
  if (respuesta === null) return SIN_RED;
  if (!respuesta.ok) return resultadoDelRechazo(respuesta);
  const valor = await leerJson(respuesta);
  return esConfig(valor) ? { tipo: RESULTADO_API.OK, valor } : SIN_RED;
}

export async function entrar(codigo: string): Promise<ResultadoApi<null>> {
  const cuerpo: AccessBody = { codigo };
  const respuesta = await pedir(RUTA_API.ACCESO, { ...PEDIDO_JSON, body: JSON.stringify(cuerpo) });
  if (respuesta === null) return SIN_RED;
  if (!respuesta.ok) return resultadoDelRechazo(respuesta);
  return { tipo: RESULTADO_API.OK, valor: null };
}

export async function obtenerSalud(signal: AbortSignal | null = null): Promise<ResultadoApi<HealthResponse>> {
  const respuesta = await pedir(RUTA_API.SALUD, { signal });
  if (respuesta === null) return SIN_RED;
  if (!respuesta.ok) return resultadoDelRechazo(respuesta);
  const valor = await leerJson(respuesta);
  return esSalud(valor) ? { tipo: RESULTADO_API.OK, valor } : SIN_RED;
}

export async function obtenerSesion(
  sesionId: string,
  signal: AbortSignal | null = null,
): Promise<ResultadoApi<VistaSesionUi>> {
  const respuesta = await pedir(rutaDeSesion(sesionId), { signal });
  if (respuesta === null) return SIN_RED;
  if (!respuesta.ok) return resultadoDelRechazo(respuesta);
  const valor = await leerJson(respuesta);
  return esVistaSesion(valor) ? { tipo: RESULTADO_API.OK, valor } : SIN_RED;
}

function esperar(milisegundos: number, signal: AbortSignal | null): Promise<boolean> {
  return new Promise((resolver) => {
    if (signal?.aborted) {
      resolver(false);
      return;
    }
    const alAbortar = () => {
      clearTimeout(temporizador);
      resolver(false);
    };
    const temporizador = setTimeout(() => {
      signal?.removeEventListener(EVENTO_ABORTO, alAbortar);
      resolver(true);
    }, milisegundos);
    signal?.addEventListener(EVENTO_ABORTO, alAbortar, { once: true });
  });
}

export async function obtenerSesionAsentada(
  sesionId: string,
  signal: AbortSignal | null = null,
): Promise<ResultadoApi<VistaSesionUi>> {
  const primera = await obtenerSesion(sesionId, signal);
  if (!sigueOcupada(primera)) return primera;
  const esperado = await esperar(REINTENTO_OCUPADA_MS, signal);
  return esperado ? obtenerSesion(sesionId, signal) : primera;
}
