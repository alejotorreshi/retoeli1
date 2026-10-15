import { obtenerSalud } from "@web/api/cliente-api.ts";
import { RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import type { ControlSalud } from "@web/types/chat.type.ts";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HealthResponse } from "@/http/types/api.type.ts";

export function useSalud(): ControlSalud {
  const [salud, setSalud] = useState<HealthResponse | null>(null);
  const pedidoActivo = useRef<AbortController | null>(null);

  const refrescar = useCallback(() => {
    pedidoActivo.current?.abort();
    const controlador = new AbortController();
    pedidoActivo.current = controlador;
    void obtenerSalud(controlador.signal).then((resultado) => {
      if (controlador.signal.aborted) return;
      if (pedidoActivo.current === controlador) pedidoActivo.current = null;
      if (resultado.tipo === RESULTADO_API.OK) setSalud(resultado.valor);
    });
  }, []);

  useEffect(() => {
    function alVolverALaPestana(): void {
      if (document.visibilityState === "visible") refrescar();
    }
    refrescar();
    document.addEventListener("visibilitychange", alVolverALaPestana);
    return () => {
      document.removeEventListener("visibilitychange", alVolverALaPestana);
      pedidoActivo.current?.abort();
    };
  }, [refrescar]);

  return { salud, refrescar };
}
