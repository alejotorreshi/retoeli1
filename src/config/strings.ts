import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ARCHIVO_PROYECTO, ARCHIVOS_SALIDA, OUT_DIR } from "@/config/constants/files.constants.ts";
import { LONGITUD_MAXIMA_CASO } from "@/config/constants/limits.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { HERRAMIENTA, PREFIJO_HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

function nombreVisible(herramienta: ValorDe<typeof HERRAMIENTA>): string {
  return `${PREFIJO_HERRAMIENTA}${herramienta}`;
}

const PROVEEDOR_MAPEAR_CAMPOS = nombreVisible(HERRAMIENTA.MAPEAR_CAMPOS);

export const MENSAJE_ERROR = {
  [CODIGO_ERROR.CASO_NO_ENCONTRADO]: "No existe un caso con ese identificador.",
  [CODIGO_ERROR.CASO_INVALIDO]: `El identificador del caso no es válido: usa solo minúsculas, dígitos y guiones, con ${LONGITUD_MAXIMA_CASO} caracteres como máximo.`,
  [CODIGO_ERROR.PLANTILLA_INVALIDA]:
    "La plantilla del caso no es válida o no corresponde al formato solicitado.",
  [CODIGO_ERROR.REGLAS_INVALIDAS]: "Las reglas de conocimiento no son válidas.",
  [CODIGO_ERROR.ARGS_INVALIDOS]: "Los argumentos de la herramienta no son válidos.",
  [CODIGO_ERROR.MAPEO_INCONSISTENTE]: `El mapeo recibido no coincide con el mapeo canónico del caso; pasa el resultado completo de ${PROVEEDOR_MAPEAR_CAMPOS}.`,
  [CODIGO_ERROR.CAMPOS_FUERA_DE_PLANTILLA]:
    "Algunas etiquetas pedidas no pertenecen a la plantilla del caso.",
  [CODIGO_ERROR.FORMULARIO_NO_GENERADO]: `Primero genera el formulario del caso con ${nombreVisible(HERRAMIENTA.GENERAR_FORMULARIO)}.`,
  [CODIGO_ERROR.PAQUETE_NO_ARMADO]: `Primero arma el paquete del caso con ${nombreVisible(HERRAMIENTA.ARMAR_PAQUETE)}.`,
  [CODIGO_ERROR.PAQUETE_DESACTUALIZADO]: `Al paquete del caso le faltan o le sobran archivos, o su borrador ya no coincide con el estado vigente de los soportes y los campos; vuelve a armarlo con ${nombreVisible(HERRAMIENTA.ARMAR_PAQUETE)} antes de registrar el envío.`,
  [CODIGO_ERROR.CONFIRMACION_REQUERIDA]: "requiere confirmación explícita",
  [CODIGO_ERROR.ERROR_INTERNO]: "Ocurrió un error interno al ejecutar la herramienta; inténtalo de nuevo.",
  [CODIGO_ERROR.CONFIGURACION_INVALIDA]: "La configuración de la ejecución no es válida.",
  [CODIGO_ERROR.DATOS_INVALIDOS]: "Los datos del caso no son válidos o superan el tamaño permitido.",
} as const satisfies Record<ValorDe<typeof CODIGO_ERROR>, string>;

export const TEXTO_ERROR = {
  conDetalle: (mensaje: string, detalle: string): string => `${mensaje} Detalle: ${detalle}`,
} as const;

const MOTIVO_FALTANTE = "no existe en el maestro";

export const TEXTO_COMUN = {
  separadorNotas: ". ",
  porConfirmar: "confirmar con el cliente",
  celdaVacia: "—",
  raiz: "(raíz)",
} as const;

export const TEXTO_PDF = {
  titulo: "Formulario de registro como proveedor",
  caso: "Caso: ",
  cliente: "Cliente: ",
  fecha: "Fecha de ejecución: ",
  obligatorio: " *",
  faltante: "[FALTANTE]",
  porConfirmar: "[POR CONFIRMAR]",
  notas: "Notas",
  sinNotas: "Sin observaciones.",
  motivoFaltante: MOTIVO_FALTANTE,
  motivoPorConfirmar: TEXTO_COMUN.porConfirmar,
  motivoNoRepresentable:
    "el valor tiene caracteres que el PDF no puede mostrar y salen como ?; revisarlo contra el maestro",
  reemplazo: "?",
} as const;

