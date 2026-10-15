import { IconoGirando, IconoReloj } from "@web/components/icons/iconos.tsx";
import estilos from "@web/components/indicador-pensando.module.css";
import { TEXTO_CHAT } from "@web/config/strings.ts";

export function IndicadorPensando() {
  return (
    <div role="status" className={estilos.indicador}>
      <span className={estilos.giro}>
        <IconoGirando />
      </span>
      <span className={estilos.quieto}>
        <IconoReloj />
      </span>
      <span>{TEXTO_CHAT.pensando}</span>
    </div>
  );
}
