import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { MARCADOR_TITULO, NOMBRE_PLUGIN_TITULO, RUTA_LOGO } from "@web/config/constants/marca.constants.ts";
import { CLASE_GLOBAL, ID_RAIZ } from "@web/config/constants/ui.constants.ts";
import { TEXTO_APP } from "@web/config/strings.ts";
import type { PluginOption, UserConfig } from "vite";

const RAIZ = join(import.meta.dir, "..", "..");
const CARPETA_PUBLICA = join(RAIZ, "web", "public");
const INDEX_HTML = "web/index.html";
const GLOBAL_CSS = "web/src/styles/global.css";
const TOKENS_CSS = "web/src/styles/tokens.css";
const MARCA_CONSTANTES = "web/src/config/constants/marca.constants.ts";
const CONFIG_VITE = join(RAIZ, "web", "vite.config.ts");
const URL_PUBLICA = /\/(?:marca|fuentes)\/[\w.-]+/g;
const URL_ABSOLUTA = /https?:\/\//;
const TITULO = /<title>([^<]*)<\/title>/;
const FUENTE_DE_FONT_FACE = /src:\s*url\("(\/fuentes\/[\w.-]+)"\)/g;
const FAMILIA_DE_FONT_FACE = /font-family:\s*"([^"]+)"/g;
const PRECARGA_DE_FUENTE = /<link rel="preload" as="font"[^>]*href="([^"]+)"/g;
const ICONO = /<link rel="icon"[^>]*href="([^"]+)"/;
const ICONO_APPLE = /<link rel="apple-touch-icon"[^>]*href="([^"]+)"/;
const COLOR_DE_TEMA = /<meta name="theme-color" content="([^"]+)"/;
const TOKEN_DE_MARCA = /--marca:\s*([^;]+);/;
const CARPETA_DE_LICENCIAS = "/fuentes/";
const PREFIJO_LICENCIA = "OFL-";
const EXTENSION_LICENCIA = ".txt";
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

function capturas(texto: string, patron: RegExp): string[] {
  return [...texto.matchAll(patron)].flatMap((coincidencia) => coincidencia.slice(1, 2));
}

function captura(texto: string, patron: RegExp): string | null {
  return patron.exec(texto)?.[1] ?? null;
}

function fuentesDeFontFace(css: string): string[] {
  return capturas(css, FUENTE_DE_FONT_FACE);
}

function licenciasDeFontFace(css: string): string[] {
  return [...new Set(capturas(css, FAMILIA_DE_FONT_FACE))].map(
    (familia) => `${CARPETA_DE_LICENCIAS}${PREFIJO_LICENCIA}${familia}${EXTENSION_LICENCIA}`,
  );
}

function precargasHuerfanas(html: string, css: string): string[] {
  const declaradas = new Set(fuentesDeFontFace(css));
  return capturas(html, PRECARGA_DE_FUENTE).filter((precarga) => !declaradas.has(precarga));
}

function colorDeTemaDistinto(html: string, tokens: string): boolean {
  const tema = captura(html, COLOR_DE_TEMA);
  return tema === null || tema !== captura(tokens, TOKEN_DE_MARCA)?.trim();
}

function raizFaltante(html: string, css: string): string[] {
  return [
    ...(html.includes(`id="${ID_RAIZ}"`) ? [] : [INDEX_HTML]),
    ...(new RegExp(`#${ID_RAIZ}(?![\\w-])`).test(css) ? [] : [GLOBAL_CSS]),
  ];
}

function clasesGlobalesSinRegla(css: string): string[] {
  return Object.values(CLASE_GLOBAL).filter((clase) => !new RegExp(`\\.${clase}\\s*[{,]`).test(css));
}

const FUENTES = fuentesDeFontFace(leer(GLOBAL_CSS));
const LICENCIAS = licenciasDeFontFace(leer(GLOBAL_CSS));
const FAVICON = captura(leer(INDEX_HTML), ICONO) ?? "";

