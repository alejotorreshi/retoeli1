import { COMENTARIO_LATIDO } from "@/config/constants/http.constants.ts";
import { redactar } from "@/domain/policies/redaccion.policy.ts";
import type { SseEvent, SseFrame } from "@/http/types/api.type.ts";

export function toSseFrame(evento: SseEvent, secrets: readonly string[]): SseFrame {
  return { event: evento.tipo, data: JSON.stringify(redactar(evento, secrets)) };
}

export function heartbeatComment(): string {
  return `: ${COMENTARIO_LATIDO}\n\n`;
}

export function startHeartbeat(write: (comment: string) => Promise<unknown>, intervalMs: number): () => void {
  const timer = setInterval(() => {
    write(heartbeatComment()).catch(() => undefined);
  }, intervalMs);
  return () => clearInterval(timer);
}
