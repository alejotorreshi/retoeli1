import { ESTADOS_LLM_SIN_ENVIO } from "@web/config/constants/ui.constants.ts";
import type { EstadoModelo } from "@web/types/chat.type.ts";

export function envioEnPausa(llm: EstadoModelo | null): boolean {
  return llm !== null && ESTADOS_LLM_SIN_ENVIO.has(llm);
}
