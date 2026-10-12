import { z } from "zod";
import type { Entorno } from "../application/puertos.ts";
import { SESION_POR_DEFECTO } from "../config/constantes.ts";
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

export function normalizarContexto(ctx: ContextoHerramienta): Resultado<ContextoNormalizado> {
  return exito({ directorio: ctx.directory, sesion: ctx.sessionId ?? SESION_POR_DEFECTO });
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
    if (!parseado.success) return serializarFallo(spec.nombre, fallo("ARGS_INVALIDOS"));
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
      } catch {
        return serializarFallo(spec.nombre, fallo("ERROR_INTERNO"));
      }
    },
  };
}
