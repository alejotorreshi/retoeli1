import { TEXTO_ACCIONES } from "@web/config/strings.ts";
import estilos from "@web/features/chat/acciones-rapidas/acciones-rapidas.module.css";
import { useAccionesRapidas } from "@web/features/chat/acciones-rapidas/usar-acciones-rapidas.ts";
import type { PropsAccionesRapidas } from "@web/types/ui.type.ts";

export function AccionesRapidas({ compactas, angosto }: PropsAccionesRapidas) {
  const { corta, deshabilitadas, cantidadCasos, alPedirDemo, alPedirTodos, alPedirListado } =
    useAccionesRapidas({ compactas, angosto });
  const grupo = (
    <fieldset aria-label={TEXTO_ACCIONES.grupo} className={estilos.grupo}>
      <button
        type="button"
        className={estilos.chip}
        disabled={deshabilitadas}
        aria-label={corta ? TEXTO_ACCIONES.demo : undefined}
        onClick={alPedirDemo}
      >
        {corta ? TEXTO_ACCIONES.demoCorto : TEXTO_ACCIONES.demo}
      </button>
      <button
        type="button"
        className={estilos.chip}
        disabled={deshabilitadas || cantidadCasos === 0}
        aria-label={corta ? TEXTO_ACCIONES.todos(cantidadCasos) : undefined}
        onClick={alPedirTodos}
      >
        {corta ? TEXTO_ACCIONES.todosCorto(cantidadCasos) : TEXTO_ACCIONES.todos(cantidadCasos)}
      </button>
      <button type="button" className={estilos.chip} disabled={deshabilitadas} onClick={alPedirListado}>
        {TEXTO_ACCIONES.listar}
      </button>
    </fieldset>
  );
  return compactas ? <div className={estilos.franja}>{grupo}</div> : grupo;
}
