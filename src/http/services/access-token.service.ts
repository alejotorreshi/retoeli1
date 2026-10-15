import { SEPARADOR_TOKEN, VERSION_TOKEN_ACCESO } from "@/config/constants/http.constants.ts";

export function issueAccessToken(nowMs: number, ttlMs: number): string {
  return [VERSION_TOKEN_ACCESO, String(nowMs + ttlMs)].join(SEPARADOR_TOKEN);
}

export function isAccessTokenValid(value: string, nowMs: number): boolean {
  const [version, expiry] = value.split(SEPARADOR_TOKEN);
  return version === VERSION_TOKEN_ACCESO && Number(expiry) > nowMs;
}
