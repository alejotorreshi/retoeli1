import type { AdaptadorLlm, OpcionesEnvio, ResultadoEnvio } from "@/llm/types/llm.type.ts";

export type PasoGuion = (opciones: OpcionesEnvio) => Promise<ResultadoEnvio>;

export type AdaptadorGuion = AdaptadorLlm & { readonly llamadas: OpcionesEnvio[] };
