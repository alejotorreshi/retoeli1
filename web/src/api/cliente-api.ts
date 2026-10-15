import {
  EVENTO_ABORTO,
  PEDIDO_JSON,
  REINTENTO_OCUPADA_MS,
  RESULTADO_API,
  SEPARADOR_RUTA,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_ACCESO } from "@web/config/strings.ts";
import { sigueOcupada } from "@web/state/hidratacion.ts";
import type {
  ArchivoUi,
  EstadoModelo,
  GuardarDescarga,
  ResultadoApi,
  ResultadoFallido,
  VistaPreviaUi,
  VistaSesionUi,
} from "@web/types/chat.type.ts";
import { PREFIJO_PAQUETE, TIPO_ARCHIVO_CASO, TIPO_VISTA_PREVIA } from "@/config/constants/files.constants.ts";
import {
  PARAMETRO_ARCHIVO,
  PARAMETRO_CASO,
  PARAMETRO_SESION,
  RESPUESTA_HTTP,
  RUTA_API,
} from "@/config/constants/http.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import type {
  AccessBody,
  ConfigResponse,
  ErrorResponse,
  FileListResponse,
  HealthResponse,
} from "@/http/types/api.type.ts";

const SIN_RED: ResultadoFallido = { tipo: RESULTADO_API.SIN_RED };

const ESTADOS_DEL_MODELO: ReadonlySet<string> = new Set(Object.values(ESTADO_LLM));

const TIPOS_DE_ARCHIVO: ReadonlySet<string> = new Set(Object.values(TIPO_ARCHIVO_CASO));

const ESTADOS_DE_CAMPO: ReadonlySet<string> = new Set(Object.values(ESTADO_CAMPO));

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

function esArchivo(valor: unknown): valor is ArchivoUi {
  return (
    esObjeto(valor) &&
    "nombre" in valor &&
    typeof valor.nombre === "string" &&
    "tipo" in valor &&
    typeof valor.tipo === "string" &&
    TIPOS_DE_ARCHIVO.has(valor.tipo) &&
    "previsualizable" in valor &&
    typeof valor.previsualizable === "boolean"
  );
}

function esListaDeArchivos(valor: unknown): valor is FileListResponse {
  return (
    esObjeto(valor) && "archivos" in valor && Array.isArray(valor.archivos) && valor.archivos.every(esArchivo)
  );
}

function estaEnElPaquete(nombre: string): boolean {
  return nombre.startsWith(PREFIJO_PAQUETE);
}

export function nombreDeDescarga(nombre: string): string {
  return estaEnElPaquete(nombre) ? nombre.slice(PREFIJO_PAQUETE.length) : nombre;
}

function rutaConParametros(patron: string, caso: string, nombre: string | null): string {
  const valores = new Map([
    [`:${PARAMETRO_CASO}`, caso],
    [`:${PARAMETRO_ARCHIVO}`, nombre === null ? null : nombreDeDescarga(nombre)],
  ]);
  return patron
    .split(SEPARADOR_RUTA)
    .map((segmento) => {
      const valor = valores.get(segmento);
      return valor === undefined || valor === null ? segmento : encodeURIComponent(valor);
    })
    .join(SEPARADOR_RUTA);
}

export function rutaDeArchivos(caso: string): string {
  return rutaConParametros(RUTA_API.ARCHIVOS, caso, null);
}

export function rutaDeDescarga(caso: string, nombre: string): string {
  const patron = estaEnElPaquete(nombre) ? RUTA_API.ARCHIVO_PAQUETE : RUTA_API.ARCHIVO;
  return rutaConParametros(patron, caso, nombre);
}

export async function listarArchivos(
  caso: string,
  signal: AbortSignal | null = null,
): Promise<ResultadoApi<readonly ArchivoUi[]>> {
  const respuesta = await pedir(rutaDeArchivos(caso), { signal });
  if (respuesta === null) return SIN_RED;
  if (!respuesta.ok) return resultadoDelRechazo(respuesta);
  const valor = await leerJson(respuesta);
  return esListaDeArchivos(valor) ? { tipo: RESULTADO_API.OK, valor: valor.archivos } : SIN_RED;
}

async function leerCuerpo(respuesta: Response): Promise<Blob | null> {
  try {
    return await respuesta.blob();
  } catch {
    return null;
  }
}

export async function descargarArchivo(
  caso: string,
  nombre: string,
  guardar: GuardarDescarga,
): Promise<ResultadoApi<null>> {
  const respuesta = await pedir(rutaDeDescarga(caso, nombre), {});
  if (respuesta === null) return SIN_RED;
  if (!respuesta.ok) return resultadoDelRechazo(respuesta);
  const cuerpo = await leerCuerpo(respuesta);
  if (cuerpo === null) return SIN_RED;
  guardar(cuerpo, nombreDeDescarga(nombre));
  return { tipo: RESULTADO_API.OK, valor: null };
}

export function rutaDeVistaPrevia(caso: string, nombre: string): string {
  const patron = estaEnElPaquete(nombre) ? RUTA_API.VISTA_PREVIA_PAQUETE : RUTA_API.VISTA_PREVIA;
  return rutaConParametros(patron, caso, nombre);
}

function esFilaVistaPrevia(valor: unknown): boolean {
  return (
    esObjeto(valor) &&
    "etiqueta" in valor &&
    typeof valor.etiqueta === "string" &&
    "valor_enmascarado" in valor &&
    esTextoONulo(valor.valor_enmascarado) &&
    "estado" in valor &&
    typeof valor.estado === "string" &&
    ESTADOS_DE_CAMPO.has(valor.estado) &&
    "nota" in valor &&
    esTextoONulo(valor.nota)
  );
}

function esVistaPrevia(valor: unknown): valor is VistaPreviaUi {
  if (!esObjeto(valor) || !("tipo" in valor)) return false;
  if (valor.tipo === TIPO_VISTA_PREVIA.TEXTO) return "texto" in valor && typeof valor.texto === "string";
  return (
    valor.tipo === TIPO_VISTA_PREVIA.TABLA &&
    "filas" in valor &&
    Array.isArray(valor.filas) &&
    valor.filas.every(esFilaVistaPrevia)
  );
}

export async function obtenerVistaPrevia(
  caso: string,
  nombre: string,
  signal: AbortSignal | null = null,
): Promise<ResultadoApi<VistaPreviaUi>> {
  const respuesta = await pedir(rutaDeVistaPrevia(caso, nombre), { signal });
  if (respuesta === null) return SIN_RED;
  if (!respuesta.ok) return resultadoDelRechazo(respuesta);
  const valor = await leerJson(respuesta);
  return esVistaPrevia(valor) ? { tipo: RESULTADO_API.OK, valor } : SIN_RED;
}
