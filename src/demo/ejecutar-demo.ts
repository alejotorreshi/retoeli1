import { rm, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { FECHA_DEMO, OUT_DIR, SESION_DEMO } from "../config/constantes.ts";
import { leer_solicitud } from "../tools/proveedor.ts";

export type OpcionesDemo = {
  readonly directorio: string;
  escribir(linea: string): void;
};

export type ResultadoDemo = {
  readonly casos: readonly string[];
  readonly fallidos: readonly string[];
  readonly hayFallos: boolean;
};

type Registro = Readonly<Record<string, unknown>>;

type LineaCaso = { readonly ok: boolean; readonly texto: string };

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

function cantidadDe(registro: Registro, clave: string): number {
  const valor = registro[clave];
  return Array.isArray(valor) ? valor.length : 0;
}

async function raizDelProyecto(directorio: string): Promise<string> {
  const raiz = resolve(directorio);
  const paquete = await stat(join(raiz, "package.json")).catch(() => null);
  if (paquete === null || !paquete.isFile()) {
    throw new Error("La demo debe correr en la raíz del proyecto, donde está package.json.");
  }
  return raiz;
}

function salidaLimpiable(raiz: string): string {
  const salida = resolve(raiz, OUT_DIR);
  const relativa = relative(raiz, salida);
  if (relativa !== OUT_DIR || isAbsolute(relativa)) {
    throw new Error("La carpeta de salida no está directamente dentro del proyecto; no se limpia.");
  }
  return salida;
}

function casosDisponibles(listado: Registro): readonly string[] | null {
  if (listado.codigo !== "CASO_NO_ENCONTRADO" || !esRegistro(listado.parcial)) return null;
  const casos = listado.parcial.casos_disponibles;
  if (!Array.isArray(casos)) return null;
  return casos.filter((caso): caso is string => typeof caso === "string");
}

function describirCaso(caso: string, respuesta: Registro): LineaCaso {
  if (respuesta.ok !== true || !esRegistro(respuesta.data)) {
    return {
      ok: false,
      texto: `${caso}: ERROR ${textoDe(respuesta, "codigo")}: ${textoDe(respuesta, "error")}`,
    };
  }
  const datos = respuesta.data;
  const conteos = `${cantidadDe(datos, "campos")} campos, ${cantidadDe(datos, "soportes")} soportes exigidos`;
  return {
    ok: true,
    texto: `${caso}: formato ${textoDe(datos, "formato")}, país ${textoDe(datos, "pais")}, ${conteos}`,
  };
}

export async function ejecutarDemo(opciones: OpcionesDemo): Promise<ResultadoDemo> {
  const raiz = await raizDelProyecto(opciones.directorio);
  await rm(salidaLimpiable(raiz), { recursive: true, force: true });
  process.env.FECHA_EJECUCION = FECHA_DEMO;
  opciones.escribir(`Fecha de ejecución efectiva: ${FECHA_DEMO}`);

  const ctx = { directory: raiz, sessionId: SESION_DEMO };
  const listado = leerRespuesta(await leer_solicitud.execute({ caso: "" }, ctx));
  const casos = casosDisponibles(listado);
  if (casos === null || casos.length === 0) {
    opciones.escribir(`No se pudieron listar los casos: ${textoDe(listado, "error")}`);
    return { casos: [], fallidos: [], hayFallos: true };
  }

  const fallidos: string[] = [];
  for (const caso of casos) {
    const linea = describirCaso(caso, leerRespuesta(await leer_solicitud.execute({ caso }, ctx)));
    opciones.escribir(linea.texto);
    if (!linea.ok) fallidos.push(caso);
  }
  return { casos, fallidos, hayFallos: fallidos.length > 0 };
}
