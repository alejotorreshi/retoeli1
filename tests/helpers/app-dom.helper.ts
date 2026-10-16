import type { AppMontada, HerramientasDom } from "@tests/helpers/types/dom.type.ts";
import type { RedWeb } from "@tests/helpers/types/red-web.type.ts";
import { createElement, StrictMode } from "react";

export async function montarApp(dom: HerramientasDom, red: RedWeb): Promise<AppMontada> {
  globalThis.fetch = red.fetch;
  const { App } = await import("@web/app.tsx");
  dom.render(createElement(StrictMode, null, createElement(App)));
  return { pantalla: dom.pantalla(), usuario: dom.usuario(), red };
}
