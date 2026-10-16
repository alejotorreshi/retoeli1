import { CLASE_GLOBAL } from "@web/config/constants/ui.constants.ts";
import { TEXTO_CHAT } from "@web/config/strings.ts";
import estilos from "@web/features/chat/mensaje/mensaje.module.css";
import type { PropsMensaje } from "@web/types/ui.type.ts";

export function MensajeUsuaria({ texto }: PropsMensaje) {
  return (
    <li className={`${estilos.burbuja} ${estilos.usuaria}`}>
      <span className={CLASE_GLOBAL.OCULTO}>{TEXTO_CHAT.autorUsuaria}</span>
      {texto}
    </li>
  );
}

export function MensajeAgente({ texto }: PropsMensaje) {
  return (
    <li className={`${estilos.burbuja} ${estilos.agente}`}>
      <span className={CLASE_GLOBAL.OCULTO}>{TEXTO_CHAT.autorAgente}</span>
      {texto}
    </li>
  );
}
