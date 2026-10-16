import { CLASE_GLOBAL } from "@web/config/constants/ui.constants.ts";
import { TEXTO_PESTANAS } from "@web/config/strings.ts";
import estilos from "@web/features/disposicion/barra-pestanas/barra-pestanas.module.css";
import { useBarraPestanas } from "@web/features/disposicion/barra-pestanas/usar-barra-pestanas.ts";
import type { PropsBarraPestanas } from "@web/types/ui.type.ts";

export function BarraPestanas(props: PropsBarraPestanas) {
  const { pestanas, alTeclear } = useBarraPestanas(props);

  return (
    <div role="tablist" aria-label={TEXTO_PESTANAS.grupo} className={estilos.pestanas} onKeyDown={alTeclear}>
      {pestanas.map(({ pestana, id, idVista, elegida, conPunto, registrar, alElegir }) => (
        <button
          key={pestana}
          ref={registrar}
          type="button"
          role="tab"
          id={id}
          aria-selected={elegida}
          aria-controls={idVista}
          tabIndex={elegida ? 0 : -1}
          className={estilos.pestana}
          onClick={alElegir}
        >
          {TEXTO_PESTANAS.etiqueta(pestana)}
          {conPunto ? (
            <>
              <span className={estilos.puntoCambios} aria-hidden="true" />
              <span className={CLASE_GLOBAL.OCULTO}>{TEXTO_PESTANAS.cambiosSinVer}</span>
            </>
          ) : null}
        </button>
      ))}
    </div>
  );
}
