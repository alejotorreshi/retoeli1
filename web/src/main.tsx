import { App } from "@web/app.tsx";
import { ID_RAIZ } from "@web/config/constants/ui.constants.ts";
import { TEXTO_APP } from "@web/config/strings.ts";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

document.title = TEXTO_APP.tituloDocumento;

const raiz = document.getElementById(ID_RAIZ);
if (raiz !== null) {
  createRoot(raiz).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
