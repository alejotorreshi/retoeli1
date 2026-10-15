import estilos from "@web/components/aviso.module.css";
import { IconoAlerta, IconoInfo } from "@web/components/icons/iconos.tsx";
import { TAMANO_ICONO } from "@web/config/constants/ui.constants.ts";
import type { PropsAviso } from "@web/types/ui.type.ts";

function CuerpoAviso({ mensaje, acciones }: PropsAviso) {
  return (
    <div className={estilos.cuerpo}>
      <p className={estilos.texto}>{mensaje}</p>
      {acciones === undefined ? null : <div className={estilos.acciones}>{acciones}</div>}
    </div>
  );
}

export function AvisoError({ mensaje, acciones }: PropsAviso) {
  return (
    <div role="alert" className={`${estilos.aviso} ${estilos.error}`}>
      <span className={estilos.icono}>
        <IconoAlerta tamano={TAMANO_ICONO.GRANDE} />
      </span>
      <CuerpoAviso mensaje={mensaje} acciones={acciones} />
    </div>
  );
}

export function AvisoSistema({ mensaje, acciones }: PropsAviso) {
  return (
    <div role="status" className={`${estilos.aviso} ${estilos.sistema}`}>
      <span className={estilos.icono}>
        <IconoInfo tamano={TAMANO_ICONO.GRANDE} />
      </span>
      <CuerpoAviso mensaje={mensaje} acciones={acciones} />
    </div>
  );
}
