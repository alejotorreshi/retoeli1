import { ACCIONES_DE_DIALOGO_SESION, ACCIONES_DE_SALUD } from "@web/config/constants/ui.constants.ts";
import { estadoAlCargar, reducirConversacion } from "@web/features/chat/estado/conversacion.ts";
import { estadoSaludInicial, reducirSalud } from "@web/features/encabezado/estado/salud.ts";
import {
  estadoDialogoSesionInicial,
  reducirDialogoSesion,
} from "@web/features/sesion/estado/dialogo-sesion.ts";
import type { AccionDialogoSesion, AccionRaiz, AccionSalud, EstadoRaiz } from "@web/types/store.type.ts";

export function estadoRaizInicial(sesionGuardada: string | null): EstadoRaiz {
  return {
    conversacion: estadoAlCargar(sesionGuardada),
    salud: estadoSaludInicial,
    dialogoSesion: estadoDialogoSesionInicial,
  };
}

function esAccionDeSalud(accion: AccionRaiz): accion is AccionSalud {
  return ACCIONES_DE_SALUD.has(accion.tipo);
}

function esAccionDeDialogoSesion(accion: AccionRaiz): accion is AccionDialogoSesion {
  return ACCIONES_DE_DIALOGO_SESION.has(accion.tipo);
}

function conSlice<K extends keyof EstadoRaiz>(
  estado: EstadoRaiz,
  clave: K,
  slice: EstadoRaiz[K],
): EstadoRaiz {
  return Object.is(estado[clave], slice) ? estado : { ...estado, [clave]: slice };
}

export function reducirRaiz(estado: EstadoRaiz, accion: AccionRaiz): EstadoRaiz {
  if (esAccionDeSalud(accion)) return conSlice(estado, "salud", reducirSalud(estado.salud, accion));
  if (esAccionDeDialogoSesion(accion)) {
    return conSlice(estado, "dialogoSesion", reducirDialogoSesion(estado.dialogoSesion, accion));
  }
  return conSlice(estado, "conversacion", reducirConversacion(estado.conversacion, accion));
}
