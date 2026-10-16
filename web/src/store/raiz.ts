import { estadoAlCargar, reducirConversacion } from "@web/state/conversacion.ts";
import type { AccionRaiz, EstadoRaiz } from "@web/types/store.type.ts";

export function estadoRaizInicial(sesionGuardada: string | null): EstadoRaiz {
  return { conversacion: estadoAlCargar(sesionGuardada) };
}

export function reducirRaiz(estado: EstadoRaiz, accion: AccionRaiz): EstadoRaiz {
  const conversacion = reducirConversacion(estado.conversacion, accion);
  return conversacion === estado.conversacion ? estado : { ...estado, conversacion };
}