export const TEXTO_XLSX = {
  notaFaltante: `Faltante: ${MOTIVO_FALTANTE}`,
} as const;

function listaDeBloqueos(bloqueos: readonly string[]): string {
  return bloqueos.join("; ");
}

const ESTADO_PAQUETE = { listo: "LISTO", bloqueado: "BLOQUEADO" } as const;

export const TEXTO_CHECKLIST = {
  sinVigencia: "no aplica",
  estado: ESTADO_PAQUETE,
  bloqueadoPor: (bloqueos: readonly string[]): string =>
    `${ESTADO_PAQUETE.bloqueado} (${listaDeBloqueos(bloqueos)})`,
  bloqueoAusente: (tipo: string): string => `ausente: ${tipo}`,
  bloqueoVencido: (tipo: string, vigencia: string): string => `vencido: ${tipo} (${vigencia})`,
} as const;

export const NOMBRE_SOPORTE = {
  camara_comercio: "Certificado de existencia y representación legal",
  rut: "Registro Único Tributario",
  certificacion_bancaria: "Certificación bancaria",
  parafiscales: "Certificación de aportes parafiscales",
  estados_financieros: "Estados financieros",
  certificado_iso_9001: "Certificado ISO 9001",
  certificado_cumplimiento_tributario: "Certificado de cumplimiento tributario",
} as const satisfies Readonly<Record<string, string>>;

function nombreDeSoporte(tipo: string): string {
  const nombres: Readonly<Record<string, string>> = NOMBRE_SOPORTE;
  return Object.hasOwn(nombres, tipo) ? (nombres[tipo] ?? tipo) : tipo;
}

export const TEXTO_SOPORTE = {
  nombre: nombreDeSoporte,
} as const;

export const TEXTO_BORRADOR = {
  prefijoRespuesta: "RE: ",
  pendienteVencido: (nombre: string): string =>
    `${nombre} (soporte vencido, enviaremos la versión actualizada)`,
} as const;

export const TEXTO_PORTAL = {
  avisoFormatoNoSoportado: "formato no soportado",
  estado: {
    [ESTADO_CAMPO.LLENO]: "lleno",
    [ESTADO_CAMPO.FALTANTE]: "faltante",
    [ESTADO_CAMPO.REQUIERE_CONFIRMACION]: "por confirmar",
  },
} as const;

export const TEXTO_VIGENCIA = {
  venceHoy: "vence hoy",
  venceEnUnDia: "vence en 1 día",
  venceEnDias: (dias: number): string => `vence en ${dias} días`,
} as const;

export const TEXTO_MAPEO = {
  datoNoTextual: "El maestro tiene este dato, pero no como texto: confirmar qué valor escribir",
} as const;

export const TEXTO_MASCARA = {
  punto: "•",
  monto: "[monto oculto]",
  oculto: "[dato oculto]",
} as const;

export const TEXTO_COMPARACION = {
  falta: (etiqueta: string): string => `falta: ${etiqueta}`,
  duplicado: (etiqueta: string): string => `duplicado: ${etiqueta}`,
  rutaDistinta: (etiqueta: string): string => `ruta distinta: ${etiqueta}`,
  estadoDistinto: (etiqueta: string): string => `estado distinto: ${etiqueta}`,
  sobrante: (indice: number): string => `sobrante: #${indice}`,
} as const;

export const TEXTO_MOTOR_PLANTILLAS = {
  etiquetaSinCerrar: "tiene una etiqueta sin cerrar",
  seccionSinCerrar: (nombre: string): string => `tiene una sección sin cerrar o anidada: ${nombre}`,
  variableDesconocida: (nombre: string): string => `usa la variable desconocida ${nombre}`,
  seccionDesconocida: (nombre: string): string => `usa la sección desconocida ${nombre}`,
  plantillaInvalida: (plantilla: string, problema: string): string =>
    `la plantilla ${plantilla} ${problema}.`,
} as const;

