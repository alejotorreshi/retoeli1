import { z } from "zod";
import { CODIGO_AGENTE, ESQUEMA_PARAMETROS } from "@/config/constants/agent.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { MENSAJE_AGENTE } from "@/config/strings.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { CuerpoFallo } from "@/domain/types/respuesta-herramienta.type.ts";
import { parsearJson } from "@/domain/utils/json.util.ts";
import { cuerpoDeFallo } from "@/domain/utils/respuesta-herramienta.util.ts";
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

type ModuloHerramientas = Readonly<Record<ValorDe<typeof HERRAMIENTA>, Herramienta<z.ZodRawShape>>>;

const EXPORTADAS: ReadonlySet<string> = new Set(Object.values(HERRAMIENTA));

function esHerramienta(exportado: string): exportado is ValorDe<typeof HERRAMIENTA> {
  return EXPORTADAS.has(exportado);
}

function registrar(
  exportado: ValorDe<typeof HERRAMIENTA>,
  herramienta: Herramienta<z.ZodRawShape>,
): readonly [string, Registrada] {
  const nombre = NOMBRE_VISIBLE[exportado];
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

function jsonO(texto: string, alternativa: unknown): unknown {
  const json = parsearJson(texto);
  return json.ok ? json.valor : alternativa;
}

export function argumentosDeLlamada(argumentos: string): unknown {
  return jsonO(argumentos, argumentos);
}

export function resultadoDeContenido(contenido: string): ResultadoLlamada {
  const respuesta = jsonO(contenido, null);
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

export function resultadoDeFallo(cuerpo: CuerpoFallo): ResultadoLlamada {
  return {
    contenido: JSON.stringify(cuerpo),
    ok: false,
    codigo: cuerpo.codigo,
    resumen: cuerpo.resumen ?? null,
    respuesta: cuerpo,
  };
}

function herramientaDesconocida(): ResultadoLlamada {
  const codigo = CODIGO_AGENTE.HERRAMIENTA_DESCONOCIDA;
  return resultadoDeFallo(cuerpoDeFallo({ codigo, error: MENSAJE_AGENTE[codigo] }, null));
}

export function crearRegistroHerramientas(modulo: ModuloHerramientas): RegistroHerramientas {
  const porNombre = new Map(
    Object.entries(modulo).flatMap(([exportado, herramienta]) =>
      esHerramienta(exportado) ? [registrar(exportado, herramienta)] : [],
    ),
  );
  return {
    definiciones: [...porNombre.values()].map((registrada) => registrada.definicion),
    async ejecutar(llamada, ctx) {
      const registrada = porNombre.get(llamada.nombre);
      if (registrada === undefined) return herramientaDesconocida();
      return resultadoDeContenido(
        await registrada.herramienta.execute(argumentosDeLlamada(llamada.argumentos), ctx),
      );
    },
  };
}
