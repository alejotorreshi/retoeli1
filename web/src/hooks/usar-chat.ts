import { enviarMensaje } from "@web/api/flujo-chat.ts";
import { ACCION_UI, ACCIONES_QUE_DEVUELVEN_EL_BORRADOR } from "@web/config/constants/ui.constants.ts";
import { estadoInicialConversacion, reducirConversacion } from "@web/state/conversacion.ts";
import type { ControlChat, Despachar } from "@web/types/chat.type.ts";
import { useReducer, useRef, useState } from "react";

export function useChat(): ControlChat {
  const [estado, despachar] = useReducer(reducirConversacion, estadoInicialConversacion);
  const [borrador, cambiarBorrador] = useState("");
  const turnoActivo = useRef<AbortController | null>(null);

  function enviar(): void {
    const mensaje = borrador.trim();
    if (mensaje.length === 0 || estado.enCurso || turnoActivo.current !== null) return;
    const controlador = new AbortController();
    turnoActivo.current = controlador;
    despachar({ tipo: ACCION_UI.ENVIAR, mensaje });
    cambiarBorrador("");
    const despacharDevolviendoBorrador: Despachar = (accion) => {
      if (ACCIONES_QUE_DEVUELVEN_EL_BORRADOR.has(accion.tipo)) {
        cambiarBorrador((actual) => (actual.length === 0 ? mensaje : actual));
      }
      despachar(accion);
    };
    void enviarMensaje(
      { sessionId: estado.sesionId, message: mensaje },
      despacharDevolviendoBorrador,
      controlador.signal,
    ).finally(() => {
      if (turnoActivo.current === controlador) turnoActivo.current = null;
    });
  }

  return { estado, borrador, cambiarBorrador, enviar };
}
