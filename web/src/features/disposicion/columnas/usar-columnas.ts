import {
  CONSULTA_DE_ANCHO,
  DISENO,
  EVENTO_CAMBIO_DE_MEDIOS,
  PESTANA,
  SUFIJO_ID,
} from "@web/config/constants/ui.constants.ts";
import {
  seleccionarAcceso,
  seleccionarConHistorial,
  seleccionarFirmaDelProgreso,
} from "@web/store/selectores.ts";
import { useSeleccion, useSincronizacion } from "@web/store/usar-almacen.ts";
import type { ControlColumnas, ControlPestanas, Diseno, IdsDePestanas, Pestana } from "@web/types/ui.type.ts";
import { type HTMLAttributes, useId, useState, useSyncExternalStore } from "react";

function disenoActual(): Diseno {
  if (window.matchMedia(CONSULTA_DE_ANCHO.ANCHO).matches) return DISENO.ANCHO;
  return window.matchMedia(CONSULTA_DE_ANCHO.MEDIO).matches ? DISENO.MEDIO : DISENO.ANGOSTO;
}

function suscribirAlDiseno(avisar: () => void): () => void {
  const consultas = Object.values(CONSULTA_DE_ANCHO).map((consulta) => window.matchMedia(consulta));
  for (const consulta of consultas) consulta.addEventListener(EVENTO_CAMBIO_DE_MEDIOS, avisar);
  return () => {
    for (const consulta of consultas) consulta.removeEventListener(EVENTO_CAMBIO_DE_MEDIOS, avisar);
  };
}

function usePestanas(conPestanas: boolean, firmaDelPanel: string): ControlPestanas {
  const [pestana, setPestana] = useState<Pestana>(PESTANA.CHAT);
  const [firmaVista, setFirmaVista] = useState(firmaDelPanel);
  const viendoPanel = !conPestanas || pestana === PESTANA.CASOS;
  if (viendoPanel && firmaVista !== firmaDelPanel) setFirmaVista(firmaDelPanel);

  return { pestana, elegir: setPestana, cambiosSinVer: !viendoPanel && firmaDelPanel !== firmaVista };
}

function atributosDeVista(
  conPestanas: boolean,
  control: ControlPestanas,
  ids: IdsDePestanas,
  pestana: Pestana,
): HTMLAttributes<HTMLDivElement> {
  if (!conPestanas) return {};
  return {
    role: "tabpanel",
    id: ids.vista(pestana),
    "aria-labelledby": ids.pestana(pestana),
    hidden: control.pestana !== pestana,
  };
}

export function useColumnas(): ControlColumnas {
  useSincronizacion();
  const acceso = useSeleccion(seleccionarAcceso);
  const conHistorial = useSeleccion(seleccionarConHistorial);
  const firmaDelProgreso = useSeleccion(seleccionarFirmaDelProgreso);
  const diseno = useSyncExternalStore(suscribirAlDiseno, disenoActual);
  const conPestanas = diseno !== DISENO.ANCHO;
  const pestanas = usePestanas(conPestanas, firmaDelProgreso);
  const base = useId();
  const ids: IdsDePestanas = {
    pestana: (pestana) => `${base}${SUFIJO_ID.PESTANA}${pestana}`,
    vista: (pestana) => `${base}${SUFIJO_ID.VISTA}${pestana}`,
  };

  return {
    acceso,
    diseno,
    angosto: diseno === DISENO.ANGOSTO,
    conPestanas,
    conHistorial,
    pestanas,
    ids,
    vistaChat: atributosDeVista(conPestanas, pestanas, ids, PESTANA.CHAT),
    vistaCasos: atributosDeVista(conPestanas, pestanas, ids, PESTANA.CASOS),
  };
}
