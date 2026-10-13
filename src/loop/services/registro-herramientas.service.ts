import { z } from "zod";
import { CODIGO_AGENTE, ESQUEMA_PARAMETROS } from "@/config/constants/agent.constants.ts";
import { PREFIJO_HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import { MENSAJE_AGENTE } from "@/config/strings.ts";
import type { DefinicionHerramienta } from "@/llm/types/llm.type.ts";
import { resultadoHerramientaSchema } from "@/loop/schemas/resultado-herramienta.schema.ts";
import type { RegistroHerramientas, ResultadoLlamada } from "@/loop/types/turno.type.ts";
import type { Herramienta } from "@/tools/types/herramienta.type.ts";

type Registrada = {
  readonly herramienta: Herramienta<z.ZodRawShape>;
  readonly definicion: DefinicionHerramienta;
};

function parametrosDe(args: z.ZodRawShape): Readonly<Record<string, unknown>> {
  const { $schema: _descartado, ...parametros } = z.toJSONSchema(z.object(args).strict(), ESQUEMA_PARAMETROS);
  return parametros;
}

function registrar(
  exportado: string,
  herramienta: Herramienta<z.ZodRawShape>,
): readonly [string, Registrada] {
  const nombre = `${PREFIJO_HERRAMIENTA}${exportado}`;
  return [
    nombre,
    {
      herramienta,
      definicion: {
        nombre,
        descripcion: herramienta.description,
        parametros: parametrosDe(herramienta.args),
      },
    },
  ];
}

export function argumentosDeLlamada(argumentos: string): unknown {
  try {
    return JSON.parse(argumentos);
  } catch {
    return argumentos;
  }
}

function jsonDe(contenido: string): unknown {
  try {
    return JSON.parse(contenido);
  } catch {
    return null;
  }
}

function resultadoDe(contenido: string): ResultadoLlamada {
  const respuesta = jsonDe(contenido);
  const resultado = resultadoHerramientaSchema.safeParse(respuesta);
  if (!resultado.success) return { contenido, ok: false, codigo: null, resumen: null, respuesta };
  return {
    contenido,
    ok: resultado.data.ok,
    codigo: resultado.data.codigo ?? null,
    resumen: resultado.data.resumen ?? null,
    respuesta,
  };
}

function herramientaDesconocida(): ResultadoLlamada {
  const respuesta = {
    ok: false,
    codigo: CODIGO_AGENTE.HERRAMIENTA_DESCONOCIDA,
    error: MENSAJE_AGENTE[CODIGO_AGENTE.HERRAMIENTA_DESCONOCIDA],
  };
  return {
    contenido: JSON.stringify(respuesta),
    ok: false,
    codigo: CODIGO_AGENTE.HERRAMIENTA_DESCONOCIDA,
    resumen: null,
    respuesta,
  };
}

export function crearRegistroHerramientas(
  modulo: Readonly<Record<string, Herramienta<z.ZodRawShape>>>,
): RegistroHerramientas {
  const porNombre = new Map(
    Object.entries(modulo).map(([exportado, herramienta]) => registrar(exportado, herramienta)),
  );
  return {
    definiciones: [...porNombre.values()].map((registrada) => registrada.definicion),
    async ejecutar(llamada, ctx) {
      const registrada = porNombre.get(llamada.nombre);
      if (registrada === undefined) return herramientaDesconocida();
      return resultadoDe(await registrada.herramienta.execute(argumentosDeLlamada(llamada.argumentos), ctx));
    },
  };
}
