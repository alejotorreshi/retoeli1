import { z } from "zod";
import type { Entorno, EntradaBitacora } from "@/application/types/puertos.type.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ESTADO_LECTURA } from "@/config/constants/io.constants.ts";
import { MAX_ISSUES_ARGS } from "@/config/constants/limits.constants.ts";
import { PATRON_CASO, PATRON_SESION } from "@/config/constants/patterns.constants.ts";
import { PREFIJO_HERRAMIENTA, SESION_POR_DEFECTO } from "@/config/constants/tools.constants.ts";
import { RESUMEN_HERRAMIENTA } from "@/config/strings.ts";
import { formatearIssues } from "@/domain/formatear-issues.ts";
import { nombreDeError } from "@/domain/nombre-error.ts";
import { exito, fallo } from "@/domain/resultado.ts";
import type { Fallo, Resultado } from "@/domain/types/resultado.type.ts";
import { crearEntorno } from "@/tools/entorno.wiring.ts";
import type { ContextoNormalizado, OpcionesEntorno } from "@/tools/types/entorno.type.ts";
import type { ContextoHerramienta, EspecHerramienta, Herramienta } from "@/tools/types/herramienta.type.ts";

type ResultadoEjecucion<D> = {
  readonly resultado: Resultado<D>;
  readonly caso?: string;
  readonly casoResuelto?: string;
};

type Respuesta = { readonly texto: string; readonly resumen: string };

type HerramientaInterna<A extends z.ZodRawShape, D> = {
  readonly spec: EspecHerramienta<A, D>;
  readonly esquema: ReturnType<typeof esquemaDeArgs<A>>;
  readonly opciones: OpcionesEntorno;
  readonly nombreVisible: string;
};

const mensajesEs = z.locales.es().localeError;

const sesionOpcional = z.string().regex(PATRON_SESION).optional().catch(undefined);

const esquemaContexto = z.object({
  directory: z.string().min(1),
  sessionId: sesionOpcional,
  sessionID: sesionOpcional,
});

function casoValidoDe(datos: unknown): string | undefined {
  if (typeof datos !== "object" || datos === null || !("caso" in datos)) return undefined;
  const { caso } = datos;
  return typeof caso === "string" && PATRON_CASO.test(caso) ? caso : undefined;
}

export function normalizarContexto(ctx: ContextoHerramienta): Resultado<ContextoNormalizado> {
  const parseado = esquemaContexto.safeParse(ctx, { error: mensajesEs });
  if (!parseado.success) {
    return fallo(CODIGO_ERROR.CONFIGURACION_INVALIDA, {
      detalle: formatearIssues(parseado.error.issues, MAX_ISSUES_ARGS),
    });
  }
  const { directory, sessionId, sessionID } = parseado.data;
  return exito({ directorio: directory, sesion: sessionId ?? sessionID ?? SESION_POR_DEFECTO });
}

function esquemaDeArgs<A extends z.ZodRawShape>(args: A) {
  return z.object(args).strict();
}

function responderFallo(nombre: string, resultado: Fallo): Respuesta {
  const resumen = RESUMEN_HERRAMIENTA.fallo(nombre, resultado.codigo);
  const base = { ok: false, error: resultado.error, codigo: resultado.codigo };
  const cuerpo =
    resultado.parcial === undefined ? { ...base, resumen } : { ...base, parcial: resultado.parcial, resumen };
  return { texto: JSON.stringify(cuerpo), resumen };
}

function responder<A extends z.ZodRawShape, D>(
  spec: EspecHerramienta<A, D>,
  resultado: Resultado<D>,
): Respuesta {
  if (!resultado.ok) return responderFallo(spec.nombre, resultado);
  const resumen = spec.resumir(resultado.data);
  return { texto: JSON.stringify({ ok: true, data: spec.presentar(resultado.data), resumen }), resumen };
}

function registrarErrorInterno(nombreVisible: string, error: unknown): void {
  console.error(`${nombreVisible}: ${nombreDeError(error)}`);
}

