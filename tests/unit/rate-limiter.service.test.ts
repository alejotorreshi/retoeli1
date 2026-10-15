import { describe, expect, test } from "bun:test";
import { MAX_CLAVES_LIMITADOR } from "@/config/constants/http.constants.ts";
import { createRateLimiter } from "@/http/services/rate-limiter.service.ts";
import type { ObservableRateLimiter } from "@/http/types/server.type.ts";

const LIMITE = 5;
const VENTANA_MS = 900_000;
const LIMITE_CORTO = 2;
const VENTANA_HORA_MS = 3_600_000;
const CLAVE = "198.51.100.7";
const OTRA_CLAVE = "203.0.113.9";
const TERCERA_CLAVE = "192.0.2.33";

type Banco = {
  readonly limitador: ObservableRateLimiter;
  avanzar(ms: number): void;
};

function crearBanco(
  maxClaves: number = MAX_CLAVES_LIMITADOR,
  limite: number = LIMITE,
  ventanaMs: number = VENTANA_MS,
): Banco {
  let ahora = 1_790_000_000_000;
  const limitador = createRateLimiter({
    limit: limite,
    windowMs: ventanaMs,
    maxKeys: maxClaves,
    now: () => ahora,
  });
  return {
    limitador,
    avanzar: (ms) => {
      ahora += ms;
    },
  };
}

function crearBancoDeHora(): Banco {
  return crearBanco(MAX_CLAVES_LIMITADOR, LIMITE_CORTO, VENTANA_HORA_MS);
}

function golpear(limitador: ObservableRateLimiter, clave: string, veces: number): boolean[] {
  return Array.from({ length: veces }, () => limitador.hit(clave));
}

describe("createRateLimiter", () => {
  test("permite cinco golpes de una clave y rechaza el sexto dentro de la ventana", () => {
    const { limitador } = crearBanco();
    expect(golpear(limitador, CLAVE, LIMITE)).toEqual(Array(LIMITE).fill(true));
    expect(limitador.hit(CLAVE)).toBe(false);
  });

  test("isLocked consulta sin contar: con cuatro golpes no bloquea y con cinco sí", () => {
    const { limitador } = crearBanco();
    golpear(limitador, CLAVE, LIMITE - 1);
    for (let consulta = 0; consulta < LIMITE; consulta += 1) expect(limitador.isLocked(CLAVE)).toBe(false);
    limitador.hit(CLAVE);
    expect(limitador.isLocked(CLAVE)).toBe(true);
  });

  test("las claves son independientes", () => {
    const { limitador } = crearBanco();
    golpear(limitador, CLAVE, LIMITE + 1);
    expect(limitador.isLocked(CLAVE)).toBe(true);
    expect(limitador.isLocked(OTRA_CLAVE)).toBe(false);
    expect(limitador.hit(OTRA_CLAVE)).toBe(true);
  });

  test("al vencer la ventana la clave vuelve a pasar, y 1 ms antes sigue bloqueada", () => {
    const { limitador, avanzar } = crearBanco();
    golpear(limitador, CLAVE, LIMITE);
    avanzar(VENTANA_MS - 1);
    expect(limitador.isLocked(CLAVE)).toBe(true);
    expect(limitador.hit(CLAVE)).toBe(false);
    avanzar(1);
    expect(limitador.isLocked(CLAVE)).toBe(false);
    expect(limitador.hit(CLAVE)).toBe(true);
  });

  test("la ventana es fija: los golpes tardíos no la estiran", () => {
    const { limitador, avanzar } = crearBanco();
    limitador.hit(CLAVE);
    avanzar(VENTANA_MS - 1);
    golpear(limitador, CLAVE, LIMITE - 1);
    expect(limitador.isLocked(CLAVE)).toBe(true);
    avanzar(1);
    expect(golpear(limitador, CLAVE, LIMITE)).toEqual(Array(LIMITE).fill(true));
  });

  test("cada llamada barre las ventanas vencidas de todas las claves", () => {
    const { limitador, avanzar } = crearBanco();
    limitador.hit(CLAVE);
    limitador.hit(OTRA_CLAVE);
    expect(limitador.trackedKeys()).toBe(2);
    avanzar(VENTANA_MS);
    limitador.hit(TERCERA_CLAVE);
    expect(limitador.trackedKeys()).toBe(1);
    avanzar(VENTANA_MS);
    limitador.isLocked(TERCERA_CLAVE);
    expect(limitador.trackedKeys()).toBe(0);
  });

  test("el barrido corta en la primera ventana vigente y sigue borrando las vencidas más antiguas", () => {
    const { limitador, avanzar } = crearBanco();
    limitador.hit(CLAVE);
    avanzar(VENTANA_MS / 2);
    limitador.hit(OTRA_CLAVE);
    avanzar(VENTANA_MS / 2);
    limitador.isLocked(TERCERA_CLAVE);
    expect(limitador.trackedKeys()).toBe(1);
    expect(limitador.isLocked(OTRA_CLAVE)).toBe(false);
  });

  test("con el tope de claves lleno, una clave nueva desaloja la más antigua y no crece la memoria", () => {
    const { limitador, avanzar } = crearBanco(2);
    golpear(limitador, CLAVE, LIMITE);
    avanzar(1);
    limitador.hit(OTRA_CLAVE);
    avanzar(1);
    limitador.hit(TERCERA_CLAVE);
    expect(limitador.trackedKeys()).toBe(2);
    expect(limitador.isLocked(CLAVE)).toBe(false);
    expect(limitador.hit(OTRA_CLAVE)).toBe(true);
  });
});

describe("retryAfterMs", () => {
  test("es 0 para una clave sin golpes y para una clave que todavía no llegó al tope", () => {
    const { limitador } = crearBancoDeHora();
    expect(limitador.retryAfterMs(CLAVE)).toBe(0);
    limitador.hit(CLAVE);
    expect(limitador.retryAfterMs(CLAVE)).toBe(0);
  });

  test("con la clave bloqueada da lo que falta para que venza su ventana, hasta 1 ms antes", () => {
    const { limitador, avanzar } = crearBancoDeHora();
    golpear(limitador, CLAVE, LIMITE_CORTO);
    expect(limitador.retryAfterMs(CLAVE)).toBe(VENTANA_HORA_MS);
    avanzar(VENTANA_HORA_MS - 1);
    expect(limitador.retryAfterMs(CLAVE)).toBe(1);
  });

  test("al vencer la ventana vuelve a 0 y no afecta a otras claves", () => {
    const { limitador, avanzar } = crearBancoDeHora();
    golpear(limitador, CLAVE, LIMITE_CORTO);
    expect(limitador.retryAfterMs(OTRA_CLAVE)).toBe(0);
    avanzar(VENTANA_HORA_MS);
    expect(limitador.retryAfterMs(CLAVE)).toBe(0);
  });
});
