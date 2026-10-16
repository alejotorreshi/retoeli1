import { IconoGirando, IconoReloj } from "@web/compartido/iconos/iconos.tsx";
import estilos from "@web/components/indicador-pensando.module.css";
import { ESPERA_DESPERTAR_MS } from "@web/config/constants/ui.constants.ts";
import { TEXTO_CHAT } from "@web/config/strings.ts";
import type { PropsIndicadorPensando } from "@web/types/ui.type.ts";
import { useEffect, useState } from "react";

function AvisoDespertar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const espera = setTimeout(() => setVisible(true), ESPERA_DESPERTAR_MS);
    return () => clearTimeout(espera);
  }, []);

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
