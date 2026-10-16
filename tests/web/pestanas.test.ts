import { describe, expect, test } from "bun:test";
import { ORDEN_PESTANAS, PESTANA, TECLA_PESTANA } from "@web/config/constants/ui.constants.ts";
import { pestanaPorTecla } from "@web/features/disposicion/estado/pestanas.ts";

const PRIMERA = ORDEN_PESTANAS[0];
const ULTIMA = ORDEN_PESTANAS[ORDEN_PESTANAS.length - 1];

describe("pestanaPorTecla", () => {
  test("la flecha derecha pasa a la siguiente pestaña y da la vuelta al final", () => {
    expect(pestanaPorTecla(TECLA_PESTANA.SIGUIENTE, PESTANA.CHAT)).toBe(PESTANA.CASOS);
    expect(pestanaPorTecla(TECLA_PESTANA.SIGUIENTE, PESTANA.CASOS)).toBe(PESTANA.CHAT);
  });

  test("la flecha izquierda vuelve a la anterior y da la vuelta al principio", () => {
    expect(pestanaPorTecla(TECLA_PESTANA.ANTERIOR, PESTANA.CASOS)).toBe(PESTANA.CHAT);
    expect(pestanaPorTecla(TECLA_PESTANA.ANTERIOR, PESTANA.CHAT)).toBe(PESTANA.CASOS);
  });

  test("Inicio lleva a la primera pestaña y Fin a la última", () => {
    expect(pestanaPorTecla(TECLA_PESTANA.PRIMERA, PESTANA.CASOS)).toBe(PRIMERA);
    expect(pestanaPorTecla(TECLA_PESTANA.ULTIMA, PESTANA.CHAT)).toBe(ULTIMA);
  });

  test("cualquier otra tecla no cambia de pestaña", () => {
    expect(pestanaPorTecla("Enter", PESTANA.CHAT)).toBeNull();
    expect(pestanaPorTecla("a", PESTANA.CASOS)).toBeNull();
  });
});
