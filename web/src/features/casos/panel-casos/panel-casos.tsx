import { TEXTO_PANEL } from "@web/config/strings.ts";
import { BloqueCaso } from "@web/features/casos/bloque-caso/bloque-caso.tsx";
import estilos from "@web/features/casos/panel-casos/panel-casos.module.css";
import { usePanelCasos } from "@web/features/casos/panel-casos/usar-panel-casos.ts";

export function PanelCasos() {
  const { idTitulo, bloques } = usePanelCasos();
  return (
    <aside className={estilos.panel} aria-labelledby={idTitulo}>
      <div className={estilos.contenido}>
        <h2 id={idTitulo} className={estilos.titulo}>
          {TEXTO_PANEL.titulo}
        </h2>
        {bloques.length === 0 ? (
          <p className={estilos.vacio}>{TEXTO_PANEL.vacio}</p>
        ) : (
          <ul className={estilos.casos}>
            {bloques.map((bloque) => (
              <BloqueCaso key={bloque.progreso.caso} {...bloque} />
            ))}
          </ul>
        )}
      </div>
      <p className={estilos.pie}>{TEXTO_PANEL.pie}</p>
    </aside>
  );
}
