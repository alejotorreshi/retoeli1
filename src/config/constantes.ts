export const FIXTURES_DIR = "reto-01/fixtures/reto-01";
export const CASOS_DIR = "casos";
export const OUT_DIR = "out";

export const LONGITUD_MAXIMA_CASO = 64;
export const PATRON_CASO: RegExp = new RegExp(`^[a-z0-9-]{1,${LONGITUD_MAXIMA_CASO}}$`);
export const LIMITE_LECTURA_BYTES = 1_048_576;

export const ARCHIVOS_CASO = {
  solicitud: "solicitud.json",
  plantillaCeldas: "plantilla-celdas.json",
  plantillaCampos: "plantilla-campos.json",
  soportesExigidos: "soportes-exigidos.json",
} as const;

export const ARCHIVOS_SALIDA = {
  formularioXlsx: "formulario.xlsx",
  formularioPdf: "formulario.pdf",
  valoresPortal: "valores-portal.md",
  mapeo: "mapeo.json",
  bitacora: "log.jsonl",
  envioSimulado: "ENVIO-SIMULADO.md",
  paquete: "paquete",
  checklist: "paquete/checklist.md",
  borradorCorreo: "paquete/borrador-correo.md",
} as const;

export const PATRON_ARCHIVO_SOPORTE: RegExp = /^[a-z0-9][a-z0-9._-]{0,100}$/;
export const PATRON_RUTA_MAESTRO: RegExp = /^[a-z_]+(\.[a-z_]+)*$/;

export const LIMITES_ARGS = {
  etiqueta: 200,
  elementos: 200,
} as const;

export const LIMITES_FIXTURES = {
  camposPlantilla: 500,
  etiqueta: 200,
  textoCorto: 500,
  cuerpo: 20_000,
  adjuntos: 50,
  soportes: 50,
} as const;

export const PATRON_PAIS: RegExp = /^[A-Z]{2}$/;
export const PATRON_FECHA: RegExp = /^\d{4}-\d{2}-\d{2}$/;
export const PATRON_CELDA: RegExp = /^[A-Z]{1,3}[1-9][0-9]{0,6}$/;
export const PATRON_TIPO_SOPORTE: RegExp = /^[a-z0-9_]{1,64}$/;

export const FORMATOS = ["xlsx", "pdf", "portal"] as const;
export const ESTADOS_CAMPO = ["lleno", "faltante", "requiere_confirmacion"] as const;

export const PREFIJO_HERRAMIENTA = "proveedor_";
export const SESION_POR_DEFECTO = "sin-sesion";
export const MAX_ISSUES_ARGS = 5;
export const ZONA_HORARIA_POR_DEFECTO = "America/Bogota";
export const FECHA_DEMO = "2026-09-03";
