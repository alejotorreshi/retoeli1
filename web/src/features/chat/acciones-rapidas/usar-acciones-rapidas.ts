import { TEXTO_ACCIONES } from "@web/config/strings.ts";
import { seleccionarCasos, seleccionarEnvioDeshabilitado } from "@web/store/selectores.ts";
import { useAcciones, useSeleccion } from "@web/store/usar-almacen.ts";
import type { ControlAccionesRapidas, PropsAccionesRapidas, TextosDeChip } from "@web/types/ui.type.ts";

function textosDeChip(corta: boolean, completo: string, corto: string): TextosDeChip {
  return corta ? { texto: corto, etiqueta: completo } : { texto: completo, etiqueta: undefined };
}

export function useAccionesRapidas({ compactas, angosto }: PropsAccionesRapidas): ControlAccionesRapidas {
  const casos = useSeleccion(seleccionarCasos);
  const deshabilitadas = useSeleccion(seleccionarEnvioDeshabilitado);
  const { enviarTexto } = useAcciones();
  const corta = compactas && angosto;
  return {
    deshabilitadas,
    todosDeshabilitado: deshabilitadas || casos.length === 0,
    demo: textosDeChip(corta, TEXTO_ACCIONES.demo, TEXTO_ACCIONES.demoCorto),
    todos: textosDeChip(corta, TEXTO_ACCIONES.todos(casos.length), TEXTO_ACCIONES.todosCorto(casos.length)),
    alPedirDemo: () => enviarTexto(TEXTO_ACCIONES.mensajeDemo),
    alPedirTodos: () => enviarTexto(TEXTO_ACCIONES.mensajeTodos(casos)),
    alPedirListado: () => enviarTexto(TEXTO_ACCIONES.mensajeListar),
  };
}
