import { obtenerConfig, obtenerSalud, obtenerSesionAsentada } from "@web/api/cliente-api.ts";
import { enviarTurno } from "@web/api/flujo-chat.ts";
import { guardarSesionId, leerSesionGuardada, olvidarSesion } from "@web/api/sesion-local.ts";
import type { Dependencias } from "@web/types/store.type.ts";

export const dependenciasReales = {
  enviarTurno,
  obtenerConfig,
  obtenerSalud,
  obtenerSesionAsentada,
  leerSesionGuardada,
  guardarSesionId,
  olvidarSesion,
} satisfies Dependencias;
