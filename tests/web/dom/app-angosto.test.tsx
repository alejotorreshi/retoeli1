import { describe, expect, test } from "bun:test";
import { montarApp } from "@tests/helpers/app-dom.helper.ts";
import { prepararDom } from "@tests/helpers/dom.helper.ts";
import { crearRedWeb } from "@tests/helpers/red-web.helper.ts";
import { ORDEN_PESTANAS } from "@web/config/constants/ui.constants.ts";
import { TEXTO_PESTANAS } from "@web/config/strings.ts";
import type { Pestana } from "@web/types/ui.type.ts";

const ANCHO_MOVIL = 375;

const dom = await prepararDom({ ancho: ANCHO_MOVIL });

function vistaDe(pestana: HTMLElement): HTMLElement {
  const vista = document.getElementById(pestana.getAttribute("aria-controls") ?? "");
  if (vista === null) throw new Error("la pestaña no controla ninguna vista");
  return vista;
}

describe("App en un teléfono de 375 px", () => {
  test("las pestañas se recorren con flechas, Inicio y Fin, y solo se ve la vista elegida", async () => {
    const red = crearRedWeb({ nativos: dom.nativos });
    const { pantalla, usuario } = await montarApp(dom, red);
    expect(await pantalla.findByRole("tablist", { name: TEXTO_PESTANAS.grupo })).toBeDefined();
    const pestanas = ORDEN_PESTANAS.map((pestana: Pestana) =>
      pantalla.getByRole("tab", { name: TEXTO_PESTANAS.etiqueta(pestana) }),
    );
    expect(pantalla.getAllByRole("tab")).toHaveLength(ORDEN_PESTANAS.length);
    const primera = pestanas[0];
    const ultima = pestanas[pestanas.length - 1];
    const segunda = pestanas[1];
    if (primera === undefined || ultima === undefined || segunda === undefined)
      throw new Error("faltan pestañas");

    function comprobarElegida(elegida: HTMLElement): void {
      for (const pestana of pestanas) {
        const esLaElegida = pestana === elegida;
        expect(pestana.getAttribute("aria-selected")).toBe(String(esLaElegida));
        expect(vistaDe(pestana).hasAttribute("hidden")).toBe(!esLaElegida);
      }
      expect(document.activeElement).toBe(elegida);
    }

    await usuario.click(primera);
    comprobarElegida(primera);

    await usuario.keyboard("{ArrowRight}");
    comprobarElegida(segunda);

    await usuario.keyboard("{ArrowLeft}");
    comprobarElegida(primera);

    await usuario.keyboard("{End}");
    comprobarElegida(ultima);

    await usuario.keyboard("{Home}");
    comprobarElegida(primera);
  });
});
