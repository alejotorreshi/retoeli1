import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { LONGITUD_MAXIMA_CASO } from "@/config/constants/limits.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export const MENSAJE_ERROR = {
  [CODIGO_ERROR.CASO_NO_ENCONTRADO]: "No existe un caso con ese identificador.",
  [CODIGO_ERROR.CASO_INVALIDO]: `El identificador del caso no es válido: usa solo minúsculas, dígitos y guiones, con ${LONGITUD_MAXIMA_CASO} caracteres como máximo.`,
  [CODIGO_ERROR.PLANTILLA_INVALIDA]:
    "La plantilla del caso no es válida o no corresponde al formato solicitado.",
  [CODIGO_ERROR.REGLAS_INVALIDAS]: "Las reglas de conocimiento no son válidas.",
  [CODIGO_ERROR.ARGS_INVALIDOS]: "Los argumentos de la herramienta no son válidos.",
  [CODIGO_ERROR.MAPEO_INCONSISTENTE]:
    "El mapeo recibido no coincide con el mapeo canónico del caso; pasa el resultado completo de mapear_campos.",
  [CODIGO_ERROR.CAMPOS_FUERA_DE_PLANTILLA]:
    "Algunas etiquetas pedidas no pertenecen a la plantilla del caso.",
  [CODIGO_ERROR.FORMULARIO_NO_GENERADO]: "Primero genera el formulario del caso con generar_formulario.",
  [CODIGO_ERROR.PAQUETE_NO_ARMADO]: "Primero arma el paquete del caso con armar_paquete.",
  [CODIGO_ERROR.CONFIRMACION_REQUERIDA]: "requiere confirmación explícita",
  [CODIGO_ERROR.ERROR_INTERNO]: "Ocurrió un error interno al ejecutar la herramienta; inténtalo de nuevo.",
  [CODIGO_ERROR.CONFIGURACION_INVALIDA]: "La configuración de la ejecución no es válida.",
  [CODIGO_ERROR.DATOS_INVALIDOS]: "Los datos del caso no son válidos o superan el tamaño permitido.",
} as const satisfies Record<ValorDe<typeof CODIGO_ERROR>, string>;

export const TEXTO_ERROR = {
  conDetalle: (mensaje: string, detalle: string): string => `${mensaje} Detalle: ${detalle}`,
} as const;
