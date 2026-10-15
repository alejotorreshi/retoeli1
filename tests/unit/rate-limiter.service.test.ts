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
});

describe("D-77: el tope de claves nunca libera una clave bloqueada", () => {
  const CLAVES_RASTREADAS = 3;
  const CLAVES_ROTADAS = 40;

  function claveRotada(indice: number): string {
    return `2001:db8:${indice.toString(16)}::`;
  }

  function contarEvaluados(limitador: ObservableRateLimiter, orden: readonly string[]): number {
    let evaluados = 0;
    for (const clave of orden) {
      if (limitador.isLocked(clave)) continue;
      limitador.hit(clave);
      evaluados += 1;
    }
    return evaluados;
  }

  const claves = Array.from({ length: CLAVES_ROTADAS }, (_, indice) => claveRotada(indice));

  test("con el tope lleno, la clave nueva desaloja la libre más antigua y la bloqueada sigue bloqueada", () => {
    const { limitador, avanzar } = crearBanco(2);
    golpear(limitador, CLAVE, LIMITE);
    avanzar(1);
    limitador.hit(OTRA_CLAVE);
    avanzar(1);
    expect(limitador.hit(TERCERA_CLAVE)).toBe(true);
    expect(limitador.trackedKeys()).toBe(2);
    expect(limitador.isLocked(CLAVE)).toBe(true);
    expect(limitador.retryAfterMs(CLAVE)).toBeGreaterThan(0);
    expect(limitador.isLocked(OTRA_CLAVE)).toBe(false);
    expect(limitador.isLocked(TERCERA_CLAVE)).toBe(false);
  });

  test("con una clave menos que el tope, la clave nueva entra sin desalojar", () => {
    const { limitador } = crearBanco(2);
    golpear(limitador, CLAVE, LIMITE);
    expect(limitador.hit(OTRA_CLAVE)).toBe(true);
    expect(limitador.trackedKeys()).toBe(2);
    expect(limitador.isLocked(CLAVE)).toBe(true);
  });

  test("con el tope lleno de claves bloqueadas, la clave nueva no entra y queda bloqueada (falla cerrado)", () => {
    const { limitador, avanzar } = crearBanco(2);
    golpear(limitador, CLAVE, LIMITE);
    avanzar(1);
    golpear(limitador, OTRA_CLAVE, LIMITE);
    avanzar(1);
    expect(limitador.hit(TERCERA_CLAVE)).toBe(false);
    expect(limitador.isLocked(TERCERA_CLAVE)).toBe(true);
    expect(limitador.trackedKeys()).toBe(2);
    expect(limitador.isLocked(CLAVE)).toBe(true);
    expect(limitador.isLocked(OTRA_CLAVE)).toBe(true);
    expect(limitador.retryAfterMs(TERCERA_CLAVE)).toBe(VENTANA_MS - 2);
    expect(limitador.retryAfterMs(TERCERA_CLAVE)).toBe(limitador.retryAfterMs(CLAVE));
  });

  test("saturado, 1 ms antes de que venza la ventana más antigua sigue bloqueada y al vencer entra", () => {
    const { limitador, avanzar } = crearBanco(2);
    golpear(limitador, CLAVE, LIMITE);
    avanzar(1);
    golpear(limitador, OTRA_CLAVE, LIMITE);
    avanzar(VENTANA_MS - 2);
    expect(limitador.isLocked(TERCERA_CLAVE)).toBe(true);
    expect(limitador.retryAfterMs(TERCERA_CLAVE)).toBe(1);
    expect(limitador.hit(TERCERA_CLAVE)).toBe(false);
    avanzar(1);
    expect(limitador.hit(TERCERA_CLAVE)).toBe(true);
    expect(limitador.isLocked(TERCERA_CLAVE)).toBe(false);
    expect(limitador.retryAfterMs(TERCERA_CLAVE)).toBe(0);
    expect(limitador.trackedKeys()).toBe(2);
    expect(limitador.isLocked(OTRA_CLAVE)).toBe(true);
  });

  test("rotar claves de a una con el flujo de /api/acceso deja K × L intentos evaluados", () => {
    const { limitador } = crearBanco(CLAVES_RASTREADAS);
    const orden = claves.flatMap((clave) => Array<string>(LIMITE + 1).fill(clave));
    expect(contarEvaluados(limitador, orden)).toBe(CLAVES_RASTREADAS * LIMITE);
    expect(limitador.trackedKeys()).toBe(CLAVES_RASTREADAS);
  });

  test("rotar claves en ronda con el flujo de /api/acceso queda acotado: los golpes desalojados no pasan de L por ventana", () => {
    const { limitador } = crearBanco(CLAVES_RASTREADAS);
    const orden = Array.from({ length: LIMITE + 1 }, () => claves).flat();
    expect(contarEvaluados(limitador, orden)).toBe((CLAVES_RASTREADAS + 1) * LIMITE);
    expect(limitador.trackedKeys()).toBe(CLAVES_RASTREADAS);
  });

  test("con los golpes desalojados en el tope, la clave nueva espera lo que falta para el primer desalojo o la ventana más antigua", () => {
    const { limitador, avanzar } = crearBanco(1);
    limitador.hit(claves[0] ?? CLAVE);
    for (let indice = 1; indice <= LIMITE; indice += 1) {
      avanzar(1);
      expect(limitador.hit(claves[indice] ?? CLAVE)).toBe(true);
    }
    avanzar(1);
    const nueva = claves[LIMITE + 1] ?? CLAVE;
    expect(limitador.hit(nueva)).toBe(false);
    expect(limitador.isLocked(nueva)).toBe(true);
    expect(limitador.retryAfterMs(nueva)).toBe(VENTANA_MS - LIMITE);
    avanzar(VENTANA_MS - LIMITE - 1);
    expect(limitador.isLocked(nueva)).toBe(true);
    avanzar(1);
    expect(limitador.isLocked(nueva)).toBe(false);
    expect(limitador.hit(nueva)).toBe(true);
    expect(limitador.trackedKeys()).toBe(1);
  });

  test("retryAfterMs de una clave nueva no es negativo ni mayor que la ventana", () => {
    const { limitador, avanzar } = crearBanco(2);
    golpear(limitador, CLAVE, LIMITE);
    golpear(limitador, OTRA_CLAVE, LIMITE);
    for (const paso of [0, VENTANA_MS / 2, VENTANA_MS / 2 - 1]) {
      avanzar(paso);
      const espera = limitador.retryAfterMs(TERCERA_CLAVE);
      expect(espera).toBeGreaterThanOrEqual(0);
      expect(espera).toBeLessThanOrEqual(VENTANA_MS);
    }
    avanzar(1);
    expect(limitador.retryAfterMs(TERCERA_CLAVE)).toBe(0);
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
