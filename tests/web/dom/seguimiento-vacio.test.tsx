import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { montarApp } from "@tests/helpers/app-dom.helper.ts";
import { prepararDom } from "@tests/helpers/dom.helper.ts";
import { crearRedWeb, eventoFin, eventoInicio, eventoTexto } from "@tests/helpers/red-web.helper.ts";
import type { AppMontada, ConsultasDom } from "@tests/helpers/types/dom.type.ts";
import type { GuionChat } from "@tests/helpers/types/red-web.type.ts";
import { TEXTO_ACCIONES, TEXTO_CHAT, TEXTO_ESTADO_VACIO } from "@web/config/strings.ts";

const ANCHO_ESCRITORIO = 1280;
const SESION = "sesion-del-seguimiento";
const RESPUESTA = "Listo: ec-corp-andina quedó mapeado.";
const ALTO_VACIO_1280X720 = 678;
const ZONA_1280X720 = 495;
const ALTO_VACIO_375X667 = 789;
const ZONA_375X667 = 330;
const ALTO_CONVERSACION = 2400;
const NOMBRE_OBSERVADOR = "ResizeObserver";
const MEDIDAS_DEL_VACIO = [
  { ventana: "1280x720", alto: ALTO_VACIO_1280X720, zona: ZONA_1280X720 },
  { ventana: "375x667", alto: ALTO_VACIO_375X667, zona: ZONA_375X667 },
] as const;

const dom = await prepararDom({ ancho: ANCHO_ESCRITORIO });

const turnoConRespuesta: GuionChat = { eventos: [eventoInicio(SESION), eventoTexto(RESPUESTA), eventoFin()] };

const observadores = new Set<ObservadorFalso>();

class ObservadorFalso implements ResizeObserver {
  readonly #alCambiar: ResizeObserverCallback;

  constructor(alCambiar: ResizeObserverCallback) {
    this.#alCambiar = alCambiar;
  }

  observe(): void {
    observadores.add(this);
  }

  unobserve(): void {
    observadores.delete(this);
  }

  disconnect(): void {
    observadores.delete(this);
  }

  notificar(): void {
    this.#alCambiar([], this);
  }
}

let observadorOriginal: unknown = null;

beforeEach(() => {
  observadorOriginal = Reflect.get(globalThis, NOMBRE_OBSERVADOR);
  Object.defineProperty(globalThis, NOMBRE_OBSERVADOR, {
    value: ObservadorFalso,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  observadores.clear();
  Object.defineProperty(globalThis, NOMBRE_OBSERVADOR, {
    value: observadorOriginal,
    configurable: true,
    writable: true,
  });
});

function simularAlturas(zona: HTMLElement, alto: number, visible: number): void {
  Object.defineProperty(zona, "scrollHeight", { configurable: true, get: () => alto });
  Object.defineProperty(zona, "clientHeight", { configurable: true, get: () => visible });
}

function notificarCambioDeTamano(): void {
  dom.act(() => {
    for (const observador of observadores) observador.notificar();
  });
}

function zonaDe(pantalla: ConsultasDom): HTMLElement {
  return pantalla.getByRole("region", { name: TEXTO_CHAT.lineaDeTiempo });
}

async function esperarEstadoVacio(pantalla: ConsultasDom): Promise<HTMLElement> {
  await pantalla.findByRole("heading", { name: TEXTO_CHAT.vacioTitulo });
  await pantalla.findByRole("region", { name: TEXTO_ESTADO_VACIO.casos });
  return zonaDe(pantalla);
}

async function conversarUnTurno({ pantalla, usuario }: AppMontada): Promise<HTMLElement> {
  const demo = await pantalla.findByRole("button", { name: TEXTO_ACCIONES.demo });
  await dom.esperar(() => expect(demo.hasAttribute("disabled")).toBe(false));
  await usuario.click(demo);
  await pantalla.findByText(RESPUESTA);
  return zonaDe(pantalla);
}

describe("seguimiento al final con el estado vacío", () => {
  for (const medida of MEDIDAS_DEL_VACIO) {
    test(`al entrar a ${medida.ventana} el estado vacío queda arriba y sin Ir al final`, async () => {
      const red = crearRedWeb({ nativos: dom.nativos });
      const { pantalla } = await montarApp(dom, red);
      const zona = await esperarEstadoVacio(pantalla);

      simularAlturas(zona, medida.alto, medida.zona);
      notificarCambioDeTamano();

      expect(zona.scrollTop).toBe(0);
      expect(pantalla.queryByRole("button", { name: TEXTO_CHAT.irAlFinal })).toBeNull();
    });
  }

  test("si el estado vacío primero cabe y después crece, sigue arriba", async () => {
    const red = crearRedWeb({ nativos: dom.nativos });
    const { pantalla } = await montarApp(dom, red);
    const zona = await esperarEstadoVacio(pantalla);

    simularAlturas(zona, ZONA_1280X720, ZONA_1280X720);
    notificarCambioDeTamano();
    expect(zona.scrollTop).toBe(0);

    simularAlturas(zona, ALTO_VACIO_1280X720, ZONA_1280X720);
    notificarCambioDeTamano();
    expect(zona.scrollTop).toBe(0);
  });

  test("con un turno la conversación sigue al final cuando crece", async () => {
    const red = crearRedWeb({ nativos: dom.nativos, guiones: [turnoConRespuesta] });
    const app = await montarApp(dom, red);
    const zona = await conversarUnTurno(app);

    simularAlturas(zona, ALTO_CONVERSACION, ZONA_1280X720);
    notificarCambioDeTamano();

    expect(zona.scrollTop).toBe(ALTO_CONVERSACION);
  });
});
