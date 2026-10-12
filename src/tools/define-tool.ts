import { z } from "zod";
import type { Entorno } from "../application/puertos.ts";
import { MAX_ISSUES_ARGS, PREFIJO_HERRAMIENTA, SESION_POR_DEFECTO } from "../config/constantes.ts";
import { exito, type Fallo, fallo, type Resultado } from "../domain/resultado.ts";
import { crearEntorno } from "./wiring.ts";

export type ContextoHerramienta = { directory: string; sessionId?: string; sessionID?: string };

export type ContextoNormalizado = { readonly directorio: string; readonly sesion: string };

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

const mensajesEs = z.locales.es().localeError;

const sesionOpcional = z.string().min(1).optional().catch(undefined);

const esquemaContexto = z.object({
  directory: z.string().min(1),
  sessionId: sesionOpcional,
  sessionID: sesionOpcional,
});

function formatearIssues(issues: readonly z.core.$ZodIssue[]): string {
  return issues
    .slice(0, MAX_ISSUES_ARGS)
    .map((issue) => {
      const ruta = issue.path.length === 0 ? "(raíz)" : issue.path.map(String).join(".");
      return `${ruta}: ${issue.message}`;
    })
    .join("; ");
}

function nombreDeError(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

export function normalizarContexto(ctx: ContextoHerramienta): Resultado<ContextoNormalizado> {
  const parseado = esquemaContexto.safeParse(ctx, { error: mensajesEs });
  if (!parseado.success) {
    return fallo("CONFIGURACION_INVALIDA", { detalle: formatearIssues(parseado.error.issues) });
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

export function defineTool<A extends z.ZodRawShape, D>(spec: EspecHerramienta<A, D>): Herramienta<A> {
  const esquema = z.object(spec.args).strict();

  async function ejecutarSinFirewall(crudos: unknown, ctx: ContextoHerramienta): Promise<string> {
    const contexto = normalizarContexto(ctx);
    if (!contexto.ok) return serializarFallo(spec.nombre, contexto);
    const entorno = crearEntorno(contexto.data);
    const parseado = esquema.safeParse(crudos, { error: mensajesEs });
    if (!parseado.success) {
      return serializarFallo(
        spec.nombre,
        fallo("ARGS_INVALIDOS", { detalle: formatearIssues(parseado.error.issues) }),
      );
    }
    const resultado = await spec.ejecutar(parseado.data, entorno);
    if (!resultado.ok) return serializarFallo(spec.nombre, resultado);
    return JSON.stringify({
      ok: true,
      data: spec.presentar(resultado.data),
      resumen: spec.resumir(resultado.data),
    });
  }

  return {
    description: spec.description,
    args: spec.args,
    async execute(crudos, ctx) {
      try {
        return await ejecutarSinFirewall(crudos, ctx);
      } catch (error) {
        console.error(`${PREFIJO_HERRAMIENTA}${spec.nombre}: ${nombreDeError(error)}`);
        return serializarFallo(spec.nombre, fallo("ERROR_INTERNO"));
      }
    },
  };
}
