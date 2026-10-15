import {
  BASE_HEXADECIMAL,
  COMPRESION_IPV6,
  GRUPO_IPV6_CERO,
  GRUPOS_IPV6,
  GRUPOS_PREFIJO_IPV6,
  IP_DESCONOCIDA,
  PREFIJO_IPV4_MAPEADA,
  SEPARADOR_IPV6,
  SEPARADOR_X_FORWARDED_FOR,
  SUFIJO_PREFIJO_IPV6,
} from "@/config/constants/http.constants.ts";
import { PATRON_GRUPO_IPV6, PATRON_IPV4 } from "@/config/constants/patterns.constants.ts";
import type { ClientIpInput } from "@/http/types/server.type.ts";

export function forwardedEntries(forwardedFor: string | undefined): string[] {
  if (forwardedFor === undefined) return [];
  return forwardedFor
    .split(SEPARADOR_X_FORWARDED_FOR)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
}

function groupsOf(part: string | undefined): string[] {
  return part === undefined || part === "" ? [] : part.split(SEPARADOR_IPV6);
}

function ipv6Groups(address: string): readonly string[] | null {
  const halves = address.split(COMPRESION_IPV6);
  if (halves.length > 2) return null;
  const [head, tail] = halves;
  const left = groupsOf(head);
  const right = groupsOf(tail);
  const missing = GRUPOS_IPV6 - left.length - right.length;
  const fits = tail === undefined ? missing === 0 : missing >= 1;
  if (!fits) return null;
  const groups = [...left, ...Array<string>(Math.max(missing, 0)).fill(GRUPO_IPV6_CERO), ...right];
  return groups.every((group) => PATRON_GRUPO_IPV6.test(group)) ? groups : null;
}

function ipv6Prefix(groups: readonly string[]): string {
  const prefix = groups
    .slice(0, GRUPOS_PREFIJO_IPV6)
    .map((group) => Number.parseInt(group, BASE_HEXADECIMAL).toString(BASE_HEXADECIMAL));
  return `${prefix.join(SEPARADOR_IPV6)}${SUFIJO_PREFIJO_IPV6}`;
}

export function rateLimitKeyOf(address: string): string | null {
  const lower = address.toLowerCase();
  if (PATRON_IPV4.test(lower)) return lower;
  const mapped = lower.startsWith(PREFIJO_IPV4_MAPEADA) ? lower.slice(PREFIJO_IPV4_MAPEADA.length) : null;
  if (mapped !== null && PATRON_IPV4.test(mapped)) return mapped;
  const groups = ipv6Groups(lower);
  return groups === null ? null : ipv6Prefix(groups);
}

function keyOrRaw(address: string): string {
  return rateLimitKeyOf(address) ?? address;
}

export function clientIpFrom(input: ClientIpInput): string {
  const socket = keyOrRaw(input.socketAddress ?? IP_DESCONOCIDA);
  if (input.trustedHops === 0) return socket;
  const entries = forwardedEntries(input.forwardedFor);
  const chosen = entries[entries.length - input.trustedHops];
  return chosen === undefined ? socket : keyOrRaw(chosen);
}
