import { describe, expect, test } from "bun:test";
import { montarApp } from "@tests/helpers/app-dom.helper.ts";
import { prepararDom } from "@tests/helpers/dom.helper.ts";
import {
  CASOS_DE_PRUEBA,
  crearRedWeb,
  eventoFin,
  eventoInicio,
  eventoTexto,
} from "@tests/helpers/red-web.helper.ts";
import type { GuionChat } from "@tests/helpers/types/red-web.type.ts";
import { PAIS } from "@web/config/constants/pais.constants.ts";
import { CLASE_GLOBAL, ORDEN_PESTANAS } from "@web/config/constants/ui.constants.ts";
import {
  TEXTO_ACCIONES,
  TEXTO_ESTADO_VACIO,
  TEXTO_NUEVA_SESION,
  TEXTO_PAIS,
  TEXTO_PESTANAS,
  TEXTO_TARJETA_CASO,
} from "@web/config/strings.ts";
import type { Pestana } from "@web/types/ui.type.ts";
import { METODO_POST, RUTA_API } from "@/config/constants/http.constants.ts";

const ANCHO_MOVIL = 375;
const SESION = "sesion-angosta";
const RESPUESTA = "Listo: el primer turno terminó.";

const turnoConRespuesta: GuionChat = { eventos: [eventoInicio(SESION), eventoTexto(RESPUESTA), eventoFin()] };

const dom = await prepararDom({ ancho: ANCHO_MOVIL });

function habilitado(elemento: HTMLElement): boolean {
  return !elemento.hasAttribute("disabled");
}

function vistaDe(pestana: HTMLElement): HTMLElement {
  const vista = document.getElementById(pestana.getAttribute("aria-controls") ?? "");
  if (vista === null) throw new Error("la pestaña no controla ninguna vista");
  return vista;
}

const NOMBRES_DE_TARJETAS = [
  TEXTO_TARJETA_CASO.etiqueta("Industrias Delta", TEXTO_PAIS[PAIS.CO], "co-industrias-delta"),
  TEXTO_TARJETA_CASO.etiqueta("Corp Andina", TEXTO_PAIS[PAIS.EC], "ec-corp-andina"),
  TEXTO_TARJETA_CASO.etiqueta("Agroexport Sula", TEXTO_PAIS[PAIS.HN], "hn-agroexport-sula"),
  TEXTO_TARJETA_CASO.etiqueta("Logistica Istmo", TEXTO_PAIS[PAIS.PA], "pa-logistica-istmo"),
];

describe("App en un teléfono de 375 px", () => {
  test("las cuatro tarjetas de caso se pintan con los mismos nombres accesibles", async () => {
    const red = crearRedWeb({ nativos: dom.nativos });
    const { pantalla } = await montarApp(dom, red);
    const casos = await pantalla.findByRole("region", { name: TEXTO_ESTADO_VACIO.casos });
    await dom.esperar(() =>
      expect(
        dom
          .dentroDe(casos)
          .getAllByRole("button")
          .map((tarjeta) => tarjeta.getAttribute("aria-label")),
      ).toEqual(NOMBRES_DE_TARJETAS),
    );
    expect(CASOS_DE_PRUEBA).toHaveLength(NOMBRES_DE_TARJETAS.length);
  });

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

  test("los chips compactos muestran la etiqueta corta, se anuncian con el nombre completo y mandan el mismo mensaje", async () => {
    const red = crearRedWeb({ nativos: dom.nativos, guiones: [turnoConRespuesta, turnoConRespuesta] });
    const { pantalla, usuario } = await montarApp(dom, red);
    const demo = await pantalla.findByRole("button", { name: TEXTO_ACCIONES.demo });
    await dom.esperar(() => expect(habilitado(demo)).toBe(true));
    await usuario.click(demo);
    expect(await pantalla.findByText(RESPUESTA)).toBeDefined();

    const compacto = await pantalla.findByRole("button", { name: TEXTO_ACCIONES.demo });
    await dom.esperar(() => expect(habilitado(compacto)).toBe(true));
    expect(compacto.textContent).toBe(TEXTO_ACCIONES.demoCorto);
    const todos = pantalla.getByRole("button", { name: TEXTO_ACCIONES.todos(CASOS_DE_PRUEBA.length) });
    expect(todos.textContent).toBe(TEXTO_ACCIONES.todosCorto(CASOS_DE_PRUEBA.length));

    await usuario.click(compacto);

    await dom.esperar(() => expect(red.pedidosA(RUTA_API.CHAT, METODO_POST)).toHaveLength(2));
    expect(red.pedidosA(RUTA_API.CHAT, METODO_POST).map((pedido) => pedido.cuerpo)).toEqual([
      { sessionId: null, message: TEXTO_ACCIONES.mensajeDemo },
      { sessionId: SESION, message: TEXTO_ACCIONES.mensajeDemo },
    ]);
  });

  test("Nueva sesión va solo con ícono, conserva su nombre accesible y abre el diálogo de confirmación", async () => {
    const red = crearRedWeb({ nativos: dom.nativos, guiones: [turnoConRespuesta] });
    const { pantalla, usuario } = await montarApp(dom, red);
    const demo = await pantalla.findByRole("button", { name: TEXTO_ACCIONES.demo });
    await dom.esperar(() => expect(habilitado(demo)).toBe(true));
    await usuario.click(demo);
    expect(await pantalla.findByText(RESPUESTA)).toBeDefined();

    const abrir = pantalla.getByRole("button", { name: TEXTO_NUEVA_SESION.abrir });
    await dom.esperar(() => expect(habilitado(abrir)).toBe(true));
    const icono = abrir.querySelector("svg");
    expect(icono?.getAttribute("aria-hidden")).toBe("true");
    const texto = dom.dentroDe(abrir).getByText(TEXTO_NUEVA_SESION.abrir);
    expect(texto).not.toBe(abrir);
    expect(texto.classList.contains(CLASE_GLOBAL.OCULTO)).toBe(true);

    await usuario.click(abrir);
    expect(await pantalla.findByRole("dialog", { name: TEXTO_NUEVA_SESION.titulo })).toBeDefined();
  });
});
