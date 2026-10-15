import { enviarMensaje } from "@web/api/flujo-chat.ts";
import { ACCION_UI } from "@web/config/constants/ui.constants.ts";
import { TEXTO_CONFIRMACION } from "@web/config/strings.ts";
import { hayTarjetaAbierta } from "@web/state/confirmaciones.ts";
import {
  accionDeConfig,
  esFalloDeTurno,
  estadoInicialConversacion,
  reducirConversacion,
} from "@web/state/conversacion.ts";
import type { AccionDeTarjeta, ControlChat, Despachar, ResultadoApi } from "@web/types/chat.type.ts";
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

  function iniciarTurno(texto: string, accion: AccionDeTarjeta | null): void {
    const mensaje = texto.trim();
    if (mensaje.length === 0 || estado.enCurso || turnoActivo.current !== null) return;
    const controlador = new AbortController();
    turnoActivo.current = controlador;
    let turnoFallido = false;
    const despacharDelTurno: Despachar = (accionUi) => {
      if (esFalloDeTurno(accionUi)) turnoFallido = true;
      despachar(accionUi);
    };
    const pedido = { sessionId: estado.sesionId, message: mensaje };
    despachar(
      accion === null ? { tipo: ACCION_UI.ENVIAR, mensaje } : { tipo: ACCION_UI.ENVIAR, mensaje, accion },
    );
    void enviarMensaje(
      accion === null ? pedido : { ...pedido, accion },
      despacharDelTurno,
      controlador.signal,
    ).finally(() => {
      if (turnoActivo.current === controlador) turnoActivo.current = null;
      if (turnoFallido) alFallarTurno();
    });
  }

  function enviarTexto(texto: string): void {
    iniciarTurno(texto, null);
  }

  function enviar(): void {
    enviarTexto(estado.borrador);
  }

  function responderConfirmacion(accion: AccionDeTarjeta): void {
    if (!hayTarjetaAbierta(estado.tarjetasConfirmacion, accion.caso)) return;
    iniciarTurno(TEXTO_CONFIRMACION.mensaje(accion), accion);
  }

  return {
    estado,
    borrador: estado.borrador,
    cambiarBorrador,
    enviar,
    enviarTexto,
    responderConfirmacion,
    recibirConfig,
  };
}
