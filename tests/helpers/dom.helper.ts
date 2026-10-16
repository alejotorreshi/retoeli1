import { afterAll, afterEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import type { HerramientasDom, OpcionesDom } from "@tests/helpers/types/dom.type.ts";

const URL_DE_PRUEBA = "http://localhost:3000/";

const FLUJOS_NATIVOS = ["TransformStream", "WritableStream"] as const;

function conservarFlujosNativos(): () => void {
  const flujos = FLUJOS_NATIVOS.map((nombre) => [nombre, Reflect.get(globalThis, nombre)] as const);
  return () => {
    for (const [nombre, valor] of flujos) {
      Object.defineProperty(globalThis, nombre, { value: valor, configurable: true, writable: true });
    }
  };
}

export async function prepararDom({ ancho }: OpcionesDom): Promise<HerramientasDom> {
  const nativos = { Response: globalThis.Response, Headers: globalThis.Headers };
  const restaurarFlujos = conservarFlujosNativos();
  GlobalRegistrator.register({ url: URL_DE_PRUEBA, width: ancho });
  restaurarFlujos();
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
    usuario: () => userEvent.setup({ document }),
    nativos,
  };
}
