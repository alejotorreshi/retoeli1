import type { ValorDe } from "@/config/types/valor-de.type.ts";

export const PREFIJO_HERRAMIENTA = "proveedor_";
export const SESION_POR_DEFECTO = "sin-sesion";

export const HERRAMIENTA = {
  LEER_SOLICITUD: "leer_solicitud",
  MAPEAR_CAMPOS: "mapear_campos",
  GENERAR_FORMULARIO: "generar_formulario",
  ARMAR_PAQUETE: "armar_paquete",
  SIMULAR_ENVIO: "simular_envio",
} as const;

export const ORDEN_FLUJO_HERRAMIENTAS: readonly ValorDe<typeof HERRAMIENTA>[] = [
  HERRAMIENTA.LEER_SOLICITUD,
  HERRAMIENTA.MAPEAR_CAMPOS,
  HERRAMIENTA.GENERAR_FORMULARIO,
  HERRAMIENTA.ARMAR_PAQUETE,
  HERRAMIENTA.SIMULAR_ENVIO,
];
