import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ENUM_DE_TS,
  EXPORTA_TIPO,
  extraerImportacionesConTipo,
  IMPORTA_VALOR,
  LITERAL_DE_REGEX,
  lineasQueCumplen,
  literalesDeTexto,
  nombreDePaquete,
  TEXTO_LEGIBLE,
  VALOR_EN_ARCHIVO_DE_TIPOS,
} from "@tests/helpers/escaner-fuentes.helper.ts";

const RAIZ = join(import.meta.dir, "..");

const CARPETA_WEB = "web/src";

const ALIAS_WEB = "@web/";

const ALIAS_SRC = "@/";

const PAQUETES_WEB: ReadonlySet<string> = new Set(["react", "react-dom", "eventsource-parser"]);

const PAQUETES_DE_REACT: ReadonlySet<string> = new Set(["react", "react-dom"]);

const SRC_DE_VALOR = /^@\/config\/(?:constants|types)\//;

const SRC_DE_SOLO_TIPO = /^@\/http\/types\//;

const CARPETA_DE_ESTADO = "web/src/state/";

const NUCLEO_PURO_DEL_ALMACEN: ReadonlySet<string> = new Set([
  "web/src/store/almacen.ts",
  "web/src/store/raiz.ts",
  "web/src/store/selectores.ts",
]);

const API_DEL_NAVEGADOR = /\b(?:document|window|localStorage|sessionStorage|fetch)\b/;

const INYECCION_DE_HTML = /\b(?:dangerouslySetInnerHTML|innerHTML|outerHTML|insertAdjacentHTML)\b/;

const ENTORNO_DE_VITE = /\bimport\s*\.\s*meta\s*\.\s*env\b/;

const ALMACEN_DE_SESION = /\bsessionStorage\b/;

const ALMACEN_LOCAL = /\blocalStorage\b/;

const DUENO_DE_ALMACEN_LOCAL = "web/src/api/sesion-local.ts";

const DUENO_DE_TEXTO = "web/src/config/strings.ts";

const DUENO_DE_REGEX = "web/src/config/constants/patterns.constants.ts";

const ARCHIVO_DE_TIPOS_WEB = /^web\/src\/types\/[a-z0-9-]+\.type\.ts$/;

const COLOR_SUELTO = /#[0-9A-Fa-f]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/;

const LONGITUD_EN_PX = /\b\d+(?:\.\d+)?px\b/;

const KEBAB = "[a-z0-9]+(?:-[a-z0-9]+)*";

const UBICACIONES_WEB: readonly RegExp[] = [
  /^web\/src\/(?:main|app)\.tsx$/,
  /^web\/src\/config\/strings\.ts$/,
  new RegExp(`^web/src/config/constants/${KEBAB}\\.constants\\.ts$`),
  new RegExp(`^web/src/types/${KEBAB}\\.type\\.ts$`),
  new RegExp(`^web/src/(?:api|state|hooks)/${KEBAB}\\.tsx?$`),
  new RegExp(`^web/src/store/${KEBAB}\\.ts$`),
  /^web\/src\/store\/proveedor-almacen\.tsx$/,
  new RegExp(`^web/src/components/(?:icons/)?${KEBAB}\\.(?:tsx|module\\.css)$`),
  new RegExp(`^web/src/styles/${KEBAB}\\.css$`),
];

const TRANSPILADORES = {
  ts: new Bun.Transpiler({ loader: "ts" }),
  tsx: new Bun.Transpiler({ loader: "tsx" }),
} as const;

function normalizar(rutas: readonly string[]): string[] {
  return rutas.map((ruta) => ruta.split("\\").join("/")).sort();
}

function escanear(patron: string): string[] {
  if (!existsSync(join(RAIZ, CARPETA_WEB))) return [];
  return normalizar([...new Bun.Glob(patron).scanSync({ cwd: RAIZ })]);
}

function listarCodigoWeb(): string[] {
  return normalizar([...escanear(`${CARPETA_WEB}/**/*.ts`), ...escanear(`${CARPETA_WEB}/**/*.tsx`)]);
}

function listarModulosCss(): string[] {
  return escanear(`${CARPETA_WEB}/**/*.module.css`);
}

function listarTodoWeb(): string[] {
  return escanear(`${CARPETA_WEB}/**/*`);
}

function leer(ruta: string): string {
  return readFileSync(join(RAIZ, ruta), "utf8");
}

