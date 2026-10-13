import { describe, expect, test } from "bun:test";
import { normalizarEtiqueta } from "@/domain/utils/normalizar.util.ts";

describe("normalizarEtiqueta", () => {
  test("quita tildes, mayúsculas y marcas finales", () => {
    expect(normalizarEtiqueta("RAZON SOCIAL:")).toBe("razon social");
    expect(normalizarEtiqueta("Teléfono *")).toBe("telefono");
    expect(normalizarEtiqueta("Razón social")).toBe("razon social");
  });

  test("colapsa espacios internos y recorta los extremos", () => {
    expect(normalizarEtiqueta("  Número   de cuenta ")).toBe("numero de cuenta");
    expect(normalizarEtiqueta("Correo\telectrónico\n")).toBe("correo electronico");
  });

  test("una etiqueta escrita en NFD normaliza igual que en NFC", () => {
    const nfc = "Razón social".normalize("NFC");
    const nfd = "Razón social".normalize("NFD");
    expect(nfd).not.toBe(nfc);
    expect(normalizarEtiqueta(nfd)).toBe(normalizarEtiqueta(nfc));
  });

  test("conserva la ñ como n sin tilde y no toca otros signos internos", () => {
    expect(normalizarEtiqueta("Año / Período")).toBe("ano / periodo");
  });
});
