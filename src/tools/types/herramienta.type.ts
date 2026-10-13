import type { z } from "zod";
import type { Entorno } from "@/application/types/puertos.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";

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