describe("activos de marca autoalojados en web/public", () => {
  test("el logo, el favicon de index.html, las tres fuentes de global.css y la licencia de cada familia existen", () => {
    expect(FUENTES).toHaveLength(3);
    expect(LICENCIAS).toEqual(["/fuentes/OFL-Outfit.txt", "/fuentes/OFL-Montserrat.txt"]);
    for (const ruta of [RUTA_LOGO, FAVICON, ...FUENTES, ...LICENCIAS]) {
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
    expect([...bytesPublicos(FAVICON).slice(0, FIRMA_JPEG.length)]).toEqual(FIRMA_JPEG);
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
    expect(urls).toContain(FAVICON);
    expect(urls).toContain(RUTA_LOGO);
    for (const url of urls) {
      expect({ url, existe: existsSync(join(CARPETA_PUBLICA, url)) }).toEqual({ url, existe: true });
    }
  });

  test("index.html solo precarga fuentes que global.css declara, el ícono de Apple es el favicon y theme-color es --marca", () => {
    const html = leer(INDEX_HTML);
    expect(capturas(html, PRECARGA_DE_FUENTE).length).toBeGreaterThan(0);
    expect(precargasHuerfanas(html, leer(GLOBAL_CSS))).toEqual([]);
    expect(captura(html, ICONO_APPLE)).toBe(FAVICON);
    expect(colorDeTemaDistinto(html, leer(TOKENS_CSS))).toBe(false);
  });

  test("detecta una precarga sin @font-face y un theme-color que no es --marca", () => {
    const css =
      '@font-face { font-family: "Outfit"; src: url("/fuentes/outfit-latin-600.woff2") format("woff2"); }';
    const html = [
      '<link rel="preload" as="font" type="font/woff2" crossorigin href="/fuentes/outfit-latin-600.woff2" />',
      '<link rel="preload" as="font" type="font/woff2" crossorigin href="/fuentes/outfit-latin-700.woff2" />',
      '<meta name="theme-color" content="#000000" />',
    ].join("\n");
    expect(precargasHuerfanas(html, css)).toEqual(["/fuentes/outfit-latin-700.woff2"]);
    expect(colorDeTemaDistinto(html, ":root { --marca: #063635; }")).toBe(true);
    expect(colorDeTemaDistinto(html, ":root { --marca: #000000; }")).toBe(false);
    expect(colorDeTemaDistinto("<head></head>", ":root { --marca: #000000; }")).toBe(true);
    expect(licenciasDeFontFace(css)).toEqual(["/fuentes/OFL-Outfit.txt"]);
  });

  test("ni index.html ni web/src cargan nada de un dominio externo", () => {
    const conUrl = [INDEX_HTML, ...archivosDeCodigoWeb()].filter((ruta) => URL_ABSOLUTA.test(leer(ruta)));
    expect(conUrl).toEqual([]);
  });
});

describe("la raíz y las clases globales que usa TS existen en index.html y global.css", () => {
  test("index.html monta la raíz ID_RAIZ, global.css la estiliza y define cada CLASE_GLOBAL", () => {
    expect(raizFaltante(leer(INDEX_HTML), leer(GLOBAL_CSS))).toEqual([]);
    expect(clasesGlobalesSinRegla(leer(GLOBAL_CSS))).toEqual([]);
  });

  test("muerde: una raíz con otro id y una clase global renombrada en el CSS", () => {
    expect(raizFaltante('<div id="app"></div>', "#app {}")).toEqual([INDEX_HTML, GLOBAL_CSS]);
    expect(raizFaltante(`<div id="${ID_RAIZ}"></div>`, `#${ID_RAIZ}-x {}`)).toEqual([GLOBAL_CSS]);
    expect(clasesGlobalesSinRegla(`.solo-lectores {}\n.${CLASE_GLOBAL.GIRAR} {}`)).toEqual([
      CLASE_GLOBAL.OCULTO,
    ]);
  });
});

describe("el título del documento se escribe en el build", () => {
  test("index.html lleva el marcador una sola vez y el favicon de la marca", () => {
    const html = leer(INDEX_HTML);
    expect(html.split(MARCADOR_TITULO)).toHaveLength(2);
    expect(FAVICON.startsWith("/marca/")).toBe(true);
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
