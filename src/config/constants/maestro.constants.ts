import { VARIABLE_NOTA } from "@/config/constants/mapping.constants.ts";

export const RUTA_MAESTRO = {
  RAZON_SOCIAL: "razon_social",
  CONTACTO_FINANCIERO_NOMBRE: "contacto_financiero.nombre",
  CONTACTO_FINANCIERO_CARGO: "contacto_financiero.cargo",
  INGRESOS_MONEDA: "ingresos_ultimo_ano.moneda",
  INGRESOS_ANO: "ingresos_ultimo_ano.ano",
} as const;

export const PREFIJO_RUTA_BANCARIA = "banco.";

export const RUTAS_BORRADOR = [
  RUTA_MAESTRO.RAZON_SOCIAL,
  RUTA_MAESTRO.CONTACTO_FINANCIERO_NOMBRE,
  RUTA_MAESTRO.CONTACTO_FINANCIERO_CARGO,
] as const;

export const VARIABLES_NOTA_DEL_MAESTRO = [
  [VARIABLE_NOTA.MONEDA, RUTA_MAESTRO.INGRESOS_MONEDA],
  [VARIABLE_NOTA.ANO, RUTA_MAESTRO.INGRESOS_ANO],
] as const;
