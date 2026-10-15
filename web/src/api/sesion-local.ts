import { CLAVE_SESION_LOCAL } from "@web/config/constants/ui.constants.ts";

export function leerSesionGuardada(): string | null {
  try {
    const guardada = localStorage.getItem(CLAVE_SESION_LOCAL);
    return guardada === null || guardada.trim().length === 0 ? null : guardada;
  } catch {
    return null;
  }
}

export function guardarSesionId(sesionId: string): void {
  try {
    localStorage.setItem(CLAVE_SESION_LOCAL, sesionId);
  } catch {
    return;
  }
}

export function olvidarSesion(): void {
  try {
    localStorage.removeItem(CLAVE_SESION_LOCAL);
  } catch {
    return;
  }
}
