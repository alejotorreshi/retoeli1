import { describe, expect, test } from "bun:test";

const CODIGO_NATIVO = "[native code]";

describe("las pruebas del backend ven los globales nativos", () => {
  test("no hay document ni window registrados", () => {
    expect(Reflect.get(globalThis, "document")).toBeUndefined();
    expect(Reflect.get(globalThis, "window")).toBeUndefined();
  });

  test("fetch y Response son los nativos de Bun", () => {
    expect(String(fetch)).toContain(CODIGO_NATIVO);
    expect(String(Response)).toContain(CODIGO_NATIVO);
  });
});
