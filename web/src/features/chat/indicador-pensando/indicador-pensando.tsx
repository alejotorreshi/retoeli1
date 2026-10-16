import { IconoGirando, IconoReloj } from "@web/compartido/iconos/iconos.tsx";
import { TEXTO_CHAT } from "@web/config/strings.ts";
import estilos from "@web/features/chat/indicador-pensando/indicador-pensando.module.css";
import { useAvisoDespertar } from "@web/features/chat/indicador-pensando/usar-indicador-pensando.ts";
import type { PropsIndicadorPensando } from "@web/types/ui.type.ts";

function AvisoDespertar() {
  const visible = useAvisoDespertar();
  return visible ? <span className={estilos.despertando}>{TEXTO_CHAT.despertando}</span> : null;
}

export function IndicadorPensando({ etiqueta, marca }: PropsIndicadorPensando) {
  return (
    <div role="status" className={estilos.indicador}>
      <span className={estilos.linea}>
        <span className={estilos.giro}>
          <IconoGirando />
        </span>
        <span className={estilos.quieto}>
          <IconoReloj />
        </span>
        <span className={estilos.etiqueta}>{etiqueta}</span>
      </span>
      <AvisoDespertar key={marca} />
    </div>
  );
}
