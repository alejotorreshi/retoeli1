import { CODIGO_AGENTE } from "@/config/constants/agent.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ARCHIVO_PROYECTO, ARCHIVOS_SALIDA, OUT_DIR } from "@/config/constants/files.constants.ts";
import { LONGITUD_MAXIMA_CASO } from "@/config/constants/limits.constants.ts";
import { ESQUEMA_LOOPBACK, ESQUEMA_SEGURO, HOSTS_LOOPBACK } from "@/config/constants/llm.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { SALTO_DE_LINEA } from "@/config/constants/text.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export const MENSAJE_ERROR = {
  [CODIGO_ERROR.CASO_NO_ENCONTRADO]: "No existe un caso con ese identificador.",
  [CODIGO_ERROR.CASO_INVALIDO]: `El identificador del caso no es válido: usa solo minúsculas, dígitos y guiones, con ${LONGITUD_MAXIMA_CASO} caracteres como máximo.`,
  [CODIGO_ERROR.PLANTILLA_INVALIDA]:
    "La plantilla del caso no es válida o no corresponde al formato solicitado.",
  [CODIGO_ERROR.REGLAS_INVALIDAS]: "Las reglas de conocimiento no son válidas.",
  [CODIGO_ERROR.ARGS_INVALIDOS]: "Los argumentos de la herramienta no son válidos.",
  [CODIGO_ERROR.MAPEO_INCONSISTENTE]: `El mapeo recibido no coincide con el mapeo canónico del caso; pasa el resultado completo de ${NOMBRE_VISIBLE[HERRAMIENTA.MAPEAR_CAMPOS]}.`,
  [CODIGO_ERROR.CAMPOS_FUERA_DE_PLANTILLA]:
    "Algunas etiquetas pedidas no pertenecen a la plantilla del caso.",
  [CODIGO_ERROR.FORMULARIO_NO_GENERADO]: `Primero genera el formulario del caso con ${NOMBRE_VISIBLE[HERRAMIENTA.GENERAR_FORMULARIO]}.`,
  [CODIGO_ERROR.PAQUETE_NO_ARMADO]: `Primero arma el paquete del caso con ${NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE]}.`,
  [CODIGO_ERROR.PAQUETE_DESACTUALIZADO]: `Al paquete del caso le faltan o le sobran archivos, o su borrador ya no coincide con el estado vigente de los soportes y los campos; vuelve a armarlo con ${NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE]} antes de registrar el envío.`,
  [CODIGO_ERROR.CONFIRMACION_REQUERIDA]: "requiere confirmación explícita",
  [CODIGO_ERROR.ERROR_INTERNO]: "Ocurrió un error interno al ejecutar la herramienta; inténtalo de nuevo.",
  [CODIGO_ERROR.CONFIGURACION_INVALIDA]: "La configuración de la ejecución no es válida.",
  [CODIGO_ERROR.DATOS_INVALIDOS]: "Los datos del caso no son válidos o superan el tamaño permitido.",
} as const satisfies Record<ValorDe<typeof CODIGO_ERROR>, string>;

const FIN_DE_ORACION = ".";

function conDetalle(mensaje: string, detalle: string): string {
  return `${mensaje} Detalle: ${detalle}`;
}

export const TEXTO_ERROR = {
  conDetalle,
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
  [HERRAMIENTA.GENERAR_FORMULARIO]: `Genera el formulario del caso en el formato pedido releyendo cada valor del maestro, y su mapeo lleva solo las etiquetas, estados y rutas que devolvió ${NOMBRE_VISIBLE[HERRAMIENTA.MAPEAR_CAMPOS]}.`,
  [HERRAMIENTA.ARMAR_PAQUETE]:
    "Arma el paquete para firma de un caso ya generado con el formulario, las copias de los soportes exigidos y el checklist, e indica si queda listo para firma y por qué.",
  [HERRAMIENTA.SIMULAR_ENVIO]: `Registra un envío simulado del paquete armado de un caso escribiendo solo ${ARCHIVOS_SALIDA.ENVIO_SIMULADO} con los bloqueos vigentes, sin enviar ningún correo real, y exige la confirmación explícita de la analista.`,
} as const satisfies Record<ValorDe<typeof HERRAMIENTA>, string>;

