import { IconoAlerta } from "@web/components/icons/iconos.tsx";
import { TAMANO_ICONO, TONO_DEL_MODELO } from "@web/config/constants/ui.constants.ts";
import { TEXTO_MODELO } from "@web/config/strings.ts";
import estilos from "@web/features/encabezado/aviso-modelo/aviso-modelo.module.css";
import { useAvisoModelo } from "@web/features/encabezado/aviso-modelo/usar-aviso-modelo.ts";
import type { PropsCuerpoAvisoModelo } from "@web/types/ui.type.ts";

function CuerpoAvisoModelo({ estado, zona, comprobando, alComprobar }: PropsCuerpoAvisoModelo) {
  const partes = TEXTO_MODELO.aviso(estado, zona);
  return (
    <div className={`${estilos.aviso} ${estilos[TONO_DEL_MODELO[estado]]}`}>
      <span className={estilos.icono}>
        <IconoAlerta tamano={TAMANO_ICONO.GRANDE} />
      </span>
      <div className={estilos.texto}>
        <p className={estilos.titulo}>{partes.titulo}</p>
        <p className={estilos.detalle}>{partes.detalle}</p>
        <button type="button" className={estilos.comprobar} disabled={comprobando} onClick={alComprobar}>
          {comprobando ? TEXTO_MODELO.comprobando : TEXTO_MODELO.comprobar}
        </button>
      </div>
    </div>
  );
}

export function AvisoModelo() {
  const { estado, zona, comprobando, alComprobar } = useAvisoModelo();

  return (
    <div role="status" className={estilos.region}>
      {estado === null ? null : (
        <CuerpoAvisoModelo estado={estado} zona={zona} comprobando={comprobando} alComprobar={alComprobar} />
      )}
    </div>
  );
}
