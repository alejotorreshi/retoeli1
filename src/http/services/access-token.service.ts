import {
  ALGORITMO_FIRMA_ACCESO,
  CODIFICACION_SECRETO_TOKEN,
  PARTES_TOKEN_ACCESO,
  SEPARADOR_TOKEN,
  VERSION_TOKEN_ACCESO,
} from "@/config/constants/http.constants.ts";

export function accessSigningKey(tokenSecret: string, code: string): string {
  return new Bun.CryptoHasher(ALGORITMO_FIRMA_ACCESO, tokenSecret)
    .update(code)
    .digest(CODIFICACION_SECRETO_TOKEN);
}

export function issueAccessToken(nowMs: number, ttlMs: number): string {
  return [VERSION_TOKEN_ACCESO, String(nowMs + ttlMs)].join(SEPARADOR_TOKEN);
}

function expiryMsOf(text: string): number | null {
  const expiryMs = Number(text);
  return Number.isSafeInteger(expiryMs) && String(expiryMs) === text ? expiryMs : null;
}

export function isAccessTokenValid(value: string, nowMs: number): boolean {
  const parts = value.split(SEPARADOR_TOKEN);
  const [version, expiry] = parts;
  if (parts.length !== PARTES_TOKEN_ACCESO || version !== VERSION_TOKEN_ACCESO || expiry === undefined)
    return false;
  const expiryMs = expiryMsOf(expiry);
  return expiryMs !== null && expiryMs > nowMs;
}
