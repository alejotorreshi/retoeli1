import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import {
  DIRECTORIO_WEB_DIST,
  PREFIJO_API,
  PUERTO_API_POR_DEFECTO,
  PUERTO_WEB_DEV,
} from "@/config/constants/http.constants.ts";

function rutaDesdeWeb(relativa: string): string {
  return fileURLToPath(new URL(relativa, import.meta.url));
}

export default defineConfig({
  root: rutaDesdeWeb("."),
  plugins: [react()],
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
