import { PEDIDO_JSON, RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import { TEXTO_ACCESO } from "@web/config/strings.ts";
import type { ResultadoApi, ResultadoFallido } from "@web/types/chat.type.ts";
import { RESPUESTA_HTTP, RUTA_API } from "@/config/constants/http.constants.ts";
import type { AccessBody, ConfigResponse, ErrorResponse } from "@/http/types/api.type.ts";

const SIN_RED: ResultadoFallido = { tipo: RESULTADO_API.SIN_RED };

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
