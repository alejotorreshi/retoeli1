import { z } from "zod";
import type { Entorno, EntradaBitacora } from "@/application/puertos.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { PATRON_CASO, PATRON_SESION } from "@/config/constants/patterns.constants.ts";
import { PREFIJO_HERRAMIENTA, SESION_POR_DEFECTO } from "@/config/constants/tools.constants.ts";
import { exito, type Fallo, fallo, type Resultado } from "@/domain/resultado.ts";
import { formatearIssues } from "@/tools/issues.ts";
import { type ContextoNormalizado, crearEntorno, type OpcionesEntorno } from "@/tools/wiring.ts";

export type ContextoHerramienta = { directory: string; sessionId?: string; sessionID?: string };

export type Herramienta<A extends z.ZodRawShape> = {
  readonly description: string;
  readonly args: A;
  execute(args: unknown, ctx: ContextoHerramienta): Promise<string>;
};

export type EspecHerramienta<A extends z.ZodRawShape, D> = {
  readonly nombre: string;
  readonly description: string;
  readonly args: A;
  ejecutar(args: z.output<z.ZodObject<A>>, entorno: Entorno): Promise<Resultado<D>>;
  presentar(data: D): unknown;
  resumir(data: D): string;
};

type Desenlace<D> = {
  readonly resultado: Resultado<D>;
  readonly caso?: string;
  readonly casoResuelto?: string;
};

type Respuesta = { readonly texto: string; readonly resumen: string };

const mensajesEs = z.locales.es().localeError;

const sesionOpcional = z.string().regex(PATRON_SESION).optional().catch(undefined);

const esquemaContexto = z.object({
  directory: z.string().min(1),
  sessionId: sesionOpcional,
  sessionID: sesionOpcional,
});

function nombreDeError(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

function casoValidoDe(datos: unknown): string | undefined {
  if (typeof datos !== "object" || datos === null || !("caso" in datos)) return undefined;
  const { caso } = datos;
  return typeof caso === "string" && PATRON_CASO.test(caso) ? caso : undefined;
}

export function normalizarContexto(ctx: ContextoHerramienta): Resultado<ContextoNormalizado> {
  const parseado = esquemaContexto.safeParse(ctx, { error: mensajesEs });
  if (!parseado.success) {
    return fallo(CODIGO_ERROR.CONFIGURACION_INVALIDA, { detalle: formatearIssues(parseado.error.issues) });
  }
  const { directory, sessionId, sessionID } = parseado.data;
  return exito({ directorio: directory, sesion: sessionId ?? sessionID ?? SESION_POR_DEFECTO });
}

function serializarFallo(nombre: string, resultado: Fallo): string {
  const resumen = `${nombre}: ${resultado.codigo}`;
  const base = { ok: false, error: resultado.error, codigo: resultado.codigo };
  return JSON.stringify(
    resultado.parcial === undefined ? { ...base, resumen } : { ...base, parcial: resultado.parcial, resumen },
  );
}

export function defineTool<A extends z.ZodRawShape, D>(
  spec: EspecHerramienta<A, D>,
  opciones: OpcionesEntorno = {},
): Herramienta<A> {
  const esquema = z.object(spec.args).strict();
  const herramienta = `${PREFIJO_HERRAMIENTA}${spec.nombre}`;

  async function ejecutarProtegido(datos: z.output<z.ZodObject<A>>, entorno: Entorno): Promise<Resultado<D>> {
    try {
      return await spec.ejecutar(datos, entorno);
    } catch (error) {
      console.error(`${herramienta}: ${nombreDeError(error)}`);
      return fallo(CODIGO_ERROR.ERROR_INTERNO);
    }
  }

  async function resolverArgs(crudos: unknown, entorno: Entorno): Promise<Resultado<D>> {
    const parseado = esquema.safeParse(crudos, { error: mensajesEs });
    if (!parseado.success) {
      return fallo(CODIGO_ERROR.ARGS_INVALIDOS, { detalle: formatearIssues(parseado.error.issues) });
    }
    return ejecutarProtegido(parseado.data, entorno);
  }

  async function desenlazar(crudos: unknown, entorno: Entorno): Promise<Desenlace<D>> {
    const resultado = await resolverArgs(crudos, entorno);
    const caso = casoValidoDe(crudos);
    if (caso === undefined) return { resultado };
    const resolucion = await entorno.casos.resolver(caso);
    return resolucion.estado === "ok" ? { resultado, caso, casoResuelto: caso } : { resultado, caso };
  }

  function responder(resultado: Resultado<D>): Respuesta {
    if (!resultado.ok) {
      return {
        texto: serializarFallo(spec.nombre, resultado),
        resumen: `${spec.nombre}: ${resultado.codigo}`,
      };
    }
    const resumen = spec.resumir(resultado.data);
    return { texto: JSON.stringify({ ok: true, data: spec.presentar(resultado.data), resumen }), resumen };
  }

  function entradaBitacora(desenlace: Desenlace<D>, resumen: string, sesion: string): EntradaBitacora {
    const { resultado, caso, casoResuelto } = desenlace;
    return {
      herramienta,
      ok: resultado.ok,
      resumen,
      sesion,
      ...(caso === undefined ? {} : { caso }),
      ...(casoResuelto === undefined ? {} : { casoResuelto }),
      ...(resultado.ok ? {} : { codigo: resultado.codigo }),
    };
  }

  async function ejecutarYRegistrar(crudos: unknown, ctx: ContextoHerramienta): Promise<string> {
    const contexto = normalizarContexto(ctx);
    if (!contexto.ok) return serializarFallo(spec.nombre, contexto);
    const { entorno, registrar } = crearEntorno(contexto.data, opciones);
    const desenlace: Desenlace<D> = entorno.ok
      ? await desenlazar(crudos, entorno.data)
      : { resultado: entorno };
    const respuesta = responder(desenlace.resultado);
    await registrar(entradaBitacora(desenlace, respuesta.resumen, contexto.data.sesion));
    return respuesta.texto;
  }

  return {
    description: spec.description,
    args: spec.args,
    async execute(crudos, ctx) {
      try {
        return await ejecutarYRegistrar(crudos, ctx);
      } catch (error) {
        console.error(`${herramienta}: ${nombreDeError(error)}`);
        return serializarFallo(spec.nombre, fallo(CODIGO_ERROR.ERROR_INTERNO));
      }
    },
  };
}
