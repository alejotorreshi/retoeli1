import "@web/styles/tokens.css";
import "@web/styles/global.css";
import { App } from "@web/app.tsx";
import { ID_RAIZ } from "@web/config/constants/ui.constants.ts";
import { TEXTO_APP } from "@web/config/strings.ts";
import { dependenciasReales } from "@web/store/dependencias.ts";
import { crearInstancia } from "@web/store/instancia.ts";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

document.title = TEXTO_APP.tituloDocumento;

const instancia = crearInstancia(dependenciasReales);

const raiz = document.getElementById(ID_RAIZ);
if (raiz !== null) {
  createRoot(raiz).render(
    <StrictMode>
      <App instancia={instancia} />
    </StrictMode>,
  );
}
