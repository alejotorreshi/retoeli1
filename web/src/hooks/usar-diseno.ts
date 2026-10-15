import { CONSULTA_DE_ANCHO, DISENO, EVENTO_CAMBIO_DE_MEDIOS } from "@web/config/constants/ui.constants.ts";
import type { Diseno } from "@web/types/ui.type.ts";
import { useSyncExternalStore } from "react";

function disenoActual(): Diseno {
  if (window.matchMedia(CONSULTA_DE_ANCHO.ANCHO).matches) return DISENO.ANCHO;
  return window.matchMedia(CONSULTA_DE_ANCHO.MEDIO).matches ? DISENO.MEDIO : DISENO.ANGOSTO;
}

function suscribir(avisar: () => void): () => void {
  const consultas = Object.values(CONSULTA_DE_ANCHO).map((consulta) => window.matchMedia(consulta));
  for (const consulta of consultas) consulta.addEventListener(EVENTO_CAMBIO_DE_MEDIOS, avisar);
  return () => {
    for (const consulta of consultas) consulta.removeEventListener(EVENTO_CAMBIO_DE_MEDIOS, avisar);
  };
}

export function useDiseno(): Diseno {
  return useSyncExternalStore(suscribir, disenoActual);
}