export const DESCRIPCION_HERRAMIENTA = {
  [HERRAMIENTA.LEER_SOLICITUD]:
    "Lee la solicitud de un caso y devuelve país, cliente, formato pedido, plantilla, campos en el orden de la plantilla y soportes exigidos.",
  [HERRAMIENTA.MAPEAR_CAMPOS]:
    "Mapea las etiquetas de la plantilla de un caso contra el maestro y devuelve cada campo con su estado, ruta, regla, confianza y valor enmascarado.",
  [HERRAMIENTA.GENERAR_FORMULARIO]: `Genera el formulario del caso en el formato pedido releyendo cada valor del maestro, y su mapeo lleva solo las etiquetas, estados y rutas que devolvió ${PROVEEDOR_MAPEAR_CAMPOS}.`,
  [HERRAMIENTA.ARMAR_PAQUETE]:
    "Arma el paquete para firma de un caso ya generado con el formulario, las copias de los soportes exigidos y el checklist, e indica si queda listo para firma y por qué.",
  [HERRAMIENTA.SIMULAR_ENVIO]: `Registra un envío simulado del paquete armado de un caso escribiendo solo ${ARCHIVOS_SALIDA.ENVIO_SIMULADO} con los bloqueos vigentes, sin enviar ningún correo real, y exige la confirmación explícita de la analista.`,
} as const satisfies Record<ValorDe<typeof HERRAMIENTA>, string>;

export const DESCRIPCION_ARG = {
  caso: "Identificador del caso en minúsculas, dígitos y guiones, por ejemplo co-industrias-delta. Si no existe, la respuesta trae los casos disponibles.",
  etiquetaMapeo: `Etiqueta exacta de la plantilla, tal como la devolvió ${PROVEEDOR_MAPEAR_CAMPOS}.`,
  estadoMapeo: `Estado del campo tal como lo devolvió ${PROVEEDOR_MAPEAR_CAMPOS}.`,
  rutaMapeo: `Ruta del dato en el maestro tal como la devolvió ${PROVEEDOR_MAPEAR_CAMPOS}, o null si el campo es faltante.`,
  etiquetaCampo: "Etiqueta de la plantilla del caso.",
  campos: "Etiquetas de la plantilla que se quieren mapear; una lista vacía mapea todas las etiquetas.",
  mapeo: `Mapeo completo devuelto por ${PROVEEDOR_MAPEAR_CAMPOS}, solo con etiqueta, estado y ruta; nunca incluye valores.`,
  confirmado: "true solo si la analista confirmó de forma explícita el envío en esta conversación.",
} as const;

type ConteoPorEstado = Readonly<Record<ValorDe<typeof ESTADO_CAMPO>, number>>;

function conteo(cuenta: ConteoPorEstado): string {
  return `${cuenta[ESTADO_CAMPO.LLENO]} llenos, ${cuenta[ESTADO_CAMPO.FALTANTE]} faltantes, ${cuenta[ESTADO_CAMPO.REQUIERE_CONFIRMACION]} por confirmar`;
}

export const RESUMEN_HERRAMIENTA = {
  conteo,
  fallo: (herramienta: string, codigo: string): string => `${herramienta}: ${codigo}`,
  solicitud: (caso: string, formato: string, pais: string, campos: number, soportes: number): string =>
    `${caso}: ${formato}, ${pais}, ${campos} campos, ${soportes} soportes exigidos`,
  mapeo: (caso: string, cuenta: ConteoPorEstado): string => `${caso}: ${conteo(cuenta)}`,
  formularioGenerado: (caso: string, formato: string, cuenta: ConteoPorEstado): string =>
    `${caso}: formulario ${formato} generado (${conteo(cuenta)})`,
  valoresGenerados: (caso: string, formato: string, aviso: string, cuenta: ConteoPorEstado): string =>
    `${caso}: valores para ${formato} generados, ${aviso} (${conteo(cuenta)})`,
  paqueteListo: (caso: string): string => `${caso}: ${TEXTO_CHECKLIST.estado.listo}`,
  paqueteBloqueado: (caso: string, bloqueos: readonly string[]): string =>
    `${caso}: ${TEXTO_CHECKLIST.bloqueadoPor(bloqueos)}`,
  envioSinBloqueos: (caso: string): string => `${caso}: envío simulado registrado sin bloqueos`,
  envioConBloqueos: (caso: string, bloqueos: readonly string[]): string =>
    `${caso}: envío simulado registrado con bloqueos (${listaDeBloqueos(bloqueos)})`,
} as const;

