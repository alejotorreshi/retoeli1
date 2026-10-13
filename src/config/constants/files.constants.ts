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

export const ARCHIVO_PROYECTO = "package.json";

export const ARCHIVO_BITACORA = "log.jsonl";

export const DIRECTORIO_PAQUETE = "paquete";

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

export const ARCHIVO_PLANTILLA = {
  [TIPO_PLANTILLA.CELDAS]: ARCHIVOS_CASO.plantillaCeldas,
  [TIPO_PLANTILLA.CAMPOS]: ARCHIVOS_CASO.plantillaCampos,
} as const;