function violacionesDeImportacionRelativa(ruta: string, codigo: string): string[] {
  return extraerImportacionesConTipo(codigo)
    .filter(({ especificador }) => especificador.startsWith("."))
    .map(({ especificador }) => `${ruta}: importación relativa ${especificador}`);
}

function esPaquete(especificador: string): boolean {
  return ![".", ALIAS_WEB, ALIAS_SRC].some((prefijo) => especificador.startsWith(prefijo));
}

function violacionesDePaquetes(ruta: string, codigo: string): string[] {
  return extraerImportacionesConTipo(codigo)
    .filter(({ especificador }) => esPaquete(especificador))
    .filter(({ especificador }) => !PAQUETES_WEB.has(nombreDePaquete(especificador)))
    .map(({ especificador }) => `${ruta}: paquete no permitido en web/ ${especificador}`);
}

function violacionesDeAliasSrc(ruta: string, codigo: string): string[] {
  return extraerImportacionesConTipo(codigo)
    .filter(({ especificador }) => especificador.startsWith(ALIAS_SRC))
    .filter(
      ({ especificador, soloTipo }) =>
        !SRC_DE_VALOR.test(especificador) && !(soloTipo && SRC_DE_SOLO_TIPO.test(especificador)),
    )
    .map(({ especificador }) => `${ruta}: web/ no puede importar ${especificador}`);
}

function esEstadoPuro(ruta: string): boolean {
  return ruta.startsWith(CARPETA_DE_ESTADO) || NUCLEO_PURO_DEL_ALMACEN.has(ruta);
}

function violacionesDeEstado(ruta: string, codigo: string): string[] {
  if (!esEstadoPuro(ruta)) return [];
  const react = extraerImportacionesConTipo(codigo)
    .filter(({ especificador }) => PAQUETES_DE_REACT.has(nombreDePaquete(especificador)))
    .map(({ especificador }) => `${ruta}: el estado no importa ${especificador}`);
  return [...react, ...lineasQueCumplen(ruta, codigo, API_DEL_NAVEGADOR, "el estado toca el navegador")];
}

function violacionesDeInyeccionHtml(ruta: string, codigo: string): string[] {
  return lineasQueCumplen(ruta, codigo, INYECCION_DE_HTML, "inyecta HTML en lugar de nodos de texto");
}

function violacionesDeEntornoVite(ruta: string, codigo: string): string[] {
  return lineasQueCumplen(ruta, codigo, ENTORNO_DE_VITE, "lee import.meta.env, que termina en el bundle");
}

function violacionesDeAlmacenamiento(ruta: string, codigo: string): string[] {
  const sesion = lineasQueCumplen(ruta, codigo, ALMACEN_DE_SESION, "usa sessionStorage");
  if (ruta === DUENO_DE_ALMACEN_LOCAL) return sesion;
  return [
    ...sesion,
    ...lineasQueCumplen(ruta, codigo, ALMACEN_LOCAL, "usa localStorage fuera de sesion-local"),
  ];
}

function transpilar(ruta: string, codigo: string): string {
  return (ruta.endsWith(".tsx") ? TRANSPILADORES.tsx : TRANSPILADORES.ts).transformSync(codigo);
}

function violacionesDeTexto(ruta: string, codigo: string): string[] {
  if (ruta === DUENO_DE_TEXTO) return [];
  return literalesDeTexto(transpilar(ruta, codigo))
    .filter((literal) => TEXTO_LEGIBLE.test(literal))
    .map((literal) => `${ruta}: texto legible fuera de ${DUENO_DE_TEXTO}: ${literal.trim()}`);
}

function violacionesDeEnum(ruta: string, codigo: string): string[] {
  return lineasQueCumplen(ruta, codigo, ENUM_DE_TS, "declara un enum de TypeScript");
}

function violacionesDeUbicacionDeTipos(ruta: string, codigo: string): string[] {
  if (ARCHIVO_DE_TIPOS_WEB.test(ruta)) return [];
  return lineasQueCumplen(ruta, codigo, EXPORTA_TIPO, "exporta un tipo fuera de web/src/types/*.type.ts");
}

function violacionesDeArchivoDeTipos(ruta: string, codigo: string): string[] {
  if (!ARCHIVO_DE_TIPOS_WEB.test(ruta)) return [];
  return [
    ...lineasQueCumplen(ruta, codigo, VALOR_EN_ARCHIVO_DE_TIPOS, "un archivo de tipos exporta un valor"),
    ...lineasQueCumplen(ruta, codigo, IMPORTA_VALOR, "un archivo de tipos importa sin import type"),
  ];
}

