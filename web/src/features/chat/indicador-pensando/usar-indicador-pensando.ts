import { ESPERA_DESPERTAR_MS } from "@web/config/constants/ui.constants.ts";
import { useEffect, useState } from "react";

export function useAvisoDespertar(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const espera = setTimeout(() => setVisible(true), ESPERA_DESPERTAR_MS);
    return () => clearTimeout(espera);
  }, []);

  return visible;
}
