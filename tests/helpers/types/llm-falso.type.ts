import type { AdaptadorLlm, ErrorLlm, Mensaje, RespuestaLlm } from "@/llm/types/llm.type.ts";

export type PasoLlmFalso = RespuestaLlm | ErrorLlm | ((mensajes: readonly Mensaje[]) => RespuestaLlm);

export type PedidoLlmFalso = {
  readonly mensajes: readonly Mensaje[];
  readonly herramientasDesactivadas: boolean;
};

export type LlmFalso = AdaptadorLlm & { readonly pedidos: PedidoLlmFalso[] };
