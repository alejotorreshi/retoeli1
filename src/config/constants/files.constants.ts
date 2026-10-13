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

export const ARCHIVOS_SALIDA = {
  formularioXlsx: "formulario.xlsx",
  formularioPdf: "formulario.pdf",
  valoresPortal: "valores-portal.md",
  mapeo: "mapeo.json",
  bitacora: "log.jsonl",
  envioSimulado: "ENVIO-SIMULADO.md",
  paquete: "paquete",
  paqueteFormularioXlsx: "paquete/formulario.xlsx",
  paqueteFormularioPdf: "paquete/formulario.pdf",
  paqueteValoresPortal: "paquete/valores-portal.md",
  checklist: "paquete/checklist.md",
  borradorCorreo: "paquete/borrador-correo.md",
} as const;

const PREFIJO_PAQUETE = `${ARCHIVOS_SALIDA.paquete}/`;

export const NOMBRES_RESERVADOS_PAQUETE: ReadonlySet<string> = new Set(
  Object.values(ARCHIVOS_SALIDA)
    .filter((nombre) => nombre.startsWith(PREFIJO_PAQUETE))
    .map((nombre) => nombre.slice(PREFIJO_PAQUETE.length)),
);
