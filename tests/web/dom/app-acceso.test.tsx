import { describe, expect, test } from "bun:test";
import { montarApp } from "@tests/helpers/app-dom.helper.ts";
import { prepararDom } from "@tests/helpers/dom.helper.ts";
import { crearRedWeb } from "@tests/helpers/red-web.helper.ts";
import { TEXTO_ACCESO, TEXTO_CHAT } from "@web/config/strings.ts";
import { METODO_POST, RUTA_API } from "@/config/constants/http.constants.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";

const ANCHO_ESCRITORIO = 1280;
const CODIGO_CORRECTO = "codigo-de-prueba-correcto";
const CODIGO_INCORRECTO = "codigo-de-prueba-errado";

const dom = await prepararDom({ ancho: ANCHO_ESCRITORIO });

function valoresGuardados(): string[] {
  const valores: string[] = [];
  for (let indice = 0; indice < localStorage.length; indice += 1) {
    const clave = localStorage.key(indice);
    const valor = clave === null ? null : localStorage.getItem(clave);
    if (valor !== null) valores.push(valor);
  }
  return valores;
}

describe("App con el acceso pedido por la API", () => {
  test("un 401 de /api/config muestra la pantalla de acceso con el campo enfocado y oculto", async () => {
    const red = crearRedWeb({ nativos: dom.nativos, codigoAcceso: CODIGO_CORRECTO });
    const { pantalla, usuario } = await montarApp(dom, red);

    expect(await pantalla.findByRole("heading", { name: TEXTO_ACCESO.titulo })).toBeDefined();
    const campo = pantalla.getByLabelText(TEXTO_ACCESO.etiqueta);
    await dom.esperar(() => expect(document.activeElement).toBe(campo));
    expect(campo.getAttribute("type")).toBe("password");

    await usuario.click(pantalla.getByRole("button", { name: TEXTO_ACCESO.mostrar }));

    expect(campo.getAttribute("type")).toBe("text");
    expect(pantalla.getByRole("button", { name: TEXTO_ACCESO.ocultar })).toBeDefined();
  });

  test("un código rechazado muestra el mensaje del servidor y uno aceptado entra sin guardar el código", async () => {
    const red = crearRedWeb({ nativos: dom.nativos, codigoAcceso: CODIGO_CORRECTO });
    const { pantalla, usuario } = await montarApp(dom, red);
    await pantalla.findByRole("heading", { name: TEXTO_ACCESO.titulo });
    const campo = pantalla.getByLabelText(TEXTO_ACCESO.etiqueta);

    await usuario.type(campo, CODIGO_INCORRECTO);
    await usuario.click(pantalla.getByRole("button", { name: TEXTO_ACCESO.entrar }));

    expect(await pantalla.findByText(MENSAJE_HTTP.codigoInvalido)).toBeDefined();
    expect(campo.getAttribute("aria-invalid")).toBe("true");

    await usuario.clear(campo);
    await usuario.type(campo, CODIGO_CORRECTO);
    await usuario.click(pantalla.getByRole("button", { name: TEXTO_ACCESO.entrar }));

    expect(await pantalla.findByRole("heading", { name: TEXTO_CHAT.vacioTitulo })).toBeDefined();
    expect(red.pedidosA(RUTA_API.ACCESO, METODO_POST).map((pedido) => pedido.cuerpo)).toEqual([
      { codigo: CODIGO_INCORRECTO },
      { codigo: CODIGO_CORRECTO },
    ]);
    expect(valoresGuardados()).not.toContain(CODIGO_CORRECTO);
    expect(valoresGuardados()).not.toContain(CODIGO_INCORRECTO);
  });
});
