import { describe, expect, test } from "bun:test";
import { SEPARADOR_TOKEN, VERSION_TOKEN_ACCESO } from "@/config/constants/http.constants.ts";
import { isAccessTokenValid, issueAccessToken } from "@/http/services/access-token.service.ts";

const AHORA = 1_790_000_000_000;
const VIGENCIA = 43_200_000;

function token(...partes: string[]): string {
  return partes.join(SEPARADOR_TOKEN);
}

describe("issueAccessToken", () => {
  test("emite la versión y el vencimiento en milisegundos enteros, sin otro dato", () => {
    expect(issueAccessToken(AHORA, VIGENCIA)).toBe(token(VERSION_TOKEN_ACCESO, String(AHORA + VIGENCIA)));
  });
});

describe("isAccessTokenValid", () => {
  test("acepta un token emitido mientras no vence", () => {
    expect(isAccessTokenValid(issueAccessToken(AHORA, VIGENCIA), AHORA)).toBe(true);
    expect(isAccessTokenValid(issueAccessToken(AHORA, VIGENCIA), AHORA + VIGENCIA - 1)).toBe(true);
  });

  test("rechaza un vencimiento igual a ahora", () => {
    expect(isAccessTokenValid(token(VERSION_TOKEN_ACCESO, String(AHORA)), AHORA)).toBe(false);
  });

  test("rechaza un vencimiento pasado", () => {
    expect(isAccessTokenValid(token(VERSION_TOKEN_ACCESO, String(AHORA - 1)), AHORA)).toBe(false);
  });

  test("rechaza otra versión aunque el vencimiento sea futuro", () => {
    expect(isAccessTokenValid(token("v2", String(AHORA + VIGENCIA)), AHORA)).toBe(false);
    expect(isAccessTokenValid(token("", String(AHORA + VIGENCIA)), AHORA)).toBe(false);
  });

  test("rechaza un vencimiento futuro que no es un entero de milisegundos", () => {
    expect(isAccessTokenValid(token(VERSION_TOKEN_ACCESO, "1e20"), AHORA)).toBe(false);
    expect(isAccessTokenValid(token(VERSION_TOKEN_ACCESO, "Infinity"), AHORA)).toBe(false);
    expect(isAccessTokenValid(token(VERSION_TOKEN_ACCESO, `0${AHORA + VIGENCIA}`), AHORA)).toBe(false);
    expect(isAccessTokenValid(token(VERSION_TOKEN_ACCESO, ` ${AHORA + VIGENCIA}`), AHORA)).toBe(false);
    expect(isAccessTokenValid(token(VERSION_TOKEN_ACCESO, "0x7fffffffffff"), AHORA)).toBe(false);
  });

  test("rechaza un vencimiento con decimales o partes de más", () => {
    expect(isAccessTokenValid(token(VERSION_TOKEN_ACCESO, String(AHORA + VIGENCIA), "5"), AHORA)).toBe(false);
    expect(isAccessTokenValid(token(VERSION_TOKEN_ACCESO, String(AHORA + VIGENCIA), "x"), AHORA)).toBe(false);
  });

  test("rechaza un token sin vencimiento o vacío", () => {
    expect(isAccessTokenValid(VERSION_TOKEN_ACCESO, AHORA)).toBe(false);
    expect(isAccessTokenValid(token(VERSION_TOKEN_ACCESO, ""), AHORA)).toBe(false);
    expect(isAccessTokenValid("", AHORA)).toBe(false);
  });
});
