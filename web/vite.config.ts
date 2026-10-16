import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import {
  ENTIDADES_HTML,
  MARCADOR_TITULO,
  NOMBRE_PLUGIN_TITULO,
} from "@web/config/constants/marca.constants.ts";
import { TEXTO_APP } from "@web/config/strings.ts";
import { defineConfig, type Plugin } from "vite";
import {
  DIRECTORIO_WEB_DIST,
  PREFIJO_API,
  PUERTO_API_POR_DEFECTO,
  PUERTO_WEB_DEV,
} from "@/config/constants/http.constants.ts";

function rutaDesdeWeb(relativa: string): string {
  return fileURLToPath(new URL(relativa, import.meta.url));
}

export function escaparHtml(texto: string): string {
  return texto
    .replaceAll(ENTIDADES_HTML.AMPERSAND.caracter, ENTIDADES_HTML.AMPERSAND.entidad)
    .replaceAll(ENTIDADES_HTML.MENOR_QUE.caracter, ENTIDADES_HTML.MENOR_QUE.entidad);
}

export function insertarTituloDelDocumento(html: string): string {
  return html.replace(MARCADOR_TITULO, escaparHtml(TEXTO_APP.tituloDocumento));
}

function tituloDelDocumento(): Plugin {
  return { name: NOMBRE_PLUGIN_TITULO, transformIndexHtml: insertarTituloDelDocumento };
}

export default defineConfig({
  root: rutaDesdeWeb("."),
  plugins: [react(), tituloDelDocumento()],
  resolve: {
    alias: {
      "@web": rutaDesdeWeb("./src"),
      "@": rutaDesdeWeb("../src"),
    },
  },
  build: {
    outDir: rutaDesdeWeb(`../${DIRECTORIO_WEB_DIST}`),
    emptyOutDir: true,
  },
  server: {
    port: PUERTO_WEB_DEV,
    strictPort: true,
    proxy: {
      [PREFIJO_API]: `http://localhost:${PUERTO_API_POR_DEFECTO}`,
    },
  },
});
