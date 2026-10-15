import { PESTANA } from "@web/config/constants/ui.constants.ts";
import type { ControlPestanas, Pestana } from "@web/types/ui.type.ts";
import { useEffect, useState } from "react";

export function usePestanas(conPestanas: boolean, firmaDelPanel: string): ControlPestanas {
  const [pestana, setPestana] = useState<Pestana>(PESTANA.CHAT);
  const [firmaVista, setFirmaVista] = useState(firmaDelPanel);
  const viendoPanel = !conPestanas || pestana === PESTANA.CASOS;

  useEffect(() => {
    if (viendoPanel) setFirmaVista(firmaDelPanel);
  }, [viendoPanel, firmaDelPanel]);

  return { pestana, elegir: setPestana, cambiosSinVer: !viendoPanel && firmaDelPanel !== firmaVista };
}
