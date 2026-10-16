import { describe, expect, test } from "bun:test";
import { montarApp } from "@tests/helpers/app-dom.helper.ts";
import { prepararDom } from "@tests/helpers/dom.helper.ts";
import { crearRedWeb, eventoFin, eventoInicio, eventoTexto } from "@tests/helpers/red-web.helper.ts";
import { TEXTO_CHAT, TEXTO_NUEVA_SESION } from "@web/config/strings.ts";
import { seleccionarDialogoAbierto, seleccionarEnCurso } from "@web/store/selectores.ts";

const ANCHO_ESCRITORIO = 1280;
const SESION = "sesion-del-almacen";
const PEDIDO = "Procesa el caso co-industrias-delta";
const RESPUESTA = "El almacén llevó este turno hasta la pantalla.";

const dom = await prepararDom({ ancho: ANCHO_ESCRITORIO });

describe("la App montada lee y escribe solo a través del almacén que recibe", () => {
  test("abrir Nueva sesión desde las acciones del almacén muestra el diálogo", async () => {
    const red = crearRedWeb({ nativos: dom.nativos });
    const { pantalla, instancia } = await montarApp(dom, red);
    await pantalla.findByRole("heading", { name: TEXTO_CHAT.vacioTitulo });

    dom.act(() => instancia.acciones.abrirNuevaSesion());

    expect(await pantalla.findByRole("dialog", { name: TEXTO_NUEVA_SESION.titulo })).toBeDefined();
  });

  test("Seguir en esta sesión cierra el diálogo también en el almacén", async () => {
    const red = crearRedWeb({ nativos: dom.nativos });
    const { pantalla, usuario, instancia } = await montarApp(dom, red);
    await usuario.click(await pantalla.findByRole("button", { name: TEXTO_NUEVA_SESION.abrir }));
    expect(seleccionarDialogoAbierto(instancia.almacen.leer())).toBe(true);

    await usuario.click(await pantalla.findByRole("button", { name: TEXTO_NUEVA_SESION.seguir }));

    expect(seleccionarDialogoAbierto(instancia.almacen.leer())).toBe(false);
  });

  test("un turno enviado por las acciones del almacén llega a la línea de tiempo", async () => {
    const turno = { eventos: [eventoInicio(SESION), eventoTexto(RESPUESTA), eventoFin()] };
    const red = crearRedWeb({ nativos: dom.nativos, guiones: [turno] });
    const { pantalla, instancia } = await montarApp(dom, red);
    await pantalla.findByRole("heading", { name: TEXTO_CHAT.vacioTitulo });

    dom.act(() => instancia.acciones.enviarTexto(PEDIDO));

    expect(await pantalla.findByText(RESPUESTA)).toBeDefined();
    await dom.esperar(() => expect(seleccionarEnCurso(instancia.almacen.leer())).toBe(false));
  });
});
