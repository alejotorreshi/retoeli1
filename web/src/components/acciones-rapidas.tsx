import estilos from "@web/components/acciones-rapidas.module.css";
import { TEXTO_ACCIONES } from "@web/config/strings.ts";
import type { PropsAccionesRapidas } from "@web/types/ui.type.ts";

export function AccionesRapidas({ casos, deshabilitadas, compactas, alEnviar }: PropsAccionesRapidas) {
  const grupo = (
    <fieldset aria-label={TEXTO_ACCIONES.grupo} className={estilos.grupo}>
      <button
        type="button"
        className={estilos.chip}
        disabled={deshabilitadas}
        onClick={() => alEnviar(TEXTO_ACCIONES.mensajeDemo)}
      >
        {TEXTO_ACCIONES.demo}
      </button>
      <button
        type="button"
        className={estilos.chip}
        disabled={deshabilitadas || casos.length === 0}
        onClick={() => alEnviar(TEXTO_ACCIONES.mensajeTodos(casos))}
      >
        {TEXTO_ACCIONES.todos(casos.length)}
      </button>
      <button
        type="button"
        className={estilos.chip}
        disabled={deshabilitadas}
        onClick={() => alEnviar(TEXTO_ACCIONES.mensajeListar)}
      >
        {TEXTO_ACCIONES.listar}
      </button>
    </fieldset>
  );
  return compactas ? <div className={estilos.franja}>{grupo}</div> : grupo;
}
