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
import {
  eventoConfirmacion,
  eventoFin,
  eventoInicio,
  eventosDeHerramienta,
  eventoTexto,
} from "@tests/helpers/red-web.helper.ts";
import type { Importacion } from "@tests/helpers/types/importacion.type.ts";
import { MARCADOR_TITULO } from "@web/config/constants/marca.constants.ts";
import { ACCION_UI, ESTADO_ACCESO, TIPO_CAMPO_CODIGO } from "@web/config/constants/ui.constants.ts";
import { estadoRaizInicial, reducirRaiz } from "@web/store/raiz.ts";
import * as selectores from "@web/store/selectores.ts";
import type { AccionRaiz, EstadoRaiz } from "@web/types/store.type.ts";
import { CODIGO_AGENTE } from "@/config/constants/agent.constants.ts";
import {
  DECISION_CONFIRMACION,
  DESENLACE_ENVIO,
  TIPO_ACCION,
} from "@/config/constants/confirmation.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { TIPO_ARCHIVO_CASO, TIPO_VISTA_PREVIA } from "@/config/constants/files.constants.ts";
import { FORMATO } from "@/config/constants/forms.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import { ESTADO_CAMPO, REGLA_MAPEO } from "@/config/constants/mapping.constants.ts";
import { ESTADO_SOPORTE, ESTADO_VIGENCIA } from "@/config/constants/supports.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import type { SseEvent } from "@/http/types/api.type.ts";
import type { ResultadoVisible } from "@/loop/types/resultado-visible.type.ts";

const RAIZ = join(import.meta.dir, "..");

const CARPETA_WEB = "web/src";

const ALIAS_WEB = "@web/";

const ALIAS_SRC = "@/";

const PAQUETES_WEB: ReadonlySet<string> = new Set(["react", "react-dom", "eventsource-parser"]);

const PAQUETES_DE_REACT: ReadonlySet<string> = new Set(["react", "react-dom"]);

const SRC_DE_VALOR = /^@\/config\/(?:constants|types)\//;

const SRC_DE_SOLO_TIPO = /^@\/http\/types\//;

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

const INDEX_HTML = "web/index.html";

const ETIQUETA_HTML = /<[^>]*>/g;

const DUENO_DE_REGEX = "web/src/config/constants/patterns.constants.ts";

const ARCHIVO_DE_TIPOS_WEB = /^web\/src\/types\/[a-z0-9-]+\.type\.ts$/;

const COLOR_SUELTO = /#[0-9A-Fa-f]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/;

const LONGITUD_EN_PX = /\b\d+(?:\.\d+)?px\b/;

const UNIDAD_SUELTA = /\b\d+(?:\.\d+)?(?:rem|em|dvh|svh|lvh|vh|vw|ms|s|deg)\b/;

const PORCENTAJE_SUELTO = /(?<![\w.])(?!(?:0|50|100)%)\d+(?:\.\d+)?%/;

const REGLA_MEDIA = "@media";

const DUENO_DE_TOKENS = "web/src/styles/tokens.css";

const PREFIJO_SELECTOR = "seleccionar";

const SELECTOR_EN_LINEA = /\buseSeleccion\s*\(\s*(?![A-Za-z_$][\w$]*\s*\))/;

const CASO_DE_MUESTRA = "co-industrias-delta";

const SESION_DE_MUESTRA = "sesion-de-muestra";

const RESULTADO_DE_MUESTRA: ResultadoVisible = {
  herramienta: HERRAMIENTA.ARMAR_PAQUETE,
  pais: "CO",
  formato: null,
  conteo: null,
  listoParaFirma: false,
  bloqueosLegibles: [],
  ruta: `out/${CASO_DE_MUESTRA}/paquete`,
  aviso: null,
};

const KEBAB = "[a-z0-9]+(?:-[a-z0-9]+)*";

const ESTADO_DE_FEATURE = new RegExp(`^web/src/features/${KEBAB}/estado/`);

const VISTA = new RegExp(`^web/src/(?:features/${KEBAB}|compartido)/(${KEBAB})/\\1\\.tsx$`);

const ARCHIVO_EN_CARPETA_DE_COMPONENTE = new RegExp(
  `^(web/src/(?:features/${KEBAB}|compartido)/(${KEBAB}))/([^/]+)$`,
);

const CARPETA_RESERVADA = "estado";

const MODULO_CSS = ".module.css";

const HOOK_DE_COMPONENTE = new RegExp(`^usar-${KEBAB}\\.ts$`);

const COMILLAS: ReadonlySet<string> = new Set(['"', "'", "`"]);

const CARPETA_DE_CONSTANTES = "web/src/config/constants/";

const CODIGO_DEL_FRONT = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

const LITERAL_VACIO = '""';

const LITERAL_CON_TEXTO = '"_"';

const LITERAL_DE_PLANTILLA = "_plantilla_";

const COMPARADOR = "(?:===|!==|==|!=)";

const COMPARACION_TYPEOF = new RegExp(
  [
    `\\btypeof\\s+[\\w$.?\\[\\]]+\\s*${COMPARADOR}\\s*(["'\`])(?:string|number|boolean|object|undefined|function|bigint|symbol)\\1`,
    `(["'\`])(?:string|number|boolean|object|undefined|function|bigint|symbol)\\2\\s*${COMPARADOR}\\s*typeof\\s+[\\w$.?\\[\\]]+`,
  ].join("|"),
  "g",
);

