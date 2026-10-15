import { IP_DESCONOCIDA, SEPARADOR_X_FORWARDED_FOR } from "@/config/constants/http.constants.ts";
import type { ClientIpInput } from "@/http/types/server.type.ts";

export function forwardedEntries(forwardedFor: string | undefined): string[] {
  if (forwardedFor === undefined) return [];
  return forwardedFor
    .split(SEPARADOR_X_FORWARDED_FOR)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
}

export function clientIpFrom(input: ClientIpInput): string {
  const socket = input.socketAddress ?? IP_DESCONOCIDA;
  if (input.trustedHops === 0) return socket;
  const entries = forwardedEntries(input.forwardedFor);
  return entries[entries.length - input.trustedHops] ?? socket;
}
