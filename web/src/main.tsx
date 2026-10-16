import "@web/styles/tokens.css";
import "@web/styles/global.css";
import { App } from "@web/app.tsx";
import { ID_RAIZ } from "@web/config/constants/ui.constants.ts";
import { dependenciasReales } from "@web/store/dependencias.ts";
import { crearInstancia } from "@web/store/instancia.ts";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const instancia = crearInstancia(dependenciasReales);

const raiz = document.getElementById(ID_RAIZ);
if (raiz !== null) {
  createRoot(raiz).render(
    <StrictMode>
      <App instancia={instancia} />
    </StrictMode>,
  );
}