async function ejecutarProtegido<A extends z.ZodRawShape, D>(
  interna: HerramientaInterna<A, D>,
  datos: z.output<z.ZodObject<A>>,
  entorno: Entorno,
): Promise<Resultado<D>> {
  try {
    return await interna.spec.ejecutar(datos, entorno);
  } catch (error) {
    registrarErrorInterno(interna.nombreVisible, error);
    return fallo(CODIGO_ERROR.ERROR_INTERNO);
  }
}

async function resolverArgs<A extends z.ZodRawShape, D>(
  interna: HerramientaInterna<A, D>,
  crudos: unknown,
  entorno: Entorno,
): Promise<Resultado<D>> {
  const parseado = interna.esquema.safeParse(crudos, { error: mensajesEs });
  if (!parseado.success) {
    return fallo(CODIGO_ERROR.ARGS_INVALIDOS, {
      detalle: formatearIssues(parseado.error.issues, MAX_ISSUES_ARGS),
    });
  }
  return ejecutarProtegido(interna, parseado.data, entorno);
}

async function ejecutarConCaso<A extends z.ZodRawShape, D>(
  interna: HerramientaInterna<A, D>,
  crudos: unknown,
  entorno: Entorno,
): Promise<ResultadoEjecucion<D>> {
  const resultado = await resolverArgs(interna, crudos, entorno);
  const caso = casoValidoDe(crudos);
  if (caso === undefined) return { resultado };
  const resolucion = await entorno.casos.resolver(caso);
  return resolucion.estado === ESTADO_LECTURA.OK
    ? { resultado, caso, casoResuelto: caso }
    : { resultado, caso };
}

function entradaBitacora<D>(
  nombreVisible: string,
  ejecucion: ResultadoEjecucion<D>,
  resumen: string,
  sesion: string,
): EntradaBitacora {
  const { resultado, caso, casoResuelto } = ejecucion;
  return {
    herramienta: nombreVisible,
    ok: resultado.ok,
    resumen,
    sesion,
    ...(caso === undefined ? {} : { caso }),
    ...(casoResuelto === undefined ? {} : { casoResuelto }),
    ...(resultado.ok ? {} : { codigo: resultado.codigo }),
  };
}

async function ejecutarYRegistrar<A extends z.ZodRawShape, D>(
  interna: HerramientaInterna<A, D>,
  crudos: unknown,
  ctx: ContextoHerramienta,
): Promise<string> {
  const contexto = normalizarContexto(ctx);
  if (!contexto.ok) return responderFallo(interna.spec.nombre, contexto).texto;
  const { entorno, registrar } = crearEntorno(contexto.data, interna.opciones);
  const ejecucion: ResultadoEjecucion<D> = entorno.ok
    ? await ejecutarConCaso(interna, crudos, entorno.data)
    : { resultado: entorno };
  const respuesta = responder(interna.spec, ejecucion.resultado);
  await registrar(entradaBitacora(interna.nombreVisible, ejecucion, respuesta.resumen, contexto.data.sesion));
  return respuesta.texto;
}

export function definirHerramienta<A extends z.ZodRawShape, D>(
  spec: EspecHerramienta<A, D>,
  opciones: OpcionesEntorno = {},
): Herramienta<A> {
  const interna: HerramientaInterna<A, D> = {
    spec,
    esquema: esquemaDeArgs(spec.args),
    opciones,
    nombreVisible: `${PREFIJO_HERRAMIENTA}${spec.nombre}`,
  };
  return {
    description: spec.description,
    args: spec.args,
    async execute(crudos, ctx) {
      try {
        return await ejecutarYRegistrar(interna, crudos, ctx);
      } catch (error) {
        registrarErrorInterno(interna.nombreVisible, error);
        return responderFallo(spec.nombre, fallo(CODIGO_ERROR.ERROR_INTERNO)).texto;
      }
    },
  };
}