const PROPIEDAD_CONSULTADA = /(["'])[^"'\n]*\1\s+in\b/g;

const LITERAL_COMPARADO = new RegExp(`${COMPARADOR}\\s*"_?"|"_?"\\s*${COMPARADOR}`);

const ETIQUETA_LITERAL = /\bcase\s+"_?"\s*:/;

const RAMA_TERNARIA_LITERAL = /(?<!\?)\?(?![?.])\s*"_"|(?<!\?)\?(?![?.:])[^{}?:]*:\s*"_"/;

const RETORNO_LITERAL = /\breturn\s+"_"\s*;?\s*$/;

const MENSAJE_LITERAL_DE_CODIGO =
  "compara, etiqueta o devuelve un código con un literal; usa su objeto as const";

const MENSAJE_CODIGO_DEL_FRONT = "escribe un código del front como literal; usa su objeto as const";

const MENSAJE_CODIGO_DE_NEGOCIO =
  "copia un código de negocio del servidor; importa su constante de src/config/constants";

const FAMILIAS_DE_NEGOCIO: readonly Readonly<Record<string, string>>[] = [
  ESTADO_CAMPO,
  REGLA_MAPEO,
  ESTADO_SOPORTE,
  ESTADO_VIGENCIA,
  FORMATO,
  TIPO_ARCHIVO_CASO,
  TIPO_VISTA_PREVIA,
  HERRAMIENTA,
  NOMBRE_VISIBLE,
  TIPO_ACCION,
  DECISION_CONFIRMACION,
  DESENLACE_ENVIO,
  ESTADO_LLM,
  CODIGO_ERROR,
  CODIGO_AGENTE,
];

const CODIGOS_DE_NEGOCIO: ReadonlySet<string> = new Set(
  FAMILIAS_DE_NEGOCIO.flatMap((familia) => Object.values(familia)),
);

const NUMERO_MAGICO = /(?<![\w$.])(?!(?:0|1)\b(?!\.))\d+(?:\.\d+)?/;

const ATRIBUTO_STYLE = /\bstyle=/;

const IMPORTACION_DE_REACT = /import\s+(?!type\b)\{([^}]*)\}\s+from\s+["']react["']/g;

const PRIMITIVAS_DEL_ALMACEN: ReadonlySet<string> = new Set([
  "createContext",
  "useContext",
  "useReducer",
  "useSyncExternalStore",
]);

const PRIMITIVAS_PERMITIDAS: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ["web/src/features/disposicion/columnas/usar-columnas.ts", new Set(["useSyncExternalStore"])],
]);

const VISTAS_MIGRADAS: readonly string[] = [
  "web/src/features/sesion/dialogo-nueva-sesion/dialogo-nueva-sesion.tsx",
  "web/src/features/encabezado/encabezado/encabezado.tsx",
  "web/src/features/encabezado/aviso-modelo/aviso-modelo.tsx",
  "web/src/compartido/aviso/aviso.tsx",
  "web/src/features/chat/mensaje/mensaje.tsx",
  "web/src/features/chat/indicador-pensando/indicador-pensando.tsx",
  "web/src/features/herramientas/grupo-herramientas/grupo-herramientas.tsx",
  "web/src/features/herramientas/tarjeta-herramienta/tarjeta-herramienta.tsx",
  "web/src/features/confirmacion/tarjeta-confirmacion/tarjeta-confirmacion.tsx",
  "web/src/features/casos/tarjeta-resultado/tarjeta-resultado.tsx",
  "web/src/features/chat/compositor/compositor.tsx",
  "web/src/features/chat/acciones-rapidas/acciones-rapidas.tsx",
  "web/src/features/chat/linea-de-tiempo/linea-de-tiempo.tsx",
  "web/src/features/chat/estado-vacio/estado-vacio.tsx",
  "web/src/features/casos/panel-casos/panel-casos.tsx",
  "web/src/features/casos/bloque-caso/bloque-caso.tsx",
  "web/src/features/archivos/lista-archivos/lista-archivos.tsx",
  "web/src/features/casos/progreso-caso/progreso-caso.tsx",
  "web/src/features/archivos/aviso-disco-efimero/aviso-disco-efimero.tsx",
  "web/src/features/archivos/dialogo-vista-previa/dialogo-vista-previa.tsx",
  "web/src/features/disposicion/columnas/columnas.tsx",
  "web/src/features/disposicion/barra-pestanas/barra-pestanas.tsx",
  "web/src/features/acceso/pantalla-acceso/pantalla-acceso.tsx",
  "web/src/features/acceso/pantalla-carga/pantalla-carga.tsx",
];

function carpetaDeComponente(raiz: string): RegExp {
  return new RegExp(`^web/src/${raiz}/(${KEBAB})/(?:\\1\\.tsx|usar-\\1\\.ts|\\1\\.module\\.css)$`);
}

