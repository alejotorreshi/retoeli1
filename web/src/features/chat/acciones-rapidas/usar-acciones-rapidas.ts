import { TEXTO_ACCIONES } from "@web/config/strings.ts";
import { seleccionarCasos, seleccionarEnvioDeshabilitado } from "@web/store/selectores.ts";
import { useAcciones, useSeleccion } from "@web/store/usar-almacen.ts";
import type { ControlAccionesRapidas, PropsAccionesRapidas } from "@web/types/ui.type.ts";

export function useAccionesRapidas({ compactas, angosto }: PropsAccionesRapidas): ControlAccionesRapidas {
  const casos = useSeleccion(seleccionarCasos);
  const deshabilitadas = useSeleccion(seleccionarEnvioDeshabilitado);
  const { enviarTexto } = useAcciones();
  return {
    corta: compactas && angosto,
    deshabilitadas,
    cantidadCasos: casos.length,
    alPedirDemo: () => enviarTexto(TEXTO_ACCIONES.mensajeDemo),
    alPedirTodos: () => enviarTexto(TEXTO_ACCIONES.mensajeTodos(casos)),
    alPedirListado: () => enviarTexto(TEXTO_ACCIONES.mensajeListar),
  };
}
