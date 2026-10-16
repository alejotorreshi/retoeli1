import { IconoAlerta } from "@web/compartido/iconos/iconos.tsx";
import { TEXTO_DISCO } from "@web/config/strings.ts";
import estilos from "@web/features/archivos/aviso-disco-efimero/aviso-disco-efimero.module.css";
import { controlAvisoDiscoEfimero } from "@web/features/archivos/aviso-disco-efimero/usar-aviso-disco-efimero.ts";
import type { PropsAvisoDiscoEfimero } from "@web/types/ui.type.ts";

export function AvisoDiscoEfimero(props: PropsAvisoDiscoEfimero) {
  const { caso, deshabilitado } = props;
  const { alProcesarDeNuevo } = controlAvisoDiscoEfimero(props);
  return (
    <div className={estilos.aviso} role="status">
      <span className={estilos.icono}>
        <IconoAlerta />
      </span>
      <div className={estilos.cuerpo}>
        <p className={estilos.texto}>{TEXTO_DISCO.aviso}</p>
        <button type="button" className={estilos.chip} disabled={deshabilitado} onClick={alProcesarDeNuevo}>
          {TEXTO_DISCO.chip(caso)}
        </button>
      </div>
    </div>
  );
}