function violacionesDeRegex(ruta: string, codigo: string): string[] {
  if (ruta === DUENO_DE_REGEX) return [];
  return lineasQueCumplen(ruta, codigo, LITERAL_DE_REGEX, "declara una expresión regular fuera de patterns");
}

function violacionesDeEstilos(ruta: string, css: string): string[] {
  return [
    ...lineasQueCumplen(ruta, css, COLOR_SUELTO, "color suelto; usa un var(--token) de tokens.css"),
    ...lineasQueCumplen(ruta, css, LONGITUD_EN_PX, "tamaño en px suelto; usa un var(--token) de tokens.css"),
  ];
}

function violacionesDeUbicacion(ruta: string): string[] {
  return UBICACIONES_WEB.some((patron) => patron.test(ruta))
    ? []
    : [`${ruta}: no está en una carpeta de rol de web/src con su sufijo`];
}

function sobreElCodigo(regla: (ruta: string, codigo: string) => string[]): string[] {
  return listarCodigoWeb().flatMap((ruta) => regla(ruta, leer(ruta)));
}

describe("guardián de web/ sobre el código real", () => {
  test("el escáner encuentra web/src/app.tsx y el resto del front", () => {
    const codigo = listarCodigoWeb();
    expect(codigo).toContain("web/src/app.tsx");
    expect(codigo).toContain("web/src/features/chat/estado/conversacion.ts");
    expect(listarTodoWeb().length).toBeGreaterThanOrEqual(codigo.length);
  });

  test("W1: web/src no usa importaciones relativas", () => {
    expect(sobreElCodigo(violacionesDeImportacionRelativa)).toEqual([]);
  });

  test("W2: web/src solo importa los paquetes react, react-dom y eventsource-parser", () => {
    expect(sobreElCodigo(violacionesDePaquetes)).toEqual([]);
  });

  test("W3: el alias @/ solo llega a la config pura y, con import type, a http/types", () => {
    expect(sobreElCodigo(violacionesDeAliasSrc)).toEqual([]);
  });

  test("W4: el estado de features/*/estado y el núcleo del almacén no importan react ni tocan el navegador", () => {
    const estadoPuro = listarCodigoWeb().filter(esEstadoPuro);
    expect(estadoPuro).toContain("web/src/features/chat/estado/conversacion.ts");
    expect(estadoPuro).toContain("web/src/features/encabezado/estado/salud.ts");
    expect(estadoPuro).toContain("web/src/store/raiz.ts");
    expect(sobreElCodigo(violacionesDeEstado)).toEqual([]);
  });

  test("W5: sin dangerouslySetInnerHTML ni innerHTML", () => {
    expect(sobreElCodigo(violacionesDeInyeccionHtml)).toEqual([]);
  });

  test("W6: sin import.meta.env", () => {
    expect(sobreElCodigo(violacionesDeEntornoVite)).toEqual([]);
  });

  test("W7: sin sessionStorage, y localStorage solo en sesion-local.ts", () => {
    expect(sobreElCodigo(violacionesDeAlmacenamiento)).toEqual([]);
  });

  test("W8: el texto legible, en literales y en JSX, vive solo en web/src/config/strings.ts", () => {
    expect(sobreElCodigo(violacionesDeTexto)).toEqual([]);
  });

  test("W9: sin enum de TypeScript", () => {
    expect(sobreElCodigo(violacionesDeEnum)).toEqual([]);
  });

  test("W10: los tipos exportados viven en web/src/types/*.type.ts, que solo tienen tipos", () => {
    expect(listarCodigoWeb().filter((ruta) => ARCHIVO_DE_TIPOS_WEB.test(ruta)).length).toBeGreaterThan(0);
    expect(sobreElCodigo(violacionesDeUbicacionDeTipos)).toEqual([]);
    expect(sobreElCodigo(violacionesDeArchivoDeTipos)).toEqual([]);
  });

  test("W11: las expresiones regulares viven en patterns.constants.ts", () => {
    expect(sobreElCodigo(violacionesDeRegex)).toEqual([]);
  });

  test("W12: los módulos CSS usan tokens para colores y tamaños", () => {
    expect(listarModulosCss()).toContain("web/src/components/aviso.module.css");
    expect(listarModulosCss().flatMap((ruta) => violacionesDeEstilos(ruta, leer(ruta)))).toEqual([]);
  });

  test("W13: cada archivo de web/src está en su carpeta de rol con su sufijo", () => {
    expect(listarTodoWeb().flatMap(violacionesDeUbicacion)).toEqual([]);
  });
});

