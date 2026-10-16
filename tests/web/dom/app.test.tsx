import { describe, expect, test } from "bun:test";
import { montarApp } from "@tests/helpers/app-dom.helper.ts";
import { prepararDom } from "@tests/helpers/dom.helper.ts";
import { crearRedWeb, eventoFin, eventoInicio, eventoTexto } from "@tests/helpers/red-web.helper.ts";
import { CLAVE_SESION_LOCAL } from "@web/config/constants/ui.constants.ts";
import { TEXTO_ACCIONES, TEXTO_CHAT } from "@web/config/strings.ts";
import { METODO_POST, RUTA_API } from "@/config/constants/http.constants.ts";

const ANCHO_ESCRITORIO = 1280;
const SESION = "sesion-de-la-app";
const RESPUESTA = "Listo: ec-corp-andina quedó mapeado y faltan dos soportes.";

const dom = await prepararDom({ ancho: ANCHO_ESCRITORIO });

describe("App en escritorio, con la red simulada en fetch", () => {
  test("el chip de demo envía el pedido del PRD, muestra la respuesta y guarda la sesión", async () => {
    const red = crearRedWeb({
      nativos: dom.nativos,
      guiones: [{ eventos: [eventoInicio(SESION), eventoTexto(RESPUESTA), eventoFin()] }],
    });
    const { pantalla, usuario } = await montarApp(dom, red);

    expect(await pantalla.findByRole("heading", { name: TEXTO_CHAT.vacioTitulo })).toBeDefined();
    const demo = await pantalla.findByRole("button", { name: TEXTO_ACCIONES.demo });
    await dom.esperar(() => expect(demo.hasAttribute("disabled")).toBe(false));

    await usuario.click(demo);

    expect(await pantalla.findByText(RESPUESTA)).toBeDefined();
    const chats = red.pedidosA(RUTA_API.CHAT, METODO_POST);
    expect(chats.map((pedido) => pedido.cuerpo)).toEqual([
      { sessionId: null, message: TEXTO_ACCIONES.mensajeDemo },
    ]);
    await dom.esperar(() => {
      const chips = pantalla.getAllByRole("button", { name: TEXTO_ACCIONES.demo });
      expect(chips.every((chip) => !chip.hasAttribute("disabled"))).toBe(true);
    });
    expect(localStorage.getItem(CLAVE_SESION_LOCAL)).toBe(SESION);
  });
});
