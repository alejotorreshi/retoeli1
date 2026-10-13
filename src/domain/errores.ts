import type { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
export type CodigoError = ValorDe<typeof CODIGO_ERROR>;

export const MENSAJES_ERROR: Readonly<Record<CodigoError, string>> = {
  CASO_NO_ENCONTRADO: "No existe un caso con ese identificador.",
  CASO_INVALIDO:
    "El identificador del caso no es válido: usa solo minúsculas, dígitos y guiones, con 64 caracteres como máximo.",
  PLANTILLA_INVALIDA: "La plantilla del caso no es válida o no corresponde al formato solicitado.",
  REGLAS_INVALIDAS: "Las reglas de conocimiento no son válidas.",
  ARGS_INVALIDOS: "Los argumentos de la herramienta no son válidos.",
  MAPEO_INCONSISTENTE:
    "El mapeo recibido no coincide con el mapeo canónico del caso; pasa el resultado completo de mapear_campos.",
  CAMPOS_FUERA_DE_PLANTILLA: "Algunas etiquetas pedidas no pertenecen a la plantilla del caso.",
  FORMULARIO_NO_GENERADO: "Primero genera el formulario del caso con generar_formulario.",
  PAQUETE_NO_ARMADO: "Primero arma el paquete del caso con armar_paquete.",
  CONFIRMACION_REQUERIDA: "requiere confirmación explícita",
  ERROR_INTERNO: "Ocurrió un error interno al ejecutar la herramienta; inténtalo de nuevo.",
  CONFIGURACION_INVALIDA: "La configuración de la ejecución no es válida.",
  DATOS_INVALIDOS: "Los datos del caso no son válidos o superan el tamaño permitido.",
};
