import type {
  CuerpoPedido,
  Diferido,
  FetchFalso,
  LlamadaFalsa,
  PedidoRegistrado,
  RespuestaGuion,
} from "@tests/helpers/types/fetch-falso.type.ts";
import { PRESET_DEEPSEEK } from "@/config/constants/llm.constants.ts";
import type { FetchLike } from "@/llm/types/provider.type.ts";

const USO_SPIKE = {
  prompt_tokens: 350,
  completion_tokens: 48,
  total_tokens: 398,
  prompt_tokens_details: { cached_tokens: 0 },
  prompt_cache_hit_tokens: 0,
  prompt_cache_miss_tokens: 350,
};

const CACHE_HIT_TEXTO = 256;

function textoDe(cuerpo: unknown): string {
  return typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo);
}

function cuerpoPedido(texto: string): CuerpoPedido {
  return JSON.parse(texto);
}

export function crearFetchFalso(respuestas: readonly RespuestaGuion[]): FetchFalso {
  const pedidos: PedidoRegistrado[] = [];
  let indice = 0;
  const fetch: FetchLike = async (url, init) => {
    const texto = String(init.body);
    pedidos.push({
      url,
      cabeceras: Object.fromEntries(new Headers(init.headers)),
      texto,
      cuerpo: cuerpoPedido(texto),
    });
    const respuesta = respuestas[indice];
    indice += 1;
    if (respuesta === undefined) throw new Error("guion agotado");
    if (respuesta.demora !== undefined) await respuesta.demora;
    return new Response(textoDe(respuesta.cuerpo), {
      status: respuesta.estado ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  return { fetch, pedidos };
}

export function cuerpoConHerramientas(...llamadas: readonly LlamadaFalsa[]): unknown {
  return {
    id: "redactado",
    object: "chat.completion",
    created: 0,
    model: PRESET_DEEPSEEK.model,
    choices: [
      {
        index: 0,
        finish_reason: "tool_calls",
        message: {
          role: "assistant",
          content: "",
          tool_calls: llamadas.map((llamada, posicion) => ({
            index: posicion,
            id: llamada.id ?? `call_00_${posicion}`,
            type: "function",
            function: { name: llamada.nombre, arguments: JSON.stringify(llamada.argumentos) },
          })),
        },
      },
    ],
    usage: USO_SPIKE,
    system_fingerprint: "redactado",
  };
}

export function cuerpoConTexto(texto: string): unknown {
  return {
    id: "redactado",
    object: "chat.completion",
    created: 0,
    model: PRESET_DEEPSEEK.model,
    choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: texto } }],
    usage: {
      ...USO_SPIKE,
      prompt_cache_hit_tokens: CACHE_HIT_TEXTO,
      prompt_tokens_details: { cached_tokens: CACHE_HIT_TEXTO },
    },
  };
}

export function diferido(): Diferido {
  const { promise, resolve } = Promise.withResolvers<void>();
  return { promesa: promise, soltar: () => resolve() };
}

export async function esperarPedidos(pedidos: readonly PedidoRegistrado[], cantidad: number): Promise<void> {
  for (let intento = 0; intento < 2_000 && pedidos.length < cantidad; intento += 1) await Bun.sleep(1);
  if (pedidos.length < cantidad) throw new Error("no llegaron los pedidos esperados");
}
