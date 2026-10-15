import estilos from "@web/components/aviso-modelo.module.css";
import { IconoAlerta } from "@web/components/icons/iconos.tsx";
import { TAMANO_ICONO, TONO_DEL_MODELO } from "@web/config/constants/ui.constants.ts";
import { TEXTO_MODELO } from "@web/config/strings.ts";
import type { PropsAvisoModelo, PropsCuerpoAvisoModelo } from "@web/types/ui.type.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";

function CuerpoAvisoModelo({ estado, zona }: PropsCuerpoAvisoModelo) {
  const partes = TEXTO_MODELO.aviso(estado, zona);
  return (
    <div className={`${estilos.aviso} ${estilos[TONO_DEL_MODELO[estado]]}`}>
      <span className={estilos.icono}>
        <IconoAlerta tamano={TAMANO_ICONO.GRANDE} />
      </span>
      <p className={estilos.texto}>
        {partes.texto}
        {partes.comando === null ? null : <code className={estilos.comando}>{partes.comando}</code>}
        {partes.cierre}
      </p>
    </div>
  );
}

export function AvisoModelo({ estado, zona }: PropsAvisoModelo) {
  return (
    <div role="status" className={estilos.region}>
      {estado === null || estado === ESTADO_LLM.DISPONIBLE ? null : (
        <CuerpoAvisoModelo estado={estado} zona={zona} />
      )}
    </div>
  );
}
