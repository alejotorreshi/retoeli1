import { TEXTO_CHAT } from "@web/config/strings.ts";
import { AccionesRapidas } from "@web/features/chat/acciones-rapidas/acciones-rapidas.tsx";
import estilos from "@web/features/chat/estado-vacio/estado-vacio.module.css";
import { useEstadoVacio } from "@web/features/chat/estado-vacio/usar-estado-vacio.ts";
import { TarjetaCaso } from "@web/features/chat/tarjeta-caso/tarjeta-caso.tsx";

export function EstadoVacio() {
  const { casos } = useEstadoVacio();
  return (
    <div className={estilos.vacio}>
      <h2 className={estilos.vacioTitulo}>{TEXTO_CHAT.vacioTitulo}</h2>
      <p className={estilos.vacioCuerpo}>{TEXTO_CHAT.vacioCuerpo}</p>
      <ul className={estilos.grilla}>
        {casos.map((slug) => (
          <li key={slug}>
            <TarjetaCaso slug={slug} />
          </li>
        ))}
      </ul>
      <div className={estilos.vacioAcciones}>
        <AccionesRapidas compactas={false} angosto={false} />
      </div>
    </div>
  );
}
