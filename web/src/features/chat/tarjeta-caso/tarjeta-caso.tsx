import { IconoChevron } from "@web/compartido/iconos/iconos.tsx";
import { TEXTO_APP, TEXTO_TARJETA_CASO } from "@web/config/strings.ts";
import estilos from "@web/features/chat/tarjeta-caso/tarjeta-caso.module.css";
import { useTarjetaCaso } from "@web/features/chat/tarjeta-caso/usar-tarjeta-caso.ts";
import type { PropsTarjetaCaso } from "@web/types/ui.type.ts";

export function TarjetaCaso({ slug }: PropsTarjetaCaso) {
  const { cliente, pais, etiqueta, deshabilitada, alProcesar } = useTarjetaCaso(slug);
  return (
    <button
      type="button"
      className={estilos.tarjeta}
      aria-label={etiqueta}
      disabled={deshabilitada}
      onClick={alProcesar}
    >
      {pais === null ? null : (
        <span className={estilos.pildora} aria-hidden="true">
          {pais.codigo}
        </span>
      )}
      <span className={estilos.cliente}>{cliente}</span>
      {pais === null ? null : (
        <span className={estilos.detalle}>
          <span className={estilos.pais}>{pais.nombre}</span>
          <span className={estilos.separador} aria-hidden="true">
            {TEXTO_APP.separador}
          </span>
          <span className={estilos.slug}>{slug}</span>
        </span>
      )}
      <span className={estilos.accion}>
        <span className={estilos.textoAccion}>{TEXTO_TARJETA_CASO.procesar}</span>
        <span className={estilos.chevron}>
          <IconoChevron />
        </span>
      </span>
    </button>
  );
}
