import { obtenerConfig } from "@web/api/cliente-api.ts";
import { REINTENTO_CONFIG_MS } from "@web/config/constants/ui.constants.ts";
import { configResuelta } from "@web/features/chat/estado/conversacion.ts";
import type { ResultadoApi } from "@web/types/chat.type.ts";
import { useEffect } from "react";
import type { ConfigResponse } from "@/http/types/api.type.ts";

export function useReintentoConfig(
  pendiente: boolean,
  recibir: (resultado: ResultadoApi<ConfigResponse>) => void,
): void {
  useEffect(() => {
    if (!pendiente) return;
    const controlador = new AbortController();
    function reintentar(): void {
      void obtenerConfig(controlador.signal).then((resultado) => {
        if (!controlador.signal.aborted && configResuelta(resultado)) recibir(resultado);
      });
    }
    function alVolverALaPestana(): void {
      if (document.visibilityState === "visible") reintentar();
    }
    const temporizador = setInterval(reintentar, REINTENTO_CONFIG_MS);
    document.addEventListener("visibilitychange", alVolverALaPestana);
    return () => {
      clearInterval(temporizador);
      document.removeEventListener("visibilitychange", alVolverALaPestana);
      controlador.abort();
    };
  }, [pendiente, recibir]);
}
