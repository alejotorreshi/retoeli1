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

export const ARCHIVOS_REPOSITORIO = {
  glosario: "glosario-campos.json",
  maestro: "repositorio/maestro.json",
} as const;

export const SOPORTES_DIR = "repositorio/soportes";
export const INDICE_SOPORTES = "index.json";

export const ARCHIVO_REGLAS = "reglas.json";
export const VERSION_REGLAS = 1;
export const PATRON_PLANTILLA_CONOCIMIENTO: RegExp = /^plantillas\/[a-z-]+\.md$/;
export const PATRON_TEXTO_NO_VACIO: RegExp = /\S/;

export const LIMITES_REGLAS = {
  texto: 500,
  etiqueta: 200,
  identificador: 20,
  elementos: 200,
  diasAvisoMaximo: 365,
} as const;

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

export const PATRON_ARCHIVO_SOPORTE: RegExp = /^[a-z0-9][a-z0-9._-]{0,100}$/;
export const PATRON_RUTA_MAESTRO: RegExp = /^[a-z_]+(\.[a-z_]+)*$/;

export const LIMITES_ARGS = {
  etiqueta: 200,
  elementos: 200,
} as const;

export const LIMITES_FIXTURES = {
  camposPlantilla: 500,
  etiqueta: 200,
  textoMaestro: 2_000,
  textoCorto: 500,
  cuerpo: 20_000,
  adjuntos: 50,
  soportes: 50,
} as const;

export const PATRON_PAIS: RegExp = /^[A-Z]{2}$/;
export const PATRON_FECHA: RegExp = /^\d{4}-\d{2}-\d{2}$/;
export const PATRON_CELDA: RegExp = /^([A-Z]{1,3})([1-9][0-9]{0,6})$/;
export const PATRON_NOMBRE_HOJA: RegExp = /^[^*?:\\/[\]']([^*?:\\/[\]]*[^*?:\\/[\]'])?$/;
export const PATRON_TIPO_SOPORTE: RegExp = /^[a-z0-9_]{1,64}$/;

export const LIMITES_XLSX = {
  nombreHoja: 31,
  columnas: 16_384,
  filas: 1_048_576,
} as const;

export const HOJA_RESERVADA_XLSX = "history";

export const PREFIJO_HERRAMIENTA = "proveedor_";
export const SESION_POR_DEFECTO = "sin-sesion";
export const SESION_DEMO = "demo";
export const MAX_ISSUES_ARGS = 5;
export const ZONA_HORARIA_POR_DEFECTO = "America/Bogota";
export const FECHA_DEMO = "2026-09-03";

export const AUTOR_DOCUMENTOS = "registro-proveedor";

export const MARCAS_XLSX = {
  rellenoFaltante: "FFFFC7CE",
  rellenoPorConfirmar: "FFFFEB9C",
  notaFaltante: "Faltante: no existe en el maestro",
} as const;

export const DISENO_PDF = {
  ancho: 595,
  alto: 842,
  margen: 50,
  anchoEtiqueta: 190,
  separacionColumnas: 15,
  tamanoTexto: 10,
  tamanoTitulo: 12,
  interlineado: 14,
  separacionBloques: 6,
  colores: {
    texto: [0, 0, 0],
    faltante: [0.75, 0, 0],
    por_confirmar: [0.8, 0.5, 0],
  },
} as const;

export const TEXTOS_PDF = {
  titulo: "Formulario de registro como proveedor",
  caso: "Caso: ",
  cliente: "Cliente: ",
  fecha: "Fecha de ejecución: ",
  obligatorio: " *",
  faltante: "[FALTANTE]",
  porConfirmar: "[POR CONFIRMAR]",
  notas: "Notas",
  sinNotas: "Sin observaciones.",
  motivoFaltante: "no existe en el maestro",
  motivoPorConfirmar: "confirmar con el cliente",
  motivoNoRepresentable:
    "el valor tiene caracteres que el PDF no puede mostrar y salen como ?; revisarlo contra el maestro",
  separadorNotas: ". ",
  reemplazo: "?",
} as const;
