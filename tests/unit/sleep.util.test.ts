import { describe, expect, spyOn, test } from "bun:test";
import { sleepWithSignal } from "@/infra/clock/sleep.util.ts";

const ESPERA_CORTA_MS = 20;
const ESPERA_LARGA_MS = 10_000;
const HOLGURA_MS = 5;
const MAXIMO_TRAS_ABORTAR_MS = 1_000;

describe("sleepWithSignal espera sin rechazar nunca", () => {
  test("resuelve después de la espera", async () => {
    const inicio = performance.now();
    await sleepWithSignal(ESPERA_CORTA_MS, new AbortController().signal);
    expect(performance.now() - inicio).toBeGreaterThanOrEqual(ESPERA_CORTA_MS - HOLGURA_MS);
  });

  test("resuelve antes de tiempo cuando la señal se aborta", async () => {
    const controlador = new AbortController();
    const inicio = performance.now();
    const espera = sleepWithSignal(ESPERA_LARGA_MS, controlador.signal);
    setTimeout(() => controlador.abort(), HOLGURA_MS);
    await espera;
    expect(performance.now() - inicio).toBeLessThan(MAXIMO_TRAS_ABORTAR_MS);
  });

  test("con la señal ya abortada resuelve enseguida", async () => {
    const controlador = new AbortController();
    controlador.abort();
    const inicio = performance.now();
    await sleepWithSignal(ESPERA_LARGA_MS, controlador.signal);
    expect(performance.now() - inicio).toBeLessThan(MAXIMO_TRAS_ABORTAR_MS);
  });

  test("no rechaza aunque la señal se aborte con un motivo", async () => {
    const controlador = new AbortController();
    const espera = sleepWithSignal(ESPERA_LARGA_MS, controlador.signal);
    controlador.abort(new Error("motivo del aborto"));
    expect(await espera).toBeUndefined();
  });

  test("quita su oyente de la señal al terminar por tiempo", async () => {
    const controlador = new AbortController();
    const quitar = spyOn(controlador.signal, "removeEventListener");
    await sleepWithSignal(1, controlador.signal);
    expect(quitar).toHaveBeenCalledTimes(1);
  });
});
