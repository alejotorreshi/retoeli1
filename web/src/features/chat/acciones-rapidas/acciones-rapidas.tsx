import { TEXTO_ACCIONES } from "@web/config/strings.ts";
import estilos from "@web/features/chat/acciones-rapidas/acciones-rapidas.module.css";
import { useAccionesRapidas } from "@web/features/chat/acciones-rapidas/usar-acciones-rapidas.ts";
import type { PropsAccionesRapidas } from "@web/types/ui.type.ts";

export function AccionesRapidas({ compactas, angosto }: PropsAccionesRapidas) {
  const { deshabilitadas, todosDeshabilitado, demo, todos, alPedirDemo, alPedirTodos, alPedirListado } =
    useAccionesRapidas({ compactas, angosto });
  const grupo = (
    <fieldset aria-label={TEXTO_ACCIONES.grupo} className={estilos.grupo}>
      <button
        type="button"
        className={estilos.chip}
        disabled={deshabilitadas}
        aria-label={demo.etiqueta}
        onClick={alPedirDemo}
      >
        {demo.texto}
      </button>
      <button
        type="button"
        className={estilos.chip}
        disabled={todosDeshabilitado}
        aria-label={todos.etiqueta}
        onClick={alPedirTodos}
      >
        {todos.texto}
      </button>
      <button type="button" className={estilos.chip} disabled={deshabilitadas} onClick={alPedirListado}>
        {TEXTO_ACCIONES.listar}
      </button>
    </fieldset>
  );
  return compactas ? <div className={estilos.franja}>{grupo}</div> : grupo;
}