const UBICACIONES_WEB: readonly RegExp[] = [
  /^web\/src\/(?:main|app)\.tsx$/,
  /^web\/src\/config\/strings\.ts$/,
  new RegExp(`^web/src/config/constants/${KEBAB}\\.constants\\.ts$`),
  new RegExp(`^web/src/types/${KEBAB}\\.type\\.ts$`),
  new RegExp(`^web/src/api/${KEBAB}\\.ts$`),
  new RegExp(`^web/src/store/${KEBAB}\\.ts$`),
  /^web\/src\/store\/proveedor-almacen\.tsx$/,
  new RegExp(`^web/src/features/${KEBAB}/estado/${KEBAB}\\.ts$`),
  carpetaDeComponente(`features/${KEBAB}`),
  carpetaDeComponente("compartido"),
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

function esFamiliaDeCodigos(valor: unknown): valor is Readonly<Record<string, string>> {
  if (typeof valor !== "object" || valor === null || Object.getPrototypeOf(valor) !== Object.prototype) {
    return false;
  }
  const valores = Object.values(valor);
  return (
    valores.length > 0 &&
    valores.every((miembro) => typeof miembro === "string" && CODIGO_DEL_FRONT.test(miembro))
  );
}

async function codigosDelFront(): Promise<ReadonlySet<string>> {
  const codigos = new Set<string>();
  for (const ruta of escanear(`${CARPETA_DE_CONSTANTES}*.constants.ts`)) {
    const modulo: Record<string, unknown> = await import(join(RAIZ, ruta));
    for (const exportado of Object.values(modulo)) {
      if (esFamiliaDeCodigos(exportado)) for (const valor of Object.values(exportado)) codigos.add(valor);
    }
  }
  return codigos;
}

const CODIGOS_DEL_FRONT = await codigosDelFront();

function listarCodigoWeb(): string[] {
  return normalizar([...escanear(`${CARPETA_WEB}/**/*.ts`), ...escanear(`${CARPETA_WEB}/**/*.tsx`)]);
}

function listarModulosCss(): string[] {
  return escanear(`${CARPETA_WEB}/**/*.module.css`);
}

function listarEstilos(): string[] {
  return escanear(`${CARPETA_WEB}/**/*.css`).filter((ruta) => ruta !== DUENO_DE_TOKENS);
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
  return ESTADO_DE_FEATURE.test(ruta) || NUCLEO_PURO_DEL_ALMACEN.has(ruta);
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

function violacionesDeTextoHtml(ruta: string, html: string): string[] {
  return html
    .replace(ETIQUETA_HTML, "\n")
    .split(MARCADOR_TITULO)
    .join("")
    .split("\n")
    .map((linea) => linea.trim())
    .filter((linea) => TEXTO_LEGIBLE.test(linea))
    .map((linea) => `${ruta}: texto legible fuera de ${DUENO_DE_TEXTO}: ${linea}`);
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

function sinReglasMedia(css: string): string {
  return css
    .split("\n")
    .map((linea) => (linea.trim().startsWith(REGLA_MEDIA) ? "" : linea))
    .join("\n");
}

function violacionesDeEstilos(ruta: string, css: string): string[] {
  if (ruta === DUENO_DE_TOKENS) return [];
  const revisable = sinReglasMedia(css);
  return [
    ...lineasQueCumplen(ruta, revisable, COLOR_SUELTO, "color suelto; usa un var(--token) de tokens.css"),
    ...lineasQueCumplen(
      ruta,
      revisable,
      LONGITUD_EN_PX,
      "tamaño en px suelto; usa un var(--token) de tokens.css",
    ),
    ...lineasQueCumplen(ruta, revisable, UNIDAD_SUELTA, "unidad suelta; usa un var(--token) de tokens.css"),
    ...lineasQueCumplen(
      ruta,
      revisable,
      PORCENTAJE_SUELTO,
      "porcentaje suelto; usa un var(--token) de tokens.css",
    ),
  ].sort(porLinea);
}

function violacionesDeSelectorEnLinea(ruta: string, codigo: string): string[] {
  return lineasQueCumplen(
    ruta,
    codigo,
    SELECTOR_EN_LINEA,
    "useSeleccion recibe una función en línea; usa un selector con nombre de web/src/store/selectores.ts",
  );
}

type Selector = (estado: EstadoRaiz) => unknown;

function esSelector(valor: unknown): valor is Selector {
  return typeof valor === "function";
}

function selectoresDe(modulo: Readonly<Record<string, unknown>>): readonly [string, Selector][] {
  return Object.entries(modulo).flatMap(([nombre, valor]): [string, Selector][] =>
    nombre.startsWith(PREFIJO_SELECTOR) && esSelector(valor) ? [[nombre, valor]] : [],
  );
}

function selectoresInestables(modulo: Readonly<Record<string, unknown>>, estado: EstadoRaiz): string[] {
  return selectoresDe(modulo)
    .filter(([, seleccionar]) => !Object.is(seleccionar(estado), seleccionar(estado)))
    .map(([nombre]) => `${nombre}: devuelve un valor nuevo en cada llamada; memoízalo por referencia`);
}

function eventoDeMuestra(evento: SseEvent): AccionRaiz {
  return { tipo: ACCION_UI.EVENTO, evento };
}

function estadoDeMuestra(): EstadoRaiz {
  const historia: readonly AccionRaiz[] = [
    { tipo: ACCION_UI.ENVIAR, mensaje: CASO_DE_MUESTRA },
    eventoDeMuestra(eventoInicio(SESION_DE_MUESTRA)),
    ...eventosDeHerramienta(
      NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE],
      CASO_DE_MUESTRA,
      RESULTADO_DE_MUESTRA,
    ).map(eventoDeMuestra),
    eventoDeMuestra(eventoConfirmacion(CASO_DE_MUESTRA, [])),
    eventoDeMuestra(eventoTexto(CASO_DE_MUESTRA)),
    eventoDeMuestra(eventoFin(true)),
  ];
  return historia.reduce(reducirRaiz, estadoRaizInicial(null));
}

function carpetaDe(ruta: string): string {
  return ruta.slice(0, ruta.lastIndexOf("/"));
}

function rutaDelAlias(especificador: string): string | null {
  return especificador.startsWith(ALIAS_WEB)
    ? `${CARPETA_WEB}/${especificador.slice(ALIAS_WEB.length)}`
    : null;
}

function archivosPorCarpetaDeComponente(rutas: readonly string[]): Map<string, Set<string>> {
  const carpetas = new Map<string, Set<string>>();
  for (const ruta of rutas) {
    const partes = ARCHIVO_EN_CARPETA_DE_COMPONENTE.exec(ruta);
    const carpeta = partes?.[1];
    const archivo = partes?.[3];
    if (carpeta === undefined || archivo === undefined) continue;
    carpetas.set(carpeta, (carpetas.get(carpeta) ?? new Set<string>()).add(archivo));
  }
  return carpetas;
}

function violacionesDeCarpeta(carpeta: string, archivos: ReadonlySet<string>): string[] {
  const componente = carpeta.slice(carpeta.lastIndexOf("/") + 1);
  const vista = `${componente}.tsx`;
  const conHookOEstilos = archivos.has(`usar-${componente}.ts`) || archivos.has(`${componente}${MODULO_CSS}`);
  if (componente === CARPETA_RESERVADA) {
    return conHookOEstilos || archivos.has(vista)
      ? [`${carpeta}: carpeta de componente con el nombre reservado ${CARPETA_RESERVADA}`]
      : [];
  }
  return conHookOEstilos && !archivos.has(vista)
    ? [`${carpeta}: carpeta de componente sin vista ${vista}`]
    : [];
}

function violacionesDeCarpetasDeComponente(rutas: readonly string[]): string[] {
  return [...archivosPorCarpetaDeComponente(rutas)].flatMap(([carpeta, archivos]) =>
    violacionesDeCarpeta(carpeta, archivos),
  );
}

function esImportacionDeVista(ruta: string, importacion: Importacion): boolean {
  const { especificador, soloTipo } = importacion;
  if (especificador.startsWith(`${ALIAS_WEB}config/`) || especificador.endsWith(MODULO_CSS)) return true;
  if (SRC_DE_VALOR.test(especificador)) return true;
  if (soloTipo) {
    return (
      especificador === "react" ||
      especificador.startsWith(`${ALIAS_WEB}types/`) ||
      SRC_DE_SOLO_TIPO.test(especificador)
    );
  }
  const destino = rutaDelAlias(especificador);
  if (destino === null) return false;
  const componente = carpetaDe(ruta).slice(carpetaDe(ruta).lastIndexOf("/") + 1);
  if (destino === `${carpetaDe(ruta)}/usar-${componente}.ts`) return true;
  return destino !== ruta && VISTA.test(destino);
}

function violacionesDeImportacionesDeVista(ruta: string, codigo: string): string[] {
  if (!VISTA.test(ruta)) return [];
  return extraerImportacionesConTipo(codigo)
    .filter((importacion) => !esImportacionDeVista(ruta, importacion))
    .map(({ especificador }) => `${ruta}: la vista no puede importar ${especificador}`);
}

function violacionesDeEstilosAjenos(ruta: string, codigo: string): string[] {
  const propios = ruta.endsWith(".tsx") ? `${ruta.slice(0, -".tsx".length)}${MODULO_CSS}` : null;
  return extraerImportacionesConTipo(codigo)
    .filter(({ especificador }) => especificador.endsWith(MODULO_CSS))
    .filter(({ especificador }) => propios === null || rutaDelAlias(especificador) !== propios)
    .map(({ especificador }) =>
      propios === null
        ? `${ruta}: un .ts no importa un módulo CSS ${especificador}`
        : `${ruta}: la vista importa estilos ajenos ${especificador}`,
    );
}

function nombreDeArchivo(ruta: string): string {
  return ruta.slice(ruta.lastIndexOf("/") + 1);
}

function puedeImportarLaApi(ruta: string): boolean {
  return (
    ruta.startsWith(`${CARPETA_WEB}/api/`) ||
    ruta.startsWith(`${CARPETA_WEB}/store/`) ||
    HOOK_DE_COMPONENTE.test(nombreDeArchivo(ruta))
  );
}

function violacionesDeApiTransversal(ruta: string, codigo: string): string[] {
  if (puedeImportarLaApi(ruta)) return [];
  return extraerImportacionesConTipo(codigo)
    .filter(({ especificador }) => especificador.startsWith(`${ALIAS_WEB}api/`))
    .map(({ especificador }) => `${ruta}: solo los hooks usar-*.ts y el almacén importan ${especificador}`);
}

function sinCadenas(codigo: string): string {
  let resultado = "";
  let comilla: string | null = null;
  for (let indice = 0; indice < codigo.length; indice += 1) {
    const caracter = codigo.charAt(indice);
    if (comilla === null) {
      if (COMILLAS.has(caracter)) comilla = caracter;
      resultado += caracter;
    } else if (caracter === "\\") {
      indice += 1;
    } else if (caracter === comilla) {
      comilla = null;
      resultado += caracter;
    } else if (caracter === "\n") {
      resultado += caracter;
    }
  }
  return resultado;
}

function violacionesDeValoresMagicos(ruta: string, codigo: string): string[] {
  if (!VISTA.test(ruta)) return [];
  const sinTextos = sinCadenas(codigo);
  return [
    ...lineasQueCumplen(ruta, sinTextos, NUMERO_MAGICO, "número mágico en la vista; va en config/constants"),
    ...lineasQueCumplen(
      ruta,
      sinTextos,
      ATRIBUTO_STYLE,
      "la vista usa style=; los estilos van en su módulo CSS",
    ),
    ...lineasQueCumplen(ruta, codigo, COLOR_SUELTO, "color suelto en la vista; usa un token de tokens.css"),
  ].sort(porLinea);
}

function finDeLiteral(linea: string, inicio: number): number {
  const comilla = linea.charAt(inicio);
  let indice = inicio + 1;
  while (indice < linea.length && linea.charAt(indice) !== comilla) {
    indice += linea.charAt(indice) === "\\" ? 2 : 1;
  }
  return Math.min(indice + 1, linea.length);
}

function conLiteralesNormalizados(linea: string): string {
  let resultado = "";
  let indice = 0;
  while (indice < linea.length) {
    const caracter = linea.charAt(indice);
    if (!COMILLAS.has(caracter)) {
      resultado += caracter;
      indice += 1;
      continue;
    }
    const fin = finDeLiteral(linea, indice);
    const cuerpo = linea.slice(indice + 1, fin - 1);
    if (caracter === "`" && cuerpo.includes("${")) resultado += LITERAL_DE_PLANTILLA;
    else resultado += cuerpo.length === 0 ? LITERAL_VACIO : LITERAL_CON_TEXTO;
    indice = fin;
  }
  return resultado;
}

function sinComprobacionesPermitidas(linea: string): string {
  return linea.replace(COMPARACION_TYPEOF, " ").replace(PROPIEDAD_CONSULTADA, " ");
}

function usaLiteralEnPosicionDeCodigo(linea: string): boolean {
  const normalizada = conLiteralesNormalizados(linea);
  return [LITERAL_COMPARADO, ETIQUETA_LITERAL, RAMA_TERNARIA_LITERAL, RETORNO_LITERAL].some((patron) =>
    patron.test(normalizada),
  );
}

function escribeAlgunCodigo(linea: string, codigos: ReadonlySet<string>): boolean {
  return literalesDeTexto(linea).some((literal) => codigos.has(literal));
}

function violacionesDeLiteralesDeCodigo(ruta: string, codigo: string): string[] {
  if (ruta === DUENO_DE_TEXTO || ruta.startsWith(CARPETA_DE_CONSTANTES)) return [];
  return codigo.split("\n").flatMap((linea, indice) => {
    const permitida = sinComprobacionesPermitidas(linea);
    if (usaLiteralEnPosicionDeCodigo(permitida))
      return [`${ruta}:${indice + 1}: ${MENSAJE_LITERAL_DE_CODIGO}`];
    if (escribeAlgunCodigo(permitida, CODIGOS_DEL_FRONT))
      return [`${ruta}:${indice + 1}: ${MENSAJE_CODIGO_DEL_FRONT}`];
    return [];
  });
}

function violacionesDeCodigosDeNegocio(ruta: string, codigo: string): string[] {
  return codigo
    .split("\n")
    .flatMap((linea, indice) =>
      escribeAlgunCodigo(linea.replace(PROPIEDAD_CONSULTADA, " "), CODIGOS_DE_NEGOCIO)
        ? [`${ruta}:${indice + 1}: ${MENSAJE_CODIGO_DE_NEGOCIO}`]
        : [],
    );
}

function porLinea(a: string, b: string): number {
  return numeroDeLinea(a) - numeroDeLinea(b);
}

function numeroDeLinea(violacion: string): number {
  return Number(violacion.split(":")[1]);
}

function nombresImportadosDeReact(codigo: string): string[] {
  return [...codigo.matchAll(IMPORTACION_DE_REACT)].flatMap((coincidencia) =>
    (coincidencia[1] ?? "")
      .split(",")
      .map((nombre) => nombre.trim())
      .filter((nombre) => nombre.length > 0 && !nombre.startsWith("type "))
      .map((nombre) => nombre.split(/\s+as\s+/)[0] ?? nombre),
  );
}

function violacionesDePrimitivasDelAlmacen(ruta: string, codigo: string): string[] {
  if (ruta.startsWith(`${CARPETA_WEB}/store/`)) return [];
  const permitidas = PRIMITIVAS_PERMITIDAS.get(ruta) ?? new Set<string>();
  return nombresImportadosDeReact(codigo)
    .filter((nombre) => PRIMITIVAS_DEL_ALMACEN.has(nombre) && !permitidas.has(nombre))
    .map((nombre) => `${ruta}: ${nombre} de react solo vive en web/src/store`);
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

  test("W8: web/index.html no escribe texto legible entre etiquetas; el título llega por el marcador", () => {
    const html = leer(INDEX_HTML);
    expect(html).toContain(`<title>${MARCADOR_TITULO}</title>`);
    expect(violacionesDeTextoHtml(INDEX_HTML, html)).toEqual([]);
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

  test("W12: todo CSS de web/src salvo tokens.css usa tokens para colores, tamaños, unidades y porcentajes", () => {
    expect(listarEstilos()).toContain("web/src/compartido/aviso/aviso.module.css");
    expect(listarEstilos()).toContain("web/src/styles/global.css");
    expect(listarEstilos()).not.toContain(DUENO_DE_TOKENS);
    expect(listarEstilos().flatMap((ruta) => violacionesDeEstilos(ruta, leer(ruta)))).toEqual([]);
  });

  test("W13: cada archivo de web/src está en su carpeta de rol con su sufijo", () => {
    expect(listarTodoWeb().flatMap(violacionesDeUbicacion)).toEqual([]);
  });

  test("W14: cada carpeta de componente de features/ y compartido/ tiene su vista", () => {
    const carpetas = [...archivosPorCarpetaDeComponente(listarTodoWeb()).keys()];
    for (const vista of VISTAS_MIGRADAS) expect(carpetas).toContain(carpetaDe(vista));
    expect(violacionesDeCarpetasDeComponente(listarTodoWeb())).toEqual([]);
  });

  test("W15: las vistas solo importan su hook, otras vistas, la config y tipos", () => {
    const vistas = listarCodigoWeb().filter((ruta) => VISTA.test(ruta));
    for (const vista of VISTAS_MIGRADAS) expect(vistas).toContain(vista);
    expect(sobreElCodigo(violacionesDeImportacionesDeVista)).toEqual([]);
  });

  test("W17: cada módulo CSS lo importa solo la vista de su carpeta con el mismo nombre", () => {
    for (const vista of VISTAS_MIGRADAS) {
      expect(listarModulosCss()).toContain(`${vista.slice(0, -".tsx".length)}${MODULO_CSS}`);
    }
    expect(sobreElCodigo(violacionesDeEstilosAjenos)).toEqual([]);
  });
  test("W16: la carpeta api solo la importan los hooks usar-*.ts, el almacén y la propia api", () => {
    const importadores = listarCodigoWeb().filter((ruta) =>
      extraerImportacionesConTipo(leer(ruta)).some(({ especificador }) =>
        especificador.startsWith(`${ALIAS_WEB}api/`),
      ),
    );
    expect(importadores).toContain("web/src/store/dependencias.ts");
    expect(sobreElCodigo(violacionesDeApiTransversal)).toEqual([]);
  });

  test("W18: las vistas no llevan números mágicos, style= ni colores sueltos", () => {
    expect(listarCodigoWeb().filter((ruta) => VISTA.test(ruta)).length).toBeGreaterThan(0);
    expect(sobreElCodigo(violacionesDeValoresMagicos)).toEqual([]);
  });

  test("W22: web/src compara, etiqueta, devuelve y asigna códigos solo con su objeto as const", () => {
    expect(CODIGOS_DEL_FRONT.has(ESTADO_ACCESO.PEDIDO)).toBe(true);
    expect(CODIGOS_DEL_FRONT.has(TIPO_CAMPO_CODIGO.OCULTO)).toBe(true);
    expect(sobreElCodigo(violacionesDeLiteralesDeCodigo)).toEqual([]);
  });

  test("W23: web/src no copia como literal los códigos de negocio de src/config/constants", () => {
    expect(CODIGOS_DE_NEGOCIO.has(ESTADO_CAMPO.FALTANTE)).toBe(true);
    expect(CODIGOS_DE_NEGOCIO.has(HERRAMIENTA.ARMAR_PAQUETE)).toBe(true);
    expect(sobreElCodigo(violacionesDeCodigosDeNegocio)).toEqual([]);
  });

  test("W21: los selectores de web/src/store son estables y useSeleccion solo recibe selectores con nombre", () => {
    const estado = estadoDeMuestra();
    expect(estado.conversacion.turnos).toHaveLength(1);
    expect(estado.conversacion.tarjetasConfirmacion).toHaveLength(1);
    expect(selectoresDe(selectores).length).toBeGreaterThan(0);
    expect(selectoresInestables(selectores, estado)).toEqual([]);
    expect(selectoresInestables(selectores, estadoRaizInicial(null))).toEqual([]);
    expect(sobreElCodigo(violacionesDeSelectorEnLinea)).toEqual([]);
  });

  test("W20: createContext, useContext, useReducer y useSyncExternalStore viven en web/src/store", () => {
    const columnas = "web/src/features/disposicion/columnas/usar-columnas.ts";
    expect(nombresImportadosDeReact(leer(columnas))).toContain("useSyncExternalStore");
    expect(violacionesDePrimitivasDelAlmacen(columnas, leer(columnas))).toEqual([]);
    expect(sobreElCodigo(violacionesDePrimitivasDelAlmacen)).toEqual([]);
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
    expect(violacionesDeTexto("web/src/features/chat/x/x.tsx", codigo)).toEqual([
      "web/src/features/chat/x/x.tsx: texto legible fuera de web/src/config/strings.ts: Caso sin datos",
      "web/src/features/chat/x/x.tsx: texto legible fuera de web/src/config/strings.ts: Lista de casos",
      "web/src/features/chat/x/x.tsx: texto legible fuera de web/src/config/strings.ts: Hola mundo",
    ]);
    expect(violacionesDeTexto(DUENO_DE_TEXTO, 'export const A = "Hola mundo";\n')).toEqual([]);
  });

  test("W8: reporta texto legible escrito a mano en index.html y acepta el marcador del título", () => {
    const conTexto =
      '<head>\n<meta name="viewport" content="width=device-width" />\n<title>Hola mundo</title>\n</head>';
    expect(violacionesDeTextoHtml(INDEX_HTML, conTexto)).toEqual([
      `${INDEX_HTML}: texto legible fuera de ${DUENO_DE_TEXTO}: Hola mundo`,
    ]);
    expect(violacionesDeTextoHtml(INDEX_HTML, `<title>${MARCADOR_TITULO}</title>`)).toEqual([]);
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
    expect(violacionesDeUbicacionDeTipos("web/src/features/chat/x/x.tsx", fuera)).toEqual([
      "web/src/features/chat/x/x.tsx:1: exporta un tipo fuera de web/src/types/*.type.ts",
      "web/src/features/chat/x/x.tsx:2: exporta un tipo fuera de web/src/types/*.type.ts",
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

  test("W12: reporta colores, px, unidades y porcentajes sueltos en cualquier CSS, y salta @media y tokens.css", () => {
    const css = [
      ".aviso { color: #B42318; }",
      ".borde { border-color: rgb(0 0 0); }",
      ".caja { padding: 16px; }",
      ".a { transform: rotate(90deg); }",
      ".b { height: 100dvh; }",
      ".c { transition: x 150ms; }",
      ".d { max-width: 40%; }",
      "@media (min-width: 40em) {",
      ".e { width: 100%; border-radius: 50%; }",
      ".bien { color: var(--error-texto); padding: var(--espacio-md); line-height: 1.5; }",
    ].join("\n");
    const ruta = "web/src/styles/global.css";
    expect(violacionesDeEstilos(ruta, css)).toEqual([
      `${ruta}:1: color suelto; usa un var(--token) de tokens.css`,
      `${ruta}:2: color suelto; usa un var(--token) de tokens.css`,
      `${ruta}:3: tamaño en px suelto; usa un var(--token) de tokens.css`,
      `${ruta}:4: unidad suelta; usa un var(--token) de tokens.css`,
      `${ruta}:5: unidad suelta; usa un var(--token) de tokens.css`,
      `${ruta}:6: unidad suelta; usa un var(--token) de tokens.css`,
      `${ruta}:7: porcentaje suelto; usa un var(--token) de tokens.css`,
    ]);
    expect(violacionesDeEstilos("web/src/features/chat/x/x.module.css", css)).toHaveLength(7);
    expect(violacionesDeEstilos(DUENO_DE_TOKENS, css)).toEqual([]);
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
      "web/src/state/x.ts",
      "web/src/hooks/usar-x.ts",
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
      "web/src/components/aviso.tsx: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/components/aviso.module.css: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/components/icons/iconos.tsx: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/state/x.ts: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/hooks/usar-x.ts: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/store/otra-vista.tsx: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/store/Raiz.ts: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/features/chat/x.tsx: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/features/chat/a/b.tsx: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/features/chat/compositor/usar-otro.ts: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/features/chat/estado/vista.tsx: no está en una carpeta de rol de web/src con su sufijo",
      "web/src/compartido/aviso.tsx: no está en una carpeta de rol de web/src con su sufijo",
    ]);
  });
  test("W14: reporta carpetas de componente sin vista y el nombre reservado estado", () => {
    const rutas = [
      "web/src/features/chat/x/usar-x.ts",
      "web/src/features/chat/y/y.module.css",
      "web/src/features/chat/z/z.tsx",
      "web/src/features/chat/w/w.tsx",
      "web/src/features/chat/w/usar-w.ts",
      "web/src/features/chat/w/w.module.css",
      "web/src/features/chat/estado/conversacion.ts",
      "web/src/features/casos/estado/estado.tsx",
      "web/src/compartido/aviso/aviso.module.css",
    ];
    expect(violacionesDeCarpetasDeComponente(rutas)).toEqual([
      "web/src/features/chat/x: carpeta de componente sin vista x.tsx",
      "web/src/features/chat/y: carpeta de componente sin vista y.tsx",
      "web/src/features/casos/estado: carpeta de componente con el nombre reservado estado",
      "web/src/compartido/aviso: carpeta de componente sin vista aviso.tsx",
    ]);
  });

  test("W15: reporta una vista que importa la red, el almacén, el estado, otro hook o un hook de react", () => {
    const codigo = [
      'import { obtenerConfig } from "@web/api/cliente-api.ts";',
      'import { useSeleccion } from "@web/store/usar-almacen.ts";',
      'import { progresoPorCaso } from "@web/features/casos/estado/casos.ts";',
      'import { useY } from "@web/features/chat/y/usar-y.ts";',
      'import { useState } from "react";',
      'import { useX } from "@web/features/chat/x/usar-x.ts";',
      'import estilos from "@web/features/chat/x/x.module.css";',
      'import { Y } from "@web/features/chat/y/y.tsx";',
      'import { Aviso } from "@web/compartido/aviso/aviso.tsx";',
      'import { IconoAlerta } from "@web/components/icons/iconos.tsx";',
      'import { TEXTO_CHAT } from "@web/config/strings.ts";',
      'import { TONO } from "@web/config/constants/ui.constants.ts";',
      'import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";',
      'import type { PropsX } from "@web/types/ui.type.ts";',
      'import type { ReactNode } from "react";',
      'import type { HealthResponse } from "@/http/types/api.type.ts";',
    ].join("\n");
    const vista = "web/src/features/chat/x/x.tsx";
    expect(violacionesDeImportacionesDeVista(vista, codigo)).toEqual([
      `${vista}: la vista no puede importar @web/api/cliente-api.ts`,
      `${vista}: la vista no puede importar @web/store/usar-almacen.ts`,
      `${vista}: la vista no puede importar @web/features/casos/estado/casos.ts`,
      `${vista}: la vista no puede importar @web/features/chat/y/usar-y.ts`,
      `${vista}: la vista no puede importar react`,
      `${vista}: la vista no puede importar @web/components/icons/iconos.tsx`,
    ]);
    expect(violacionesDeImportacionesDeVista("web/src/features/chat/x/usar-x.ts", codigo)).toEqual([]);
  });

  test("W17: reporta una vista con estilos ajenos y un .ts que importa un módulo CSS", () => {
    const codigo = [
      'import propios from "@web/features/chat/x/x.module.css";',
      'import ajenos from "@web/features/chat/y/y.module.css";',
      'import "@web/styles/global.css";',
    ].join("\n");
    expect(violacionesDeEstilosAjenos("web/src/features/chat/x/x.tsx", codigo)).toEqual([
      "web/src/features/chat/x/x.tsx: la vista importa estilos ajenos @web/features/chat/y/y.module.css",
    ]);
    expect(violacionesDeEstilosAjenos("web/src/features/chat/x/usar-x.ts", codigo)).toEqual([
      "web/src/features/chat/x/usar-x.ts: un .ts no importa un módulo CSS @web/features/chat/x/x.module.css",
      "web/src/features/chat/x/usar-x.ts: un .ts no importa un módulo CSS @web/features/chat/y/y.module.css",
    ]);
  });
  test("W16: reporta la api importada desde un estado de feature o una vista", () => {
    const codigo = 'import { obtenerConfig } from "@web/api/cliente-api.ts";\n';
    expect(violacionesDeApiTransversal("web/src/features/chat/estado/x.ts", codigo)).toEqual([
      "web/src/features/chat/estado/x.ts: solo los hooks usar-*.ts y el almacén importan @web/api/cliente-api.ts",
    ]);
    expect(violacionesDeApiTransversal("web/src/features/chat/x/x.tsx", codigo)).toEqual([
      "web/src/features/chat/x/x.tsx: solo los hooks usar-*.ts y el almacén importan @web/api/cliente-api.ts",
    ]);
    expect(violacionesDeApiTransversal("web/src/components/x.tsx", codigo)).toEqual([
      "web/src/components/x.tsx: solo los hooks usar-*.ts y el almacén importan @web/api/cliente-api.ts",
    ]);
    for (const ruta of [
      "web/src/features/chat/x/usar-x.ts",
      "web/src/store/dependencias.ts",
      "web/src/api/flujo-chat.ts",
    ]) {
      expect(violacionesDeApiTransversal(ruta, codigo)).toEqual([]);
    }
  });

  test("W18: reporta números mágicos, style= y colores en una vista, y acepta una vista limpia", () => {
    const sucia = [
      "export function X() {",
      "  return (",
      "    <svg width={24} style={{ color: tono }}>",
      '      <path fill="#fff" d="M20 6 9 17l-5-5" />',
      "    </svg>",
      "  );",
      "}",
    ].join("\n");
    const vista = "web/src/features/chat/x/x.tsx";
    expect(violacionesDeValoresMagicos(vista, sucia)).toEqual([
      `${vista}:3: número mágico en la vista; va en config/constants`,
      `${vista}:3: la vista usa style=; los estilos van en su módulo CSS`,
      `${vista}:4: color suelto en la vista; usa un token de tokens.css`,
    ]);
    const limpia = [
      "export function X() {",
      "  return (",
      "    <p data-x={0} tabIndex={-1}>",
      "      {TEXTO.a}",
      '      <path d="M20 6 9 17l-5-5" />',
      ["      {`$", "{TEXTO.b} 42`}"].join(""),
      "    </p>",
      "  );",
      "}",
    ].join("\n");
    expect(violacionesDeValoresMagicos(vista, limpia)).toEqual([]);
    expect(violacionesDeValoresMagicos("web/src/features/chat/x/usar-x.ts", sucia)).toEqual([]);
  });

  test("W20: reporta las primitivas del almacén fuera de web/src/store", () => {
    const codigo =
      'import { createContext, useContext, useReducer, useSyncExternalStore, type ReactNode } from "react";\n';
    expect(violacionesDePrimitivasDelAlmacen("web/src/features/chat/x/usar-x.ts", codigo)).toEqual([
      "web/src/features/chat/x/usar-x.ts: createContext de react solo vive en web/src/store",
      "web/src/features/chat/x/usar-x.ts: useContext de react solo vive en web/src/store",
      "web/src/features/chat/x/usar-x.ts: useReducer de react solo vive en web/src/store",
      "web/src/features/chat/x/usar-x.ts: useSyncExternalStore de react solo vive en web/src/store",
    ]);
    expect(violacionesDePrimitivasDelAlmacen("web/src/store/usar-almacen.ts", codigo)).toEqual([]);
    expect(violacionesDePrimitivasDelAlmacen("web/src/hooks/usar-x.ts", codigo)).toHaveLength(4);
    expect(
      violacionesDePrimitivasDelAlmacen("web/src/features/disposicion/columnas/usar-columnas.ts", codigo),
    ).toEqual([
      "web/src/features/disposicion/columnas/usar-columnas.ts: createContext de react solo vive en web/src/store",
      "web/src/features/disposicion/columnas/usar-columnas.ts: useContext de react solo vive en web/src/store",
      "web/src/features/disposicion/columnas/usar-columnas.ts: useReducer de react solo vive en web/src/store",
    ]);
  });

  test("W22: reporta literales en comparaciones, case, ternarios, retornos y códigos del front, y acepta typeof, in y las constantes", () => {
    const ruta = "web/src/features/chat/x/usar-x.ts";
    const codigo = [
      'if (estado.tipo === "verificando") return;',
      'if ("pedido" !== acceso.tipo) return;',
      'switch (pestana) { case "chat": break; }',
      'const clase = activa ? "abierta" : "cerrada";',
      '  return "tenue";',
      'if (codigo === "") return;',
      'despachar({ tipo: "enviar" });',
      'const orden = ["chat", "casos"];',
      'if (typeof valor === "string") return;',
      "if (estado.tipo === ESTADO_ACCESO.VERIFICANDO) return;",
      'if ("ok" in valor) return;',
      "const tipo = visible ? TIPO_CAMPO_CODIGO.VISIBLE : TIPO_CAMPO_CODIGO.OCULTO;",
      ["const id = `$", "{base}-$", "{pestana}`;"].join(""),
      '<button type="button" aria-hidden="true" />',
      '  return "";',
      'const anuncio = llamada === null ? "" : TEXTO_X.anuncio;',
      'const vista = abierta ? { role: "tabpanel" } : {};',
    ].join("\n");
    expect(violacionesDeLiteralesDeCodigo(ruta, codigo)).toEqual([
      `${ruta}:1: ${MENSAJE_LITERAL_DE_CODIGO}`,
      `${ruta}:2: ${MENSAJE_LITERAL_DE_CODIGO}`,
      `${ruta}:3: ${MENSAJE_LITERAL_DE_CODIGO}`,
      `${ruta}:4: ${MENSAJE_LITERAL_DE_CODIGO}`,
      `${ruta}:5: ${MENSAJE_LITERAL_DE_CODIGO}`,
      `${ruta}:6: ${MENSAJE_LITERAL_DE_CODIGO}`,
      `${ruta}:7: ${MENSAJE_CODIGO_DEL_FRONT}`,
      `${ruta}:8: ${MENSAJE_CODIGO_DEL_FRONT}`,
    ]);
    expect(violacionesDeLiteralesDeCodigo("web/src/config/constants/ui.constants.ts", codigo)).toEqual([]);
    expect(violacionesDeLiteralesDeCodigo(DUENO_DE_TEXTO, codigo)).toEqual([]);
  });

  test("W23: reporta un código de negocio copiado en un hook, en config/constants y en strings.ts, y acepta la constante importada", () => {
    const ruta = "web/src/features/casos/x/usar-x.ts";
    const codigo = [
      'if (campo.estado === "faltante") return;',
      'const herramienta = "armar_paquete";',
      'const formato = pdf ? FORMATO.PDF : "xlsx";',
      'const etiqueta = "Faltante";',
      'if ("formulario" in valor) return;',
      "if (campo.estado === ESTADO_CAMPO.FALTANTE) return;",
    ].join("\n");
    expect(violacionesDeCodigosDeNegocio(ruta, codigo)).toEqual([
      `${ruta}:1: ${MENSAJE_CODIGO_DE_NEGOCIO}`,
      `${ruta}:2: ${MENSAJE_CODIGO_DE_NEGOCIO}`,
      `${ruta}:3: ${MENSAJE_CODIGO_DE_NEGOCIO}`,
    ]);
    const constantes = "web/src/config/constants/x.constants.ts";
    expect(
      violacionesDeCodigosDeNegocio(
        constantes,
        'export const ESTADO_CAMPO_COPIA = { FALTANTE: "faltante" } as const;',
      ),
    ).toEqual([`${constantes}:1: ${MENSAJE_CODIGO_DE_NEGOCIO}`]);
    expect(
      violacionesDeCodigosDeNegocio(DUENO_DE_TEXTO, 'export const T = { estado: "requiere_confirmacion" };'),
    ).toEqual([`${DUENO_DE_TEXTO}:1: ${MENSAJE_CODIGO_DE_NEGOCIO}`]);
  });

  test("W21: reporta un selector que crea un valor nuevo en cada llamada y una función en línea en useSeleccion", () => {
    const muestra = {
      seleccionarEstable: (estado: EstadoRaiz) => estado.conversacion.turnos,
      seleccionarSinMemoizar: (estado: EstadoRaiz) => ({ turnos: estado.conversacion.turnos }),
      memoizarPorReferencia: selectores.memoizarPorReferencia,
    };
    expect(selectoresInestables(muestra, estadoDeMuestra())).toEqual([
      "seleccionarSinMemoizar: devuelve un valor nuevo en cada llamada; memoízalo por referencia",
    ]);
    const ruta = "web/src/features/chat/x/usar-x.ts";
    const codigo = [
      "const x = useSeleccion((estado) => estado.x);",
      "const turnos = useSeleccion(seleccionarTurnos);",
      "const y = useSeleccion(",
      "  (estado) => estado.y,",
      ");",
    ].join("\n");
    expect(violacionesDeSelectorEnLinea(ruta, codigo)).toEqual([
      `${ruta}:1: useSeleccion recibe una función en línea; usa un selector con nombre de web/src/store/selectores.ts`,
      `${ruta}:3: useSeleccion recibe una función en línea; usa un selector con nombre de web/src/store/selectores.ts`,
    ]);
  });
});
