import { describe, expect, test } from "bun:test";
import { montarApp } from "@tests/helpers/app-dom.helper.ts";
import { prepararDom } from "@tests/helpers/dom.helper.ts";
import {
  CONFIG_DE_PRUEBA,
  crearRedWeb,
  eventoConfirmacion,
  eventoFin,
  eventoInicio,
  eventoTexto,
  TURNO_DE_PRUEBA,
} from "@tests/helpers/red-web.helper.ts";
import type { GuionChat } from "@tests/helpers/types/red-web.type.ts";
import { CLAVE_SESION_LOCAL } from "@web/config/constants/ui.constants.ts";
import {
  TEXTO_ACCIONES,
  TEXTO_CHAT,
  TEXTO_CONFIRMACION,
  TEXTO_MODELO,
  TEXTO_NUEVA_SESION,
} from "@web/config/strings.ts";
import { CODIGO_AGENTE, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { TIPO_ACCION } from "@/config/constants/confirmation.constants.ts";
import { METODO_POST, RUTA_API } from "@/config/constants/http.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import type { AccionEstructurada } from "@/loop/types/turno.type.ts";

const ANCHO_ESCRITORIO = 1280;
const SESION = "sesion-de-la-app";
const RESPUESTA = "Listo: ec-corp-andina quedó mapeado y faltan dos soportes.";
const RESPUESTA_TARDIA = "Este texto llegó después de detener el turno.";
const CASO_CONFIRMADO = "ec-corp-andina";
const BLOQUEO = "Certificado bancario vencido";
const PAUSA_TRAS_SOLTAR_MS = 30;
const MENSAJE_DE_ERROR = "El proveedor tardó demasiado en responder. Intenta de nuevo.";

const dom = await prepararDom({ ancho: ANCHO_ESCRITORIO });

const turnoConRespuesta: GuionChat = { eventos: [eventoInicio(SESION), eventoTexto(RESPUESTA), eventoFin()] };

function valorDe(elemento: HTMLElement): string {
  if (!(elemento instanceof HTMLTextAreaElement)) throw new Error("se esperaba un textarea");
  return elemento.value;
}

function habilitado(elemento: HTMLElement): boolean {
  return !elemento.hasAttribute("disabled");
}

describe("App en escritorio, con la red simulada en fetch", () => {
  test("el chip de demo envía el pedido del PRD, muestra la respuesta y guarda la sesión", async () => {
    const red = crearRedWeb({ nativos: dom.nativos, guiones: [turnoConRespuesta] });
    const { pantalla, usuario } = await montarApp(dom, red);

    expect(await pantalla.findByRole("heading", { name: TEXTO_CHAT.vacioTitulo })).toBeDefined();
    const demo = await pantalla.findByRole("button", { name: TEXTO_ACCIONES.demo });
    await dom.esperar(() => expect(habilitado(demo)).toBe(true));

    await usuario.click(demo);

    expect(await pantalla.findByText(RESPUESTA)).toBeDefined();
    const chats = red.pedidosA(RUTA_API.CHAT, METODO_POST);
    expect(chats.map((pedido) => pedido.cuerpo)).toEqual([
      { sessionId: null, message: TEXTO_ACCIONES.mensajeDemo },
    ]);
    await dom.esperar(() => {
      const chips = pantalla.getAllByRole("button", { name: TEXTO_ACCIONES.demo });
      expect(chips.every(habilitado)).toBe(true);
    });
    expect(localStorage.getItem(CLAVE_SESION_LOCAL)).toBe(SESION);
  });

  test("la línea de tiempo muestra el estado vacío con los tres chips y el indicador mientras corre el turno", async () => {
    const red = crearRedWeb({
      nativos: dom.nativos,
      guiones: [{ eventos: [eventoInicio(SESION)], retenidos: [eventoTexto(RESPUESTA), eventoFin()] }],
    });
    const { pantalla, usuario } = await montarApp(dom, red);
    const linea = await pantalla.findByRole("region", { name: TEXTO_CHAT.lineaDeTiempo });

    expect(linea.contains(await pantalla.findByRole("heading", { name: TEXTO_CHAT.vacioTitulo }))).toBe(true);
    expect(linea.contains(pantalla.getByText(TEXTO_CHAT.vacioCuerpo))).toBe(true);
    const grupo = pantalla.getByRole("group", { name: TEXTO_ACCIONES.grupo });
    expect(linea.contains(grupo)).toBe(true);
    const demo = pantalla.getByRole("button", { name: TEXTO_ACCIONES.demo });
    expect(grupo.contains(demo)).toBe(true);
    expect(
      grupo.contains(
        pantalla.getByRole("button", { name: TEXTO_ACCIONES.todos(CONFIG_DE_PRUEBA.casos.length) }),
      ),
    ).toBe(true);
    expect(grupo.contains(pantalla.getByRole("button", { name: TEXTO_ACCIONES.listar }))).toBe(true);
    await dom.esperar(() => expect(habilitado(demo)).toBe(true));

    await usuario.click(demo);

    const pensando = await pantalla.findByText(TEXTO_CHAT.pensando);
    expect(linea.contains(pensando)).toBe(true);
    expect(pensando.closest("[role='status']")).not.toBeNull();
    await dom.act(async () => {
      red.soltar();
      await Bun.sleep(PAUSA_TRAS_SOLTAR_MS);
    });
    expect(await pantalla.findByText(RESPUESTA)).toBeDefined();
    expect(pantalla.queryByText(TEXTO_CHAT.pensando)).toBeNull();
  });

  test("Enter en el compositor envía el borrador", async () => {
    const red = crearRedWeb({ nativos: dom.nativos, guiones: [turnoConRespuesta] });
    const { pantalla, usuario } = await montarApp(dom, red);
    const campo = await pantalla.findByRole("textbox", { name: TEXTO_CHAT.etiquetaMensaje });

    await usuario.type(campo, "hola{Enter}");

    await dom.esperar(() => expect(red.pedidosA(RUTA_API.CHAT, METODO_POST)).toHaveLength(1));
    expect(red.pedidosA(RUTA_API.CHAT, METODO_POST)[0]?.cuerpo).toEqual({ sessionId: null, message: "hola" });
    expect(await pantalla.findByText(RESPUESTA)).toBeDefined();
  });

  test("Shift+Enter inserta un salto de línea y no envía nada", async () => {
    const red = crearRedWeb({ nativos: dom.nativos });
    const { pantalla, usuario } = await montarApp(dom, red);
    const campo = await pantalla.findByRole("textbox", { name: TEXTO_CHAT.etiquetaMensaje });

    await usuario.type(campo, "a");
    await usuario.keyboard("{Shift>}{Enter}{/Shift}");
    await usuario.type(campo, "b");

    expect(valorDe(campo)).toBe("a\nb");
    expect(red.pedidosA(RUTA_API.CHAT, METODO_POST)).toEqual([]);
  });

  test("con el turno en curso no sale un segundo envío, y Detener descarta lo que llegue después", async () => {
    const red = crearRedWeb({
      nativos: dom.nativos,
      guiones: [{ eventos: [eventoInicio(SESION)], retenidos: [eventoTexto(RESPUESTA_TARDIA), eventoFin()] }],
    });
    const { pantalla, usuario } = await montarApp(dom, red);
    const demo = await pantalla.findByRole("button", { name: TEXTO_ACCIONES.demo });
    await dom.esperar(() => expect(habilitado(demo)).toBe(true));

    await usuario.click(demo);

    const detener = await pantalla.findByRole("button", { name: TEXTO_CHAT.detener });
    expect(pantalla.queryByRole("button", { name: TEXTO_CHAT.enviar })).toBeNull();
    const chips = pantalla.getAllByRole("button", { name: TEXTO_ACCIONES.demo });
    expect(chips.some(habilitado)).toBe(false);
    for (const chip of chips) await usuario.click(chip);
    await usuario.type(pantalla.getByRole("textbox", { name: TEXTO_CHAT.etiquetaMensaje }), "otra{Enter}");
    expect(red.pedidosA(RUTA_API.CHAT, METODO_POST)).toHaveLength(1);

    await usuario.click(detener);
    await dom.act(async () => {
      red.soltar();
      await Bun.sleep(PAUSA_TRAS_SOLTAR_MS);
    });

    expect(pantalla.queryByText(RESPUESTA_TARDIA)).toBeNull();
    const enviar = await pantalla.findByRole("button", { name: TEXTO_CHAT.enviar });
    expect(habilitado(enviar)).toBe(true);
    expect(pantalla.getAllByRole("button", { name: TEXTO_ACCIONES.demo }).every(habilitado)).toBe(true);
    expect(red.pedidosA(RUTA_API.CHAT, METODO_POST)).toHaveLength(1);
  });

  for (const tipo of [TIPO_ACCION.CONFIRMAR, TIPO_ACCION.CANCELAR]) {
    test(`la tarjeta de confirmación envía la acción estructurada ${tipo}`, async () => {
      const red = crearRedWeb({
        nativos: dom.nativos,
        guiones: [
          {
            eventos: [eventoInicio(SESION), eventoConfirmacion(CASO_CONFIRMADO, [BLOQUEO]), eventoFin(true)],
          },
          turnoConRespuesta,
        ],
      });
      const { pantalla, usuario } = await montarApp(dom, red);
      const demo = await pantalla.findByRole("button", { name: TEXTO_ACCIONES.demo });
      await dom.esperar(() => expect(habilitado(demo)).toBe(true));
      await usuario.click(demo);

      const nombre =
        tipo === TIPO_ACCION.CONFIRMAR ? TEXTO_CONFIRMACION.confirmar : TEXTO_CONFIRMACION.cancelar;
      const boton = await pantalla.findByRole("button", { name: nombre });
      expect(pantalla.getByRole("button", { name: TEXTO_CONFIRMACION.confirmar })).toBeDefined();
      expect(pantalla.getByRole("button", { name: TEXTO_CONFIRMACION.cancelar })).toBeDefined();
      expect(pantalla.getByText(BLOQUEO)).toBeDefined();
      await dom.esperar(() => expect(boton.getAttribute("aria-disabled")).toBe("false"));

      await usuario.click(boton);

      await dom.esperar(() => expect(red.pedidosA(RUTA_API.CHAT, METODO_POST)).toHaveLength(2));
      const accion: AccionEstructurada = { tipo, caso: CASO_CONFIRMADO };
      expect(red.pedidosA(RUTA_API.CHAT, METODO_POST)[1]?.cuerpo).toEqual({
        sessionId: SESION,
        message: TEXTO_CONFIRMACION.mensaje(accion),
        accion,
      });
    });
  }

  test("un evento de error del servidor se muestra como alerta con su mensaje", async () => {
    const red = crearRedWeb({
      nativos: dom.nativos,
      guiones: [
        {
          eventos: [
            eventoInicio(SESION),
            {
              tipo: TIPO_EVENTO.ERROR,
              turnoId: TURNO_DE_PRUEBA,
              codigo: CODIGO_AGENTE.PROVEEDOR_TIMEOUT,
              mensaje: MENSAJE_DE_ERROR,
            },
            eventoFin(),
          ],
        },
      ],
    });
    const { pantalla, usuario } = await montarApp(dom, red);
    const demo = await pantalla.findByRole("button", { name: TEXTO_ACCIONES.demo });
    await dom.esperar(() => expect(habilitado(demo)).toBe(true));

    await usuario.click(demo);

    const alerta = await pantalla.findByRole("alert");
    expect(alerta.textContent).toContain(MENSAJE_DE_ERROR);
  });

  test("Nueva sesión pide confirmación: Seguir conserva la conversación y Empezar vuelve al estado vacío", async () => {
    const red = crearRedWeb({ nativos: dom.nativos, guiones: [turnoConRespuesta] });
    const { pantalla, usuario } = await montarApp(dom, red);
    const demo = await pantalla.findByRole("button", { name: TEXTO_ACCIONES.demo });
    await dom.esperar(() => expect(habilitado(demo)).toBe(true));
    await usuario.click(demo);
    await pantalla.findByText(RESPUESTA);
    const abrir = pantalla.getByRole("button", { name: TEXTO_NUEVA_SESION.abrir });
    await dom.esperar(() => expect(habilitado(abrir)).toBe(true));

    await usuario.click(abrir);
    const dialogo = await pantalla.findByRole("dialog", { name: TEXTO_NUEVA_SESION.titulo });
    const seguir = pantalla.getByRole("button", { name: TEXTO_NUEVA_SESION.seguir });
    expect(document.activeElement).toBe(seguir);
    await usuario.click(seguir);

    expect(dialogo.hasAttribute("open")).toBe(false);
    expect(pantalla.getByText(RESPUESTA)).toBeDefined();

    await usuario.click(abrir);
    await usuario.click(await pantalla.findByRole("button", { name: TEXTO_NUEVA_SESION.empezar }));

    expect(await pantalla.findByRole("heading", { name: TEXTO_CHAT.vacioTitulo })).toBeDefined();
    expect(pantalla.queryByText(RESPUESTA)).toBeNull();
    expect(red.pedidosA(RUTA_API.CHAT, METODO_POST)).toHaveLength(1);
  });

  test("el aviso del modelo sin clave pausa los chips y Comprobar de nuevo vuelve a pedir la salud", async () => {
    const red = crearRedWeb({ nativos: dom.nativos, salud: ESTADO_LLM.SIN_CLAVE });
    const { pantalla, usuario } = await montarApp(dom, red);
    const aviso = TEXTO_MODELO.aviso(ESTADO_LLM.SIN_CLAVE, CONFIG_DE_PRUEBA.zona);

    expect(await pantalla.findByText(aviso.titulo)).toBeDefined();
    const demo = await pantalla.findByRole("button", { name: TEXTO_ACCIONES.demo });
    expect(habilitado(demo)).toBe(false);
    const comprobar = await pantalla.findByRole("button", { name: TEXTO_MODELO.comprobar });
    const pedidosPrevios = red.pedidosA(RUTA_API.SALUD).length;

    red.fijarSalud(ESTADO_LLM.DISPONIBLE);
    await usuario.click(comprobar);

    await dom.esperar(() => expect(red.pedidosA(RUTA_API.SALUD).length).toBeGreaterThan(pedidosPrevios));
    await dom.esperar(() => expect(pantalla.queryByText(aviso.titulo)).toBeNull());
    await dom.esperar(() => expect(habilitado(demo)).toBe(true));
  });
});
