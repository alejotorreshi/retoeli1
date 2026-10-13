import { rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { FECHA_DEMO, GRUPOS_MAPEO, SESION_DEMO } from "@/config/constants/demo.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { OUT_DIR } from "@/config/constants/files.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
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

const SIN_DATO = "—";
const NINGUNO = "ninguno";
const COLUMNAS_RESUMEN = ["Caso", "Formato", "Llenos", "Faltantes", "Por confirmar", "Estado"] as const;

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
  const paquete = await stat(join(raiz, "package.json")).catch(() => null);
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
  return tipos.length > 0 ? tipos.join(", ") : NINGUNO;
}

function estadoPaquete(paquete: Registro): string {
  if (paquete.listo_para_firma === true) return "LISTO";
  return `BLOQUEADO (${textosDe(paquete, "bloqueos").join("; ")})`;
}

function filaFallida(caso: string, respuesta: Registro): FilaResumen {
  return {
    caso,
    formato: SIN_DATO,
    llenos: SIN_DATO,
    faltantes: SIN_DATO,
    porConfirmar: SIN_DATO,
    estado: `ERROR (${textoDe(respuesta, "codigo")})`,
    fallida: true,
  };
}

function fallar(sesion: Sesion, caso: string, respuesta: Registro): FilaResumen {
  sesion.escribir(`Error en ${caso} (${textoDe(respuesta, "codigo")}): ${textoDe(respuesta, "error")}`);
  return filaFallida(caso, respuesta);
}

function escribirFormulario(sesion: Sesion, formulario: Registro, conteo: Registro): void {
  const aviso = typeof formulario.aviso === "string" ? ` (${formulario.aviso})` : "";
  sesion.escribir(`Formato: ${textoDe(formulario, "formato")}${aviso}`);
  sesion.escribir(`Salida: ${textoDe(formulario, "ruta")}`);
  sesion.escribir(
    `Campos: ${numeroDe(conteo, ESTADO_CAMPO.LLENO)} llenos · ${numeroDe(conteo, ESTADO_CAMPO.FALTANTE)} faltantes · ${numeroDe(conteo, ESTADO_CAMPO.REQUIERE_CONFIRMACION)} por confirmar`,
  );
}

function escribirPaquete(sesion: Sesion, paquete: Registro): string {
  const checklist = registroDe(paquete, "checklist");
  sesion.escribir(
    `Soportes ausentes: ${tiposConEstado(checklist, "ausente")} · Vencidos: ${tiposConEstado(checklist, "vencido")}`,
  );
  sesion.escribir(`Estado: ${estadoPaquete(paquete)}`);
  return paquete.listo_para_firma === true ? "LISTO" : "BLOQUEADO";
}

async function procesarCaso(sesion: Sesion, caso: string): Promise<FilaResumen> {
  const { ctx, invocar } = sesion;
  sesion.escribir("");
  sesion.escribir(`== ${caso} ==`);
  const leida = await invocar("leer_solicitud", leer_solicitud.execute({ caso }, ctx));
  if (!exitosa(leida)) return fallar(sesion, caso, leida);
  const mapeada = await invocar("mapear_campos", mapear_campos.execute({ caso, campos: [] }, ctx));
  if (!exitosa(mapeada)) return fallar(sesion, caso, mapeada);
  const mapeo = proyectarMapeo(mapeada.data);
  const generada = await invocar("generar_formulario", generar_formulario.execute({ caso, mapeo }, ctx));
  if (!exitosa(generada)) return fallar(sesion, caso, generada);
  const conteo = registroDe(mapeada.data, "conteo");
  escribirFormulario(sesion, generada.data, conteo);
  const armado = await invocar("armar_paquete", armar_paquete.execute({ caso }, ctx));
  if (!exitosa(armado)) return fallar(sesion, caso, armado);
  const estado = escribirPaquete(sesion, armado.data);
  const envio = await invocar("simular_envio", simular_envio.execute({ caso, confirmado: false }, ctx));
  if (envio.codigo !== CODIGO_ERROR.CONFIRMACION_REQUERIDA) return fallar(sesion, caso, envio);
  sesion.escribir(`Envío: ${textoDe(envio, "error")} (no se envía nada)`);
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
  escribir("Resumen");
  escribir(filaMarkdown(COLUMNAS_RESUMEN));
  escribir(filaMarkdown(COLUMNAS_RESUMEN.map(() => "---")));
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
  opciones.escribir(`Fecha de ejecución efectiva: ${FECHA_DEMO}`);
  const sesion = crearSesion(opciones, { directory: raiz, sessionId: SESION_DEMO });
  const listado = await sesion.invocar("leer_solicitud", leer_solicitud.execute({ caso: "" }, sesion.ctx));
  const casos = casosDisponibles(listado);
  if (casos.length === 0) {
    opciones.escribir(`No se pudieron listar los casos: ${textoDe(listado, "error")}`);
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
    opciones.escribir(
      "La demo debe correr en la raíz del proyecto, donde está package.json; no se borra nada.",
    );
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