export const TEXTO_ENV = {
  formatoFecha: "Debe tener el formato YYYY-MM-DD.",
  fechaInexistente: "La fecha no existe en el calendario.",
  zonaHorariaInvalida: "La zona horaria no es válida.",
} as const;

export const TEXTO_CONOCIMIENTO = {
  rutaNoPermitida: "no tiene una ruta permitida",
  archivoNoLegible: "no existe, no es un archivo o supera el tamaño permitido",
  jsonInvalido: "no es JSON válido",
  esquemaNoCumplido: "no cumple el esquema",
} as const;

export const TEXTO_INFRA = {
  fechaSinFormato: "La fecha no tiene el formato YYYY-MM-DD.",
  salidaFueraDeOut: `La carpeta de salida del caso sale de ${OUT_DIR}/.`,
  paqueteFueraDelCaso: "La carpeta del paquete sale del caso.",
  casoInvalidoParaEscribir: "El caso no es válido para escribir una salida.",
  casoInvalidoParaArmar: "El caso no es válido para armar un paquete.",
  casoInvalidoParaListar: "El caso no es válido para listar un paquete.",
  casoInvalidoParaLeer: "El caso no es válido para leer un archivo del paquete.",
  casoInvalidoParaLimpiar: "El caso no es válido para limpiar salidas.",
  casoInvalidoParaCopiar: "El caso no es válido para copiar al paquete.",
  archivoFueraDeListaBlanca: "El archivo de salida no está en la lista blanca.",
  destinoNoPermitido: "El archivo de destino no está permitido en el paquete.",
  origenNoPermitido: "El origen de la copia no está en los soportes ni en la salida del caso.",
  errorDeBitacora: (nombre: string): string => `bitacora: ${nombre}`,
} as const;

export const TEXTO_DEMO = {
  fechaEfectiva: (fecha: string): string => `Fecha de ejecución efectiva: ${fecha}`,
  encabezadoCaso: (caso: string): string => `== ${caso} ==`,
  error: (caso: string, codigo: string, mensaje: string): string =>
    `Error en ${caso} (${codigo}): ${mensaje}`,
  estadoError: (codigo: string): string => `ERROR (${codigo})`,
  formato: (formato: string, aviso: string | null): string =>
    aviso === null ? `Formato: ${formato}` : `Formato: ${formato} (${aviso})`,
  salida: (ruta: string): string => `Salida: ${ruta}`,
  campos: (llenos: string, faltantes: string, porConfirmar: string): string =>
    `Campos: ${llenos} llenos · ${faltantes} faltantes · ${porConfirmar} por confirmar`,
  soportes: (ausentes: string, vencidos: string): string =>
    `Soportes ausentes: ${ausentes} · Vencidos: ${vencidos}`,
  estado: (estado: string): string => `Estado: ${estado}`,
  envio: (mensaje: string): string => `Envío: ${mensaje} (no se envía nada)`,
  sinCasos: (mensaje: string): string => `No se pudieron listar los casos: ${mensaje}`,
  fueraDeLaRaiz: `La demo debe correr en la raíz del proyecto, donde está ${ARCHIVO_PROYECTO}; no se borra nada.`,
  resumen: "Resumen",
  columnasResumen: ["Caso", "Formato", "Llenos", "Faltantes", "Por confirmar", "Estado"],
  ninguno: "ninguno",
  separadorTipos: ", ",
} as const;
