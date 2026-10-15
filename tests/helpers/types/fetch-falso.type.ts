import type { FetchLike } from "@/llm/types/provider.type.ts";

export type RespuestaGuion = {
  readonly estado?: number;
  readonly cuerpo: unknown;
  readonly demora?: () => Promise<void>;
  readonly colgar?: boolean;
};

export type MensajeWire = {
  readonly role: string;
  readonly content: string;
  readonly tool_call_id?: string;
  readonly tool_calls?: readonly {
    readonly id: string;
    readonly function?: { readonly name: string; readonly arguments: string };
  }[];
};

export type CuerpoPedido = {
  readonly model: string;
  readonly thinking?: { readonly type: string };
  readonly temperature?: number;
  readonly max_tokens?: number;
  readonly stream: boolean;
  readonly tool_choice?: string;
  readonly tools?: readonly {
    readonly function: { readonly name: string; readonly parameters: { readonly required?: string[] } };
  }[];
  readonly messages: readonly MensajeWire[];
};

export type PedidoRegistrado = {
  readonly url: string;
  readonly cabeceras: Readonly<Record<string, string>>;
  readonly texto: string;
  readonly cuerpo: CuerpoPedido;
};

export type FetchFalso = {
  readonly fetch: FetchLike;
  readonly pedidos: PedidoRegistrado[];
};

export type LlamadaFalsa = {
  readonly nombre: string;
  readonly argumentos: unknown;
  readonly id?: string;
};

export type Diferido = {
  readonly promesa: Promise<void>;
  soltar(): void;
};
