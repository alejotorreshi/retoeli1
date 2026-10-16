import { TEXTO_CHAT } from "@web/config/strings.ts";
import { AccionesRapidas } from "@web/features/chat/acciones-rapidas/acciones-rapidas.tsx";
import estilos from "@web/features/chat/estado-vacio/estado-vacio.module.css";

export function EstadoVacio() {
  return (
    <div className={estilos.vacio}>
      <h2 className={estilos.vacioTitulo}>{TEXTO_CHAT.vacioTitulo}</h2>
      <p className={estilos.vacioCuerpo}>{TEXTO_CHAT.vacioCuerpo}</p>
      <div className={estilos.vacioAcciones}>
        <AccionesRapidas compactas={false} angosto={false} />
      </div>
    </div>
  );
}