export const DESCRIPCION_ARG = {
  caso: "Identificador del caso en minúsculas, dígitos y guiones, por ejemplo co-industrias-delta. Si no existe, la respuesta trae los casos disponibles.",
  etiquetaMapeo: `Etiqueta exacta de la plantilla, tal como la devolvió ${NOMBRE_VISIBLE[HERRAMIENTA.MAPEAR_CAMPOS]}.`,
  estadoMapeo: `Estado del campo tal como lo devolvió ${NOMBRE_VISIBLE[HERRAMIENTA.MAPEAR_CAMPOS]}.`,
  rutaMapeo: `Ruta del dato en el maestro tal como la devolvió ${NOMBRE_VISIBLE[HERRAMIENTA.MAPEAR_CAMPOS]}, o null si el campo es faltante.`,
  etiquetaCampo: "Etiqueta de la plantilla del caso.",
  campos: "Etiquetas de la plantilla que se quieren mapear; una lista vacía mapea todas las etiquetas.",
  mapeo: `Mapeo completo devuelto por ${NOMBRE_VISIBLE[HERRAMIENTA.MAPEAR_CAMPOS]}, solo con etiqueta, estado y ruta; nunca incluye valores.`,
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

const VINETA = "- ";

function vinetas(lineas: readonly string[]): string {
  return lineas.map((linea) => `${VINETA}${linea}`).join(SALTO_DE_LINEA);
}

type CasoPorConfirmar = { readonly caso: string; readonly bloqueos: readonly string[] };

function estadoPorConfirmar({ caso, bloqueos }: CasoPorConfirmar): string {
  const estado = bloqueos.length === 0 ? ESTADO_PAQUETE.listo : TEXTO_CHECKLIST.bloqueadoPor(bloqueos);
  return `${caso}: ${estado}`;
}

export const EJEMPLOS_CONFIRMACION = ["envía", "sí"] as const;

const MARCADOR_CASO = "<caso>";
const SIN_CONFIRMACION_NO_ENVIA = "si la respuesta no es una confirmación explícita, no se envía";

function confirmacionExplicita(ejemplos: readonly string[]): string {
  return `responde con una confirmación explícita, como ${ejemplos.map((ejemplo) => `"${ejemplo}"`).join(" o ")}`;
}

const CONFIRMA_UN_CASO = confirmacionExplicita(EJEMPLOS_CONFIRMACION);
const CONFIRMA_VARIOS_CASOS = confirmacionExplicita([`${EJEMPLOS_CONFIRMACION[0]} ${MARCADOR_CASO}`]);

function cierrePregunta(caso: string): string {
  return `${CONFIRMA_UN_CASO}; ${SIN_CONFIRMACION_NO_ENVIA} nada. ¿Confirmas el envío simulado de ${caso}?`;
}

export const TEXTO_CONFIRMACION = {
  unCaso: (caso: string, bloqueos: readonly string[]): string =>
    bloqueos.length === 0
      ? `El paquete de ${caso} queda ${ESTADO_PAQUETE.listo} para firma. Para registrar el envío simulado ${cierrePregunta(caso)}`
      : `El paquete de ${caso} queda ${ESTADO_PAQUETE.bloqueado}: ${listaDeBloqueos(bloqueos)}. Para registrar el envío simulado con esos bloqueos ${cierrePregunta(caso)}`,
  variosCasos: (casos: readonly CasoPorConfirmar[]): string =>
    [
      "Quedaron armados estos paquetes:",
      vinetas(casos.map(estadoPorConfirmar)),
      `Cada confirmación registra un solo envío simulado. Para registrar uno ${CONFIRMA_VARIOS_CASOS}, con el caso que quieres registrar; ${SIN_CONFIRMACION_NO_ENVIA} ninguno.`,
      "¿Cuál caso confirmas para el envío simulado?",
    ].join(SALTO_DE_LINEA),
} as const;

const SIGUIENTE_PASO = {
  [HERRAMIENTA.LEER_SOLICITUD]: (caso: string): string =>
    `leer la solicitud de ${caso} con ${NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD]}`,
  [HERRAMIENTA.MAPEAR_CAMPOS]: (caso: string): string =>
    `mapear los campos de ${caso} con ${NOMBRE_VISIBLE[HERRAMIENTA.MAPEAR_CAMPOS]}`,
  [HERRAMIENTA.GENERAR_FORMULARIO]: (caso: string): string =>
    `generar el formulario de ${caso} con ${NOMBRE_VISIBLE[HERRAMIENTA.GENERAR_FORMULARIO]}`,
  [HERRAMIENTA.ARMAR_PAQUETE]: (caso: string): string =>
    `armar el paquete de ${caso} con ${NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE]}`,
  [HERRAMIENTA.SIMULAR_ENVIO]: (caso: string): string =>
    `confirmar el envío simulado de ${caso}: ${CONFIRMA_UN_CASO}, para registrarlo; ${SIN_CONFIRMACION_NO_ENVIA} nada`,
} as const satisfies Record<ValorDe<typeof HERRAMIENTA>, (caso: string) => string>;

export const TEXTO_CIERRE = {
  completado: (resumenes: readonly string[]): string => `Completé:${SALTO_DE_LINEA}${vinetas(resumenes)}`,
  falta: (pasos: readonly string[]): string => `Falta:${SALTO_DE_LINEA}${vinetas(pasos)}`,
  sinPasos: "No alcancé a completar ningún paso en este turno. Escríbeme de nuevo para continuar.",
  siguientePaso: SIGUIENTE_PASO,
  instruccionTope:
    "Llegaste al tope de pasos de este turno. Sin llamar herramientas, resume en texto plano lo que se completó y lo que falta según los resultados anteriores.",
} as const;

const SESION_SIGUE_ABIERTA = "La sesión sigue abierta; puedes volver a intentarlo.";

function conSesionAbierta(mensaje: string): string {
  return `${mensaje} ${SESION_SIGUE_ABIERTA}`;
}

const HERRAMIENTAS_DISPONIBLES = Object.values(NOMBRE_VISIBLE).join(", ");

export const MENSAJE_AGENTE = {
  [CODIGO_AGENTE.INSTRUCCIONES_NO_DISPONIBLES]: conSesionAbierta(
    "No pude cargar las instrucciones del agente, así que no procesé el mensaje.",
  ),
  [CODIGO_AGENTE.HERRAMIENTA_DESCONOCIDA]: `La herramienta pedida no existe. Las herramientas disponibles son ${HERRAMIENTAS_DISPONIBLES}.`,
  [CODIGO_AGENTE.ARGUMENTOS_TRUNCADOS]:
    "La respuesta del modelo se cortó antes de completar los argumentos de la herramienta, así que no se ejecutó; vuelve a pedirla.",
  [CODIGO_AGENTE.SESION_OCUPADA]:
    "Esta sesión todavía está procesando el mensaje anterior. Espera la respuesta y vuelve a escribir.",
  [CODIGO_AGENTE.PRESUPUESTO_AGOTADO]:
    "Esta sesión agotó su presupuesto de tokens. Abre una sesión nueva para continuar.",
  [CODIGO_AGENTE.TURNO_INTERRUMPIDO]: "El turno se interrumpió antes de terminar.",
  [CODIGO_AGENTE.TIEMPO_TURNO_AGOTADO]: conSesionAbierta("El turno tardó más de lo permitido y se detuvo."),
  [CODIGO_AGENTE.PROVEEDOR_SIN_CLAVE]: conSesionAbierta(
    "El proveedor del modelo no tiene una clave configurada en el servidor.",
  ),
  [CODIGO_AGENTE.CONFIGURACION_LLM_INVALIDA]: "La configuración del proveedor del modelo no es válida.",
  [CODIGO_AGENTE.PROVEEDOR_PETICION_INVALIDA]: conSesionAbierta(
    "El proveedor del modelo rechazó la solicitud.",
  ),
  [CODIGO_AGENTE.PROVEEDOR_AUTENTICACION]: conSesionAbierta(
    "La clave del proveedor del modelo no es válida o no tiene permiso.",
  ),
  [CODIGO_AGENTE.PROVEEDOR_SALDO_AGOTADO]: conSesionAbierta(
    "Saldo agotado en el proveedor del modelo: hay que recargar la cuenta antes de seguir.",
  ),
  [CODIGO_AGENTE.PROVEEDOR_LIMITE_TASA]: conSesionAbierta(
    "El proveedor del modelo está limitando las solicitudes por exceso de uso.",
  ),
  [CODIGO_AGENTE.PROVEEDOR_NO_DISPONIBLE]: conSesionAbierta(
    "El proveedor del modelo no está disponible en este momento.",
  ),
  [CODIGO_AGENTE.PROVEEDOR_SIN_CONEXION]: conSesionAbierta("No hay conexión con el proveedor del modelo."),
  [CODIGO_AGENTE.PROVEEDOR_TIMEOUT]: conSesionAbierta("El modelo tardó demasiado en responder."),
  [CODIGO_AGENTE.PROVEEDOR_RESPUESTA_INVALIDA]: conSesionAbierta(
    "El proveedor del modelo devolvió una respuesta que no se pudo leer.",
  ),
  [CODIGO_AGENTE.PROVEEDOR_FILTRO_CONTENIDO]: conSesionAbierta(
    "El proveedor del modelo filtró la respuesta por su política de contenido.",
  ),
} as const satisfies Record<ValorDe<typeof CODIGO_AGENTE>, string>;

export const TEXTO_ENV = {
  formatoFecha: "Debe tener el formato YYYY-MM-DD.",
  fechaInexistente: "La fecha no existe en el calendario.",
  zonaHorariaInvalida: "La zona horaria no es válida.",
  urlInvalida: "La URL del proveedor no es válida.",
  urlNoSegura: `La URL del proveedor debe usar ${ESQUEMA_SEGURO}; solo estos hosts locales admiten también ${ESQUEMA_LOOPBACK}: ${[...HOSTS_LOOPBACK].join(", ")}.`,
  urlRequerida:
    "Falta la URL del proveedor: es obligatoria cuando el proveedor no tiene valores por defecto.",
  modeloRequerido: "Falta el modelo: es obligatorio cuando el proveedor no tiene valores por defecto.",
} as const;

export const TEXTO_CONTEXTO = {
  fecha: (fecha: string): string => `Contexto de la sesión: la fecha de ejecución efectiva es ${fecha}.`,
} as const;

export const TEXTO_SESION = {
  expirada: "La sesión anterior expiró; empezamos de cero.",
} as const;

function cerrarOracion(texto: string): string {
  const recortado = texto.trimEnd();
  return recortado.endsWith(FIN_DE_ORACION) ? recortado : `${recortado}${FIN_DE_ORACION}`;
}

export const TEXTO_AGENTE = {
  conDetalle: (mensaje: string, detalle: string): string => cerrarOracion(conDetalle(mensaje, detalle)),
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
  archivoNoPropio:
    "El archivo es un enlace, comparte enlaces duros, no es un archivo regular o supera el límite de lectura.",
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
