import estilos from "@web/components/aviso-disco-efimero.module.css";
import { IconoAlerta } from "@web/components/icons/iconos.tsx";
import { TEXTO_DISCO } from "@web/config/strings.ts";
import type { PropsAvisoDiscoEfimero } from "@web/types/ui.type.ts";

export function AvisoDiscoEfimero({ caso, deshabilitado, alProcesar }: PropsAvisoDiscoEfimero) {
  return (
    <div className={estilos.aviso} role="status">
      <span className={estilos.icono}>
        <IconoAlerta />
      </span>
      <div className={estilos.cuerpo}>
        <p className={estilos.texto}>{TEXTO_DISCO.aviso}</p>
        <button
          type="button"
          className={estilos.chip}
          disabled={deshabilitado}
          onClick={() => alProcesar(TEXTO_DISCO.mensaje(caso))}
        >
          {TEXTO_DISCO.chip(caso)}
        </button>
      </div>
    </div>
  );
}
