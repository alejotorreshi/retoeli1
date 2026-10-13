import type { DECISION_CONFIRMACION } from "@/config/constants/confirmacion.constants.ts";

export type DecisionConfirmacion =
  | { readonly decision: typeof DECISION_CONFIRMACION.CONFIRMA; readonly caso: string }
  | { readonly decision: typeof DECISION_CONFIRMACION.RECHAZA }
  | { readonly decision: typeof DECISION_CONFIRMACION.FALTA_CASO }
  | { readonly decision: typeof DECISION_CONFIRMACION.OTRO };
