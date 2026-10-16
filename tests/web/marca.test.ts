import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  FUENTES_AUTOALOJADAS,
  LICENCIAS_DE_FUENTES,
  MARCADOR_TITULO,
  NOMBRE_PLUGIN_TITULO,
  RUTA_FAVICON,
  RUTA_LOGO,
} from "@web/config/constants/marca.constants.ts";
import { TEXTO_APP } from "@web/config/strings.ts";
import type { PluginOption, UserConfig } from "vite";

const RAIZ = join(import.meta.dir, "..", "..");
const CARPETA_PUBLICA = join(RAIZ, "web", "public");
const INDEX_HTML = "web/index.html";
const GLOBAL_CSS = "web/src/styles/global.css";
const MARCA_CONSTANTES = "web/src/config/constants/marca.constants.ts";
const CONFIG_VITE = join(RAIZ, "web", "vite.config.ts");
const URL_PUBLICA = /\/(?:marca|fuentes)\/[\w.-]+/g;
const URL_ABSOLUTA = /https?:\/\//;
const TITULO = /<title>([^<]*)<\/title>/;
const LICENCIA_OFL = "SIL OPEN FONT LICENSE";
const FIRMA_WOFF2 = "wOF2";
const FIRMA_RIFF = "RIFF";
const FIRMA_WEBP = "WEBP";
const FIRMA_JPEG = [0xff, 0xd8, 0xff];
const INICIO_WEBP = 8;
const FIN_WEBP = 12;
const LARGO_FIRMA = 4;

type ModuloVite = {
  readonly default: UserConfig;
  readonly insertarTituloDelDocumento: (html: string) => string;
  readonly escaparHtml: (texto: string) => string;
};

function leer(ruta: string): string {
  return readFileSync(join(RAIZ, ruta), "utf8");
}

function bytesPublicos(ruta: string): Uint8Array {
  return new Uint8Array(readFileSync(join(CARPETA_PUBLICA, ruta)));
}

function ascii(bytes: Uint8Array, inicio: number, fin: number): string {
  return String.fromCharCode(...bytes.slice(inicio, fin));
}

function archivosDeCodigoWeb(): string[] {
  return [...new Bun.Glob("web/src/**/*.{ts,tsx,css}").scanSync({ cwd: RAIZ })];
}

function nombreDelPlugin(opcion: PluginOption): string | null {
  if (typeof opcion !== "object" || opcion === null || Array.isArray(opcion)) return null;
  if (!("name" in opcion) || typeof opcion.name !== "string") return null;
  return opcion.name;
}

function transformadorDelPlugin(opciones: readonly PluginOption[]): unknown {
  const plugin = opciones.find((opcion) => nombreDelPlugin(opcion) === NOMBRE_PLUGIN_TITULO);
  if (typeof plugin !== "object" || plugin === null || !("transformIndexHtml" in plugin)) return null;
  return plugin.transformIndexHtml;
}

const FUENTES = Object.values(FUENTES_AUTOALOJADAS);
const LICENCIAS = Object.values(LICENCIAS_DE_FUENTES);

describe("activos de marca autoalojados en web/public", () => {
  test("el logo, el favicon, las tres fuentes y las dos licencias existen", () => {
    for (const ruta of [RUTA_LOGO, RUTA_FAVICON, ...FUENTES, ...LICENCIAS]) {
      expect(existsSync(join(CARPETA_PUBLICA, ruta))).toBe(true);
    }
  });

  test("las fuentes son WOFF2, el logo es WebP y el favicon es JPEG", () => {
    for (const fuente of FUENTES) {
      expect(ascii(bytesPublicos(fuente), 0, LARGO_FIRMA)).toBe(FIRMA_WOFF2);
    }
    const logo = bytesPublicos(RUTA_LOGO);
    expect(ascii(logo, 0, LARGO_FIRMA)).toBe(FIRMA_RIFF);
    expect(ascii(logo, INICIO_WEBP, FIN_WEBP)).toBe(FIRMA_WEBP);
    expect([...bytesPublicos(RUTA_FAVICON).slice(0, FIRMA_JPEG.length)]).toEqual(FIRMA_JPEG);
  });

  test("las licencias son la SIL Open Font License", () => {
    for (const licencia of LICENCIAS) {
      expect(readFileSync(join(CARPETA_PUBLICA, licencia), "utf8")).toContain(LICENCIA_OFL);
    }
  });

  test("toda URL /marca/ y /fuentes/ de index.html, global.css y marca.constants.ts existe", () => {
    const urls = [INDEX_HTML, GLOBAL_CSS, MARCA_CONSTANTES].flatMap(
      (ruta) => leer(ruta).match(URL_PUBLICA) ?? [],
    );
    expect(urls).toContain(RUTA_FAVICON);
    expect(urls.filter((url) => url.startsWith("/fuentes/")).length).toBeGreaterThan(FUENTES.length);
    for (const url of urls) {
      expect({ url, existe: existsSync(join(CARPETA_PUBLICA, url)) }).toEqual({ url, existe: true });
    }
  });

  test("ni index.html ni web/src cargan nada de un dominio externo", () => {
    const conUrl = [INDEX_HTML, ...archivosDeCodigoWeb()].filter((ruta) => URL_ABSOLUTA.test(leer(ruta)));
    expect(conUrl).toEqual([]);
  });
});

describe("el título del documento se escribe en el build", () => {
  test("index.html lleva el marcador una sola vez y el favicon de la marca", () => {
    const html = leer(INDEX_HTML);
    expect(html.split(MARCADOR_TITULO)).toHaveLength(2);
    expect(html).toContain(`href="${RUTA_FAVICON}"`);
    expect(html).not.toContain("data:,");
  });

  test("el plugin titulo-del-documento de vite.config.ts escribe TEXTO_APP.tituloDocumento escapado", async () => {
    const modulo: ModuloVite = await import(CONFIG_VITE);
    expect(transformadorDelPlugin(modulo.default.plugins ?? [])).toBe(modulo.insertarTituloDelDocumento);

    const resultado = modulo.insertarTituloDelDocumento(leer(INDEX_HTML));
    const esperado = modulo.escaparHtml(TEXTO_APP.tituloDocumento);
    expect(resultado.match(TITULO)?.[1]).toBe(esperado);
    expect(resultado).not.toContain(MARCADOR_TITULO);
    expect(modulo.insertarTituloDelDocumento(`<title>${MARCADOR_TITULO}</title>`)).toBe(
      `<title>${esperado}</title>`,
    );
  });

  test("el texto del título se escapa: & y < nunca llegan crudos al HTML", async () => {
    const modulo: ModuloVite = await import(CONFIG_VITE);
    expect(modulo.escaparHtml("A & B <c>")).toBe("A &amp; B &lt;c>");
    expect(modulo.escaparHtml(TEXTO_APP.tituloDocumento)).toBe(TEXTO_APP.tituloDocumento);
  });
});
