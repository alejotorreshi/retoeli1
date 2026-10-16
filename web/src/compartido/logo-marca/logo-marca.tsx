import estilos from "@web/compartido/logo-marca/logo-marca.module.css";
import { ALTO_LOGO, ANCHO_LOGO, RUTA_LOGO, VARIANTE_LOGO } from "@web/config/constants/marca.constants.ts";
import { TEXTO_APP } from "@web/config/strings.ts";
import type { PropsLogoMarca, VarianteLogo } from "@web/types/ui.type.ts";

const CLASE_POR_VARIANTE: Readonly<Record<VarianteLogo, string | undefined>> = {
  [VARIANTE_LOGO.ENCABEZADO]: estilos.encabezado,
  [VARIANTE_LOGO.ENCABEZADO_ANGOSTO]: estilos.encabezadoAngosto,
  [VARIANTE_LOGO.ACCESO]: estilos.acceso,
};

export function LogoMarca({ variante }: PropsLogoMarca) {
  return (
    <img
      className={`${estilos.logo} ${CLASE_POR_VARIANTE[variante]}`}
      src={RUTA_LOGO}
      width={ANCHO_LOGO}
      height={ALTO_LOGO}
      alt={TEXTO_APP.subtitulo}
    />
  );
}
