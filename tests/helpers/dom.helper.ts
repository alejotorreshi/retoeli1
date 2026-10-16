import { afterAll, afterEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { HerramientasDom, OpcionesDom } from "@tests/helpers/types/dom.type.ts";

const URL_DE_PRUEBA = "http://localhost:3000/";

const GLOBALES_NATIVOS = ["TransformStream", "WritableStream", "queueMicrotask"] as const;

function conservarGlobalesNativos(): () => void {
  const globales = GLOBALES_NATIVOS.map((nombre) => [nombre, Reflect.get(globalThis, nombre)] as const);
  return () => {
    for (const [nombre, valor] of globales) {
      Object.defineProperty(globalThis, nombre, { value: valor, configurable: true, writable: true });
    }
  };
}

export async function prepararDom({ ancho }: OpcionesDom): Promise<HerramientasDom> {
  const nativos = { Response: globalThis.Response, Headers: globalThis.Headers };
  const restaurarNativos = conservarGlobalesNativos();
  GlobalRegistrator.register({ url: URL_DE_PRUEBA, width: ancho });
  restaurarNativos();
  const rtl = await import("@testing-library/react");
  const { default: userEvent } = await import("@testing-library/user-event");
  afterEach(() => rtl.cleanup());
  afterEach(() => localStorage.clear());
  afterAll(() => GlobalRegistrator.unregister());
  return {
    render: rtl.render,
    act: rtl.act,
    esperar: rtl.waitFor,
    pantalla: () => rtl.within(document.body),
    dentroDe: (elemento) => rtl.within(elemento),
    usuario: () => userEvent.setup({ document }),
    nativos,
  };
}
