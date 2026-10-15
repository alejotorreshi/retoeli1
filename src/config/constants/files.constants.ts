import { FORMATO, TIPO_PLANTILLA } from "@/config/constants/forms.constants.ts";

export const FIXTURES_DIR = "reto-01/fixtures/reto-01";
export const CASOS_DIR = "casos";
export const OUT_DIR = "out";

export const ARCHIVOS_CASO = {
  solicitud: "solicitud.json",
  plantillaCeldas: "plantilla-celdas.json",
  plantillaCampos: "plantilla-campos.json",
  soportesExigidos: "soportes-exigidos.json",
} as const;

export const ARCHIVOS_REPOSITORIO = {
  glosario: "glosario-campos.json",
  maestro: "repositorio/maestro.json",
} as const;

export const SOPORTES_DIR = "repositorio/soportes";
export const INDICE_SOPORTES = "index.json";

export const ARCHIVO_REGLAS = "reglas.json";

export const DIRECTORIO_AGENTE = "agent";
export const ARCHIVO_PROMPT = "prompt.md";
export const ARCHIVO_CONOCIMIENTO_PROCESO = "registro-proveedor.md";

export const ARCHIVO_PROYECTO = "package.json";

export const ARCHIVO_BITACORA = "log.jsonl";

export const DIRECTORIO_PAQUETE = "paquete";

export const PREFIJO_PAQUETE = `${DIRECTORIO_PAQUETE}/`;

export const ARCHIVOS_SALIDA = {
  MAPEO: "mapeo.json",
  FORMULARIO_XLSX: "formulario.xlsx",
  FORMULARIO_PDF: "formulario.pdf",
  VALORES_PORTAL: "valores-portal.md",
  ENVIO_SIMULADO: "ENVIO-SIMULADO.md",
} as const;

export const ARCHIVOS_PAQUETE = {
  CHECKLIST: "checklist.md",
  BORRADOR_CORREO: "borrador-correo.md",
} as const;

export const ARCHIVOS_SISTEMA_IGNORADOS: ReadonlySet<string> = new Set([
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini",
]);

export const ARCHIVO_FORMULARIO = {
  [FORMATO.XLSX]: ARCHIVOS_SALIDA.FORMULARIO_XLSX,
  [FORMATO.PDF]: ARCHIVOS_SALIDA.FORMULARIO_PDF,
  [FORMATO.PORTAL]: ARCHIVOS_SALIDA.VALORES_PORTAL,
} as const;

export const ARCHIVOS_REGENERABLES = [
  ARCHIVOS_SALIDA.FORMULARIO_XLSX,
  ARCHIVOS_SALIDA.FORMULARIO_PDF,
  ARCHIVOS_SALIDA.VALORES_PORTAL,
  ARCHIVOS_SALIDA.ENVIO_SIMULADO,
] as const;

export const NOMBRES_RESERVADOS_PAQUETE: ReadonlySet<string> = new Set([
  ...Object.values(ARCHIVOS_PAQUETE),
  ...Object.values(ARCHIVO_FORMULARIO),
]);

export const TIPO_ARCHIVO_CASO = {
  FORMULARIO: "formulario",
  VALORES_PORTAL: "valores_portal",
  CHECKLIST: "checklist",
  BORRADOR: "borrador",
  ENVIO_SIMULADO: "envio_simulado",
  SOPORTE: "soporte",
} as const;

export const TIPO_VISTA_PREVIA = {
  TABLA: "tabla",
  TEXTO: "texto",
} as const;

export const RESULTADO_VISTA_PREVIA = {
  LISTA: "lista",
  NO_ENCONTRADO: "no_encontrado",
  NO_DISPONIBLE: "no_disponible",
} as const;

export const SEPARADOR_EXTENSION = ".";

export const TIPO_CONTENIDO_POR_EXTENSION: Readonly<Record<string, string>> = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
  md: "text/markdown; charset=utf-8",
  txt: "text/plain; charset=utf-8",
};

export const TIPO_CONTENIDO_BINARIO = "application/octet-stream";

export const ARCHIVO_PLANTILLA = {
  [TIPO_PLANTILLA.CELDAS]: ARCHIVOS_CASO.plantillaCeldas,
  [TIPO_PLANTILLA.CAMPOS]: ARCHIVOS_CASO.plantillaCampos,
} as const;