describe("el guardián de web/ muerde sobre fuentes de muestra", () => {
  test("W1: reporta importaciones relativas estáticas, de reexportación y dinámicas", () => {
    const comilla = '"';
    const codigo = [
      'import { a } from "./a.ts";',
      'export { b } from "../b.ts";',
      `const c = await import(${comilla}../c.ts${comilla});`,
      'import { d } from "@web/d.ts";',
    ].join("\n");
    expect(violacionesDeImportacionRelativa("web/src/x.ts", codigo)).toEqual([
      "web/src/x.ts: importación relativa ./a.ts",
      "web/src/x.ts: importación relativa ../b.ts",
      "web/src/x.ts: importación relativa ../c.ts",
    ]);
  });

  test("W2: reporta paquetes fuera de react, react-dom y eventsource-parser", () => {
    const codigo = [
      'import { useState } from "react";',
      'import { createRoot } from "react-dom/client";',
      'import { EventSourceParserStream } from "eventsource-parser/stream";',
      'import { marked } from "marked";',
      'import { z } from "zod";',
      'import { f } from "@tests/helpers/f.ts";',
    ].join("\n");
    expect(violacionesDePaquetes("web/src/x.ts", codigo)).toEqual([
      "web/src/x.ts: paquete no permitido en web/ marked",
      "web/src/x.ts: paquete no permitido en web/ zod",
      "web/src/x.ts: paquete no permitido en web/ @tests/helpers/f.ts",
    ]);
  });

  test("W3: reporta el alias @/ hacia strings, loop, infra o un valor de http/types", () => {
    const codigo = [
      'import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";',
      'import type { ValorDe } from "@/config/types/valor-de.type.ts";',
      'import type { SseEvent } from "@/http/types/api.type.ts";',
      'import { MENSAJE_HTTP } from "@/config/strings.ts";',
      'import { ejecutarTurno } from "@/loop/services/ejecutar-turno.service.ts";',
      'import type { Logger } from "@/infra/logging/logger.adapter.ts";',
      'import { type ChatBody } from "@/http/types/api.type.ts";',
    ].join("\n");
    expect(violacionesDeAliasSrc("web/src/x.ts", codigo)).toEqual([
      "web/src/x.ts: web/ no puede importar @/config/strings.ts",
      "web/src/x.ts: web/ no puede importar @/loop/services/ejecutar-turno.service.ts",
      "web/src/x.ts: web/ no puede importar @/infra/logging/logger.adapter.ts",
      "web/src/x.ts: web/ no puede importar @/http/types/api.type.ts",
    ]);
  });

  test("W4: reporta react y las APIs del navegador dentro del estado", () => {
    const codigo = [
      'import { useReducer } from "react";',
      "const raiz = document.body;",
      "const guardado = localStorage.getItem(clave);",
      "const respuesta = await fetch(ruta);",
      "const estado = { sesionId: null };",
    ].join("\n");
    expect(violacionesDeEstado("web/src/features/chat/estado/x.ts", codigo)).toEqual([
      "web/src/features/chat/estado/x.ts: el estado no importa react",
      "web/src/features/chat/estado/x.ts:2: el estado toca el navegador",
      "web/src/features/chat/estado/x.ts:3: el estado toca el navegador",
      "web/src/features/chat/estado/x.ts:4: el estado toca el navegador",
    ]);
    expect(violacionesDeEstado("web/src/api/x.ts", codigo)).toEqual([]);
    expect(violacionesDeEstado("web/src/features/chat/compositor/usar-compositor.ts", codigo)).toEqual([]);
  });

  test("W4: acepta un estado de feature que solo importa la config y los tipos del front", () => {
    const codigo = [
      'import { ACCION_UI } from "@web/config/constants/ui.constants.ts";',
      'import type { AccionUi } from "@web/types/chat.type.ts";',
      "export const esEnviar = (accion: AccionUi) => accion.tipo === ACCION_UI.ENVIAR;",
    ].join("\n");
    expect(violacionesDeEstado("web/src/features/chat/estado/x.ts", codigo)).toEqual([]);
  });

  test("W4: el núcleo puro del almacén tampoco importa react ni toca el navegador", () => {
    const codigo = ['import { useSyncExternalStore } from "react";', "const raiz = window.location;"].join(
      "\n",
    );
    expect(violacionesDeEstado("web/src/store/raiz.ts", codigo)).toEqual([
      "web/src/store/raiz.ts: el estado no importa react",
      "web/src/store/raiz.ts:2: el estado toca el navegador",
    ]);
    expect(violacionesDeEstado("web/src/store/almacen.ts", codigo)).toHaveLength(2);
    expect(violacionesDeEstado("web/src/store/selectores.ts", codigo)).toHaveLength(2);
    expect(violacionesDeEstado("web/src/store/acciones.ts", codigo)).toEqual([]);
    expect(violacionesDeEstado("web/src/store/usar-almacen.ts", codigo)).toEqual([]);
  });

  test("W5: reporta dangerouslySetInnerHTML e innerHTML", () => {
    const codigo = [
      "<div dangerouslySetInnerHTML={{ __html: texto }} />",
      "nodo.innerHTML = texto;",
      "<p>{texto}</p>",
    ].join("\n");
    expect(violacionesDeInyeccionHtml("web/src/x.tsx", codigo)).toEqual([
      "web/src/x.tsx:1: inyecta HTML en lugar de nodos de texto",
      "web/src/x.tsx:2: inyecta HTML en lugar de nodos de texto",
    ]);
  });

  test("W6: reporta import.meta.env", () => {
    const punto = ".";
    const codigo = `const clave = import${punto}meta${punto}env.VITE_CLAVE;\nconst url = import.meta.url;\n`;
    expect(violacionesDeEntornoVite("web/src/x.ts", codigo)).toEqual([
      "web/src/x.ts:1: lee import.meta.env, que termina en el bundle",
    ]);
  });

  test("W7: reporta sessionStorage siempre y localStorage fuera de sesion-local.ts", () => {
    const codigo = 'sessionStorage.setItem("a", b);\nlocalStorage.setItem("c", d);\n';
    expect(violacionesDeAlmacenamiento("web/src/api/x.ts", codigo)).toEqual([
      "web/src/api/x.ts:1: usa sessionStorage",
      "web/src/api/x.ts:2: usa localStorage fuera de sesion-local",
    ]);
    expect(violacionesDeAlmacenamiento(DUENO_DE_ALMACEN_LOCAL, codigo)).toEqual([
      `${DUENO_DE_ALMACEN_LOCAL}:1: usa sessionStorage`,
    ]);
  });

  test("W8: reporta texto legible en literales, en atributos y entre etiquetas JSX", () => {
    const codigo = [
      "export function A({ n }: { readonly n: number }) {",
      '  const titulo = "Caso sin datos";',
      "  return (",
      '    <section aria-label="Lista de casos" className={estilos.lista}>',
      "      Hola mundo {n}",
      "      <p>{TEXTO.vacio}</p>",
      '      <path d="M5 12l5 5L20 7" />',
      "    </section>",
      "  );",
      "}",
    ].join("\n");
    expect(violacionesDeTexto("web/src/components/x.tsx", codigo)).toEqual([
      "web/src/components/x.tsx: texto legible fuera de web/src/config/strings.ts: Caso sin datos",
      "web/src/components/x.tsx: texto legible fuera de web/src/config/strings.ts: Lista de casos",
      "web/src/components/x.tsx: texto legible fuera de web/src/config/strings.ts: Hola mundo",
    ]);
    expect(violacionesDeTexto(DUENO_DE_TEXTO, 'export const A = "Hola mundo";\n')).toEqual([]);
  });

  test("W9: reporta un enum de TypeScript", () => {
    const codigo = ["export ", "enum Estado { Abierto }\n"].join("");
    expect(violacionesDeEnum("web/src/x.ts", codigo)).toEqual([
      "web/src/x.ts:1: declara un enum de TypeScript",
    ]);
  });

  test("W10: reporta tipos exportados fuera de web/src/types y valores dentro", () => {
    const fuera =
      "export type A = string;\nexport interface B { readonly c: string }\ntype Local = number;\n";
    expect(violacionesDeUbicacionDeTipos("web/src/components/x.tsx", fuera)).toEqual([
      "web/src/components/x.tsx:1: exporta un tipo fuera de web/src/types/*.type.ts",
      "web/src/components/x.tsx:2: exporta un tipo fuera de web/src/types/*.type.ts",
    ]);
    expect(violacionesDeUbicacionDeTipos("web/src/types/x.type.ts", fuera)).toEqual([]);
    const dentro =
      'import { ACCION_UI } from "@web/config/constants/ui.constants.ts";\nexport const a = 1;\n';
    expect(violacionesDeArchivoDeTipos("web/src/types/x.type.ts", dentro)).toEqual([
      "web/src/types/x.type.ts:2: un archivo de tipos exporta un valor",
      "web/src/types/x.type.ts:1: un archivo de tipos importa sin import type",
    ]);
  });

  test("W11: reporta literales de regex y new RegExp fuera de patterns", () => {
    const barra = "/";
    const codigo = [
      `const a = ${barra}\\s+${barra}g;`,
      'const b = new RegExp("x");',
      "const c = total / 2 / 3;",
      "return <p>{texto}</p>;",
    ].join("\n");
    expect(violacionesDeRegex("web/src/x.tsx", codigo)).toEqual([
      "web/src/x.tsx:1: declara una expresión regular fuera de patterns",
      "web/src/x.tsx:2: declara una expresión regular fuera de patterns",
    ]);
    expect(violacionesDeRegex(DUENO_DE_REGEX, codigo)).toEqual([]);
  });

  test("W12: reporta colores hex, rgb y longitudes en px dentro de un módulo CSS", () => {
    const css = [
      ".aviso { color: #B42318; }",
      ".borde { border-color: rgb(0 0 0); }",
      ".caja { padding: 16px; }",
      ".bien { color: var(--error-texto); padding: var(--espacio-md); line-height: 1.5; }",
    ].join("\n");
    expect(violacionesDeEstilos("web/src/components/x.module.css", css)).toEqual([
      "web/src/components/x.module.css:1: color suelto; usa un var(--token) de tokens.css",
      "web/src/components/x.module.css:2: color suelto; usa un var(--token) de tokens.css",
      "web/src/components/x.module.css:3: tamaño en px suelto; usa un var(--token) de tokens.css",
    ]);
  });

  test("W13: reporta archivos sueltos o con el sufijo equivocado en web/src", () => {
    const rutas = [
      "web/src/aviso.tsx",
      "web/src/components/Aviso.tsx",
      "web/src/components/aviso.css",
      "web/src/types/chat.ts",
      "web/src/config/ui.ts",
      "web/src/main.tsx",
      "web/src/app.tsx",
      "web/src/components/aviso.tsx",
      "web/src/components/aviso.module.css",
      "web/src/components/icons/iconos.tsx",
      "web/src/styles/tokens.css",
      "web/src/state/conversacion.ts",
      "web/src/config/constants/ui.constants.ts",
      "web/src/store/almacen.ts",
      "web/src/store/usar-almacen.ts",
      "web/src/store/proveedor-almacen.tsx",
      "web/src/store/otra-vista.tsx",
      "web/src/store/Raiz.ts",
      "web/src/features/chat/estado/conversacion.ts",
      "web/src/features/sesion/estado/dialogo-sesion.ts",
      "web/src/features/chat/compositor/compositor.tsx",
      "web/src/features/chat/compositor/usar-compositor.ts",
      "web/src/features/chat/compositor/compositor.module.css",
      "web/src/compartido/aviso/aviso.tsx",
      "web/src/compartido/aviso/aviso.module.css",
      "web/src/features/chat/x.tsx",
      "web/src/features/chat/a/b.tsx",
      "web/src/features/chat/compositor/usar-otro.ts",
      "web/src/features/chat/estado/vista.tsx",
      "web/src/compartido/aviso.tsx",
    ];
    expect(rutas.flatMap(violacionesDeUbicacion)).toEqual([
      "web/src/aviso.tsx: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/components/Aviso.tsx: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/components/aviso.css: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/types/chat.ts: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/config/ui.ts: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/state/conversacion.ts: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/store/otra-vista.tsx: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/store/Raiz.ts: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/features/chat/x.tsx: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/features/chat/a/b.tsx: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/features/chat/compositor/usar-otro.ts: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/features/chat/estado/vista.tsx: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/compartido/aviso.tsx: no está en una carpeta de rol de web/src con su sufijo",
    ]);
  });
});
