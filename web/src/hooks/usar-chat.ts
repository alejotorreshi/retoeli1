import { enviarMensaje } from "@web/api/flujo-chat.ts";
import { ACCION_UI } from "@web/config/constants/ui.constants.ts";
import {
  accionDeConfig,
  esFalloDeTurno,
  estadoInicialConversacion,
  reducirConversacion,
} from "@web/state/conversacion.ts";
import type { ControlChat, Despachar, ResultadoApi } from "@web/types/chat.type.ts";
import { useCallback, useReducer, useRef } from "react";
import type { ConfigResponse } from "@/http/types/api.type.ts";

export function useChat(alFallarTurno: () => void): ControlChat {
  const [estado, despachar] = useReducer(reducirConversacion, estadoInicialConversacion);
  const turnoActivo = useRef<AbortController | null>(null);
  const recibirConfig = useCallback(
    (resultado: ResultadoApi<ConfigResponse>) => despachar(accionDeConfig(resultado)),
    [],
  );

  function cambiarBorrador(borrador: string): void {
    despachar({ tipo: ACCION_UI.CAMBIAR_BORRADOR, borrador });
  }

  function enviar(): void {
    const mensaje = estado.borrador.trim();
    if (mensaje.length === 0 || estado.enCurso || turnoActivo.current !== null) return;
    const controlador = new AbortController();
    turnoActivo.current = controlador;
    let turnoFallido = false;
    const despacharDelTurno: Despachar = (accion) => {
      if (esFalloDeTurno(accion)) turnoFallido = true;
      despachar(accion);
    };
    despachar({ tipo: ACCION_UI.ENVIAR, mensaje });
    void enviarMensaje(
      { sessionId: estado.sesionId, message: mensaje },
      despacharDelTurno,
      controlador.signal,
    ).finally(() => {
      if (turnoActivo.current === controlador) turnoActivo.current = null;
      if (turnoFallido) alFallarTurno();
    });
  }

  return { estado, borrador: estado.borrador, cambiarBorrador, enviar, recibirConfig };
}
