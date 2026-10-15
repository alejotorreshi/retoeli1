import { CLASE_GLOBAL, ICONO_SVG, TAMANO_ICONO } from "@web/config/constants/ui.constants.ts";
import type { PropsIcono, PropsSvgIcono } from "@web/types/ui.type.ts";

function SvgIcono({ tamano, clase, children }: PropsSvgIcono) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox={ICONO_SVG.CAJA}
      fill="none"
      stroke="currentColor"
      strokeWidth={ICONO_SVG.TRAZO}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={clase}
    >
      {children}
    </svg>
  );
}

function Circulo({ radio }: { readonly radio: number }) {
  return <circle cx={ICONO_SVG.CENTRO} cy={ICONO_SVG.CENTRO} r={radio} />;
}

export function IconoCheck({ tamano = TAMANO_ICONO.CHICO }: PropsIcono) {
  return (
    <SvgIcono tamano={tamano}>
      <path d="M20 6 9 17l-5-5" />
    </SvgIcono>
  );
}

export function IconoX({ tamano = TAMANO_ICONO.CHICO }: PropsIcono) {
  return (
    <SvgIcono tamano={tamano}>
      <path d="M18 6 6 18M6 6l12 12" />
    </SvgIcono>
  );
}

export function IconoAlerta({ tamano = TAMANO_ICONO.CHICO }: PropsIcono) {
  return (
    <SvgIcono tamano={tamano}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </SvgIcono>
  );
}

export function IconoChevron({ tamano = TAMANO_ICONO.CHICO }: PropsIcono) {
  return (
    <SvgIcono tamano={tamano}>
      <path d="m9 18 6-6-6-6" />
    </SvgIcono>
  );
}

export function IconoDescargar({ tamano = TAMANO_ICONO.CHICO }: PropsIcono) {
  return (
    <SvgIcono tamano={tamano}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5M12 15V3" />
    </SvgIcono>
  );
}

export function IconoOjo({ tamano = TAMANO_ICONO.CHICO }: PropsIcono) {
  return (
    <SvgIcono tamano={tamano}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
      <Circulo radio={ICONO_SVG.RADIO_PUPILA} />
    </SvgIcono>
  );
}

export function IconoReloj({ tamano = TAMANO_ICONO.CHICO }: PropsIcono) {
  return (
    <SvgIcono tamano={tamano}>
      <Circulo radio={ICONO_SVG.RADIO_CIRCULO} />
      <path d="M12 6v6l4 2" />
    </SvgIcono>
  );
}

export function IconoGirando({ tamano = TAMANO_ICONO.CHICO }: PropsIcono) {
  return (
    <SvgIcono tamano={tamano} clase={CLASE_GLOBAL.GIRAR}>
      <path d="M21 12a9 9 0 1 1-6.2-8.6" />
    </SvgIcono>
  );
}

export function IconoInfo({ tamano = TAMANO_ICONO.CHICO }: PropsIcono) {
  return (
    <SvgIcono tamano={tamano}>
      <Circulo radio={ICONO_SVG.RADIO_CIRCULO} />
      <path d="M12 16v-4M12 8h.01" />
    </SvgIcono>
  );
}
