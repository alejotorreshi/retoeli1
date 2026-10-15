import { ESPERA_LIBERAR_DESCARGA_MS } from "@web/config/constants/ui.constants.ts";

export function guardarEnElEquipo(cuerpo: Blob, nombre: string): void {
  const direccion = URL.createObjectURL(cuerpo);
  const enlace = document.createElement("a");
  enlace.href = direccion;
  enlace.download = nombre;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(direccion), ESPERA_LIBERAR_DESCARGA_MS);
}
