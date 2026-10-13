import { describe, expect, test } from "bun:test";
import { aTexto, normalizarEtiqueta } from "@/domain/utils/normalizar.util.ts";

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

describe("aTexto", () => {
  test("convierte números solo con String, sin formato regional ni exponente", () => {
    expect(aTexto(98000000000)).toBe("98000000000");
    expect(aTexto(480)).toBe("480");
    expect(aTexto(2025)).toBe("2025");
  });

  test("devuelve los textos tal cual, con sus ceros a la izquierda", () => {
    expect(aTexto("050021")).toBe("050021");
    expect(aTexto("+57 604 555 0100")).toBe("+57 604 555 0100");
  });
});
