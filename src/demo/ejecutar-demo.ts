import { rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { FECHA_DEMO, GRUPOS_MAPEO, SESION_DEMO } from "@/config/constants/demo.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ARCHIVO_PROYECTO, OUT_DIR } from "@/config/constants/files.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { TEXTO_CHECKLIST, TEXTO_COMUN, TEXTO_DEMO } from "@/config/strings.ts";
import {
  armar_paquete,
  generar_formulario,
  leer_solicitud,
  mapear_campos,
  simular_envio,
} from "@/tools/proveedor.ts";

export type OpcionesDemo = {
  readonly directorio: string;
  escribir(linea: string): void;
  observar?(herramienta: string, respuesta: string): void;
};

export type ResultadoDemo = { readonly fallido: boolean };

type Registro = Readonly<Record<string, unknown>>;

type Exitosa = Registro & { readonly data: Registro };

type FilaResumen = {
  readonly caso: string;
  readonly formato: string;
  readonly llenos: string;
  readonly faltantes: string;
  readonly porConfirmar: string;
  readonly estado: string;
  readonly fallida: boolean;
};

type Contexto = { readonly directory: string; readonly sessionId: string };

type Sesion = {
  readonly ctx: Contexto;
  readonly invocar: (herramienta: string, ejecucion: Promise<string>) => Promise<Registro>;
  readonly escribir: (linea: string) => void;
};

function esRegistro(valor: unknown): valor is Registro {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function leerRespuesta(texto: string): Registro {
  const valor: unknown = JSON.parse(texto);
  return esRegistro(valor) ? valor : {};
}

function textoDe(registro: Registro, clave: string): string {
  const valor = registro[clave];
  return typeof valor === "string" ? valor : "?";
}

function numeroDe(registro: Registro, clave: string): string {
  const valor = registro[clave];
  return typeof valor === "number" ? String(valor) : "?";
}

function registroDe(registro: Registro, clave: string): Registro {
  const valor = registro[clave];
  return esRegistro(valor) ? valor : {};
}

function registrosDe(registro: Registro, clave: string): Registro[] {
  const valor = registro[clave];
  return Array.isArray(valor) ? valor.filter(esRegistro) : [];
}

function textosDe(registro: Registro, clave: string): string[] {
  const valor = registro[clave];
  return Array.isArray(valor) ? valor.filter((texto): texto is string => typeof texto === "string") : [];
}

function exitosa(respuesta: Registro): respuesta is Exitosa {
  return respuesta.ok === true && esRegistro(respuesta.data);
}

async function raizDelProyecto(directorio: string): Promise<string | null> {
  const raiz = resolve(directorio);
  const paquete = await stat(join(raiz, ARCHIVO_PROYECTO)).catch(() => null);
  return paquete?.isFile() === true ? raiz : null;
}

function casosDisponibles(listado: Registro): readonly string[] {
  if (listado.codigo !== CODIGO_ERROR.CASO_NO_ENCONTRADO) return [];
  return textosDe(registroDe(listado, "parcial"), "casos_disponibles").sort();
}

function proyectarMapeo(mapeo: Registro): Registro[] {
  return GRUPOS_MAPEO.flatMap((grupo) => registrosDe(mapeo, grupo)).map((item) => ({
    etiqueta: item.etiqueta,
    estado: item.estado,
    ruta: item.ruta,
  }));
}

function tiposConEstado(checklist: Registro, estado: string): string {
  const tipos = registrosDe(checklist, "soportes")
    .filter((soporte) => soporte.estado === estado)
    .map((soporte) => textoDe(soporte, "tipo"));
  return tipos.length > 0 ? tipos.join(TEXTO_DEMO.separadorTipos) : TEXTO_DEMO.ninguno;
}

function estadoPaquete(paquete: Registro): string {
  if (paquete.listo_para_firma === true) return TEXTO_CHECKLIST.estado.listo;
  return TEXTO_CHECKLIST.bloqueadoPor(textosDe(paquete, "bloqueos"));
}

function filaFallida(caso: string, respuesta: Registro): FilaResumen {
  return {
    caso,
    formato: TEXTO_COMUN.celdaVacia,
    llenos: TEXTO_COMUN.celdaVacia,
    faltantes: TEXTO_COMUN.celdaVacia,
    porConfirmar: TEXTO_COMUN.celdaVacia,
    estado: TEXTO_DEMO.estadoError(textoDe(respuesta, "codigo")),
    fallida: true,
  };
}

function fallar(sesion: Sesion, caso: string, respuesta: Registro): FilaResumen {
  sesion.escribir(TEXTO_DEMO.error(caso, textoDe(respuesta, "codigo"), textoDe(respuesta, "error")));
  return filaFallida(caso, respuesta);
}

function escribirFormulario(sesion: Sesion, formulario: Registro, conteo: Registro): void {
  const aviso = typeof formulario.aviso === "string" ? formulario.aviso : null;
  sesion.escribir(TEXTO_DEMO.formato(textoDe(formulario, "formato"), aviso));
  sesion.escribir(TEXTO_DEMO.salida(textoDe(formulario, "ruta")));
  sesion.escribir(
    TEXTO_DEMO.campos(
      numeroDe(conteo, ESTADO_CAMPO.LLENO),
      numeroDe(conteo, ESTADO_CAMPO.FALTANTE),
      numeroDe(conteo, ESTADO_CAMPO.REQUIERE_CONFIRMACION),
    ),
  );
}

function escribirPaquete(sesion: Sesion, paquete: Registro): string {
  const checklist = registroDe(paquete, "checklist");
  sesion.escribir(
    TEXTO_DEMO.soportes(
      tiposConEstado(checklist, ESTADO_SOPORTE.AUSENTE),
      tiposConEstado(checklist, ESTADO_SOPORTE.VENCIDO),
    ),
  );
  sesion.escribir(TEXTO_DEMO.estado(estadoPaquete(paquete)));
  return paquete.listo_para_firma === true ? TEXTO_CHECKLIST.estado.listo : TEXTO_CHECKLIST.estado.bloqueado;
}

async function procesarCaso(sesion: Sesion, caso: string): Promise<FilaResumen> {
  const { ctx, invocar } = sesion;
  sesion.escribir("");
  sesion.escribir(TEXTO_DEMO.encabezadoCaso(caso));
  const leida = await invocar(HERRAMIENTA.LEER_SOLICITUD, leer_solicitud.execute({ caso }, ctx));
  if (!exitosa(leida)) return fallar(sesion, caso, leida);
  const mapeada = await invocar(HERRAMIENTA.MAPEAR_CAMPOS, mapear_campos.execute({ caso, campos: [] }, ctx));
  if (!exitosa(mapeada)) return fallar(sesion, caso, mapeada);
  const mapeo = proyectarMapeo(mapeada.data);
  const generada = await invocar(
    HERRAMIENTA.GENERAR_FORMULARIO,
    generar_formulario.execute({ caso, mapeo }, ctx),
  );
  if (!exitosa(generada)) return fallar(sesion, caso, generada);
  const conteo = registroDe(mapeada.data, "conteo");
  escribirFormulario(sesion, generada.data, conteo);
  const armado = await invocar(HERRAMIENTA.ARMAR_PAQUETE, armar_paquete.execute({ caso }, ctx));
  if (!exitosa(armado)) return fallar(sesion, caso, armado);
  const estado = escribirPaquete(sesion, armado.data);
  const envio = await invocar(
    HERRAMIENTA.SIMULAR_ENVIO,
    simular_envio.execute({ caso, confirmado: false }, ctx),
  );
  if (envio.codigo !== CODIGO_ERROR.CONFIRMACION_REQUERIDA) return fallar(sesion, caso, envio);
  sesion.escribir(TEXTO_DEMO.envio(textoDe(envio, "error")));
  return {
    caso,
    formato: textoDe(generada.data, "formato"),
    llenos: numeroDe(conteo, ESTADO_CAMPO.LLENO),
    faltantes: numeroDe(conteo, ESTADO_CAMPO.FALTANTE),
    porConfirmar: numeroDe(conteo, ESTADO_CAMPO.REQUIERE_CONFIRMACION),
    estado,
    fallida: false,
  };
}

function filaMarkdown(celdas: readonly string[]): string {
  return `| ${celdas.join(" | ")} |`;
}

function escribirResumen(escribir: (linea: string) => void, filas: readonly FilaResumen[]): void {
  escribir("");
  escribir(TEXTO_DEMO.resumen);
  escribir(filaMarkdown(TEXTO_DEMO.columnasResumen));
  escribir(filaMarkdown(TEXTO_DEMO.columnasResumen.map(() => "---")));
  for (const fila of filas) {
    escribir(
      filaMarkdown([fila.caso, fila.formato, fila.llenos, fila.faltantes, fila.porConfirmar, fila.estado]),
    );
  }
}

function crearSesion(opciones: OpcionesDemo, ctx: Contexto): Sesion {
  return {
    ctx,
    escribir: (linea) => opciones.escribir(linea),
    invocar: async (herramienta, ejecucion) => {
      const respuesta = await ejecucion;
      opciones.observar?.(herramienta, respuesta);
      return leerRespuesta(respuesta);
    },
  };
}

async function correrCasos(opciones: OpcionesDemo, raiz: string): Promise<ResultadoDemo> {
  opciones.escribir(TEXTO_DEMO.fechaEfectiva(FECHA_DEMO));
  const sesion = crearSesion(opciones, { directory: raiz, sessionId: SESION_DEMO });
  const listado = await sesion.invocar(
    HERRAMIENTA.LEER_SOLICITUD,
    leer_solicitud.execute({ caso: "" }, sesion.ctx),
  );
  const casos = casosDisponibles(listado);
  if (casos.length === 0) {
    opciones.escribir(TEXTO_DEMO.sinCasos(textoDe(listado, "error")));
    return { fallido: true };
  }

  const filas: FilaResumen[] = [];
  for (const caso of casos) filas.push(await procesarCaso(sesion, caso));
  escribirResumen(sesion.escribir, filas);
  return { fallido: filas.some((fila) => fila.fallida) };
}

export async function ejecutarDemo(opciones: OpcionesDemo): Promise<ResultadoDemo> {
  const raiz = await raizDelProyecto(opciones.directorio);
  if (raiz === null) {
    opciones.escribir(TEXTO_DEMO.fueraDeLaRaiz);
    return { fallido: true };
  }
  await rm(join(raiz, OUT_DIR), { recursive: true, force: true });
  const restaurarFecha = pinExecutionDate(FECHA_DEMO);
  try {
    return await correrCasos(opciones, raiz);
  } finally {
    restaurarFecha();
  }
}
