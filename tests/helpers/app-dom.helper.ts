import { onTestFinished, spyOn } from "bun:test";
import type { AppMontada, HerramientasDom } from "@tests/helpers/types/dom.type.ts";
import type { RedWeb } from "@tests/helpers/types/red-web.type.ts";
import { createElement, StrictMode } from "react";

function vigilarErroresDeConsola(): void {
  const espia = spyOn(console, "error");
  onTestFinished(() => {
    const errores = espia.mock.calls.length;
    espia.mockRestore();
    if (errores > 0) throw new Error(`la App emitió ${errores} console.error durante la prueba`);
  });
}

export async function montarApp(dom: HerramientasDom, red: RedWeb): Promise<AppMontada> {
  vigilarErroresDeConsola();
  globalThis.fetch = red.fetch;
  const { App } = await import("@web/app.tsx");
  const { crearInstancia } = await import("@web/store/instancia.ts");
  const { dependenciasReales } = await import("@web/store/dependencias.ts");
  const instancia = crearInstancia(dependenciasReales);
  dom.render(createElement(StrictMode, null, createElement(App, { instancia })));
  return { pantalla: dom.pantalla(), usuario: dom.usuario(), red, instancia };
}
