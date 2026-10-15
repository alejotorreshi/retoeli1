import { obtenerSesionAsentada } from "@web/api/cliente-api.ts";
import { enviarMensaje } from "@web/api/flujo-chat.ts";
import { guardarSesionId, leerSesionGuardada, olvidarSesion } from "@web/api/sesion-local.ts";
import { ACCION_UI, ESTADO_ACCESO } from "@web/config/constants/ui.constants.ts";
import { TEXTO_CONFIRMACION } from "@web/config/strings.ts";
import { hayTarjetaAbierta } from "@web/state/confirmaciones.ts";
import {
  accionDeConfig,
  esFalloDeTurno,
  estadoAlCargar,
  reducirConversacion,
  sesionDelEvento,
} from "@web/state/conversacion.ts";
import { accionDeSesion, olvidaLaSesion } from "@web/state/hidratacion.ts";
import type {
  AccionDeTarjeta,
  ControlChat,
  Despachar,
  EstadoConversacion,
  ResultadoApi,
  VistaSesionUi,
} from "@web/types/chat.type.ts";
import { useCallback, useEffect, useReducer, useRef } from "react";
import type { ConfigResponse } from "@/http/types/api.type.ts";

function estadoConSesionGuardada(): EstadoConversacion {
  return estadoAlCargar(leerSesionGuardada());
}

export function useChat(alFallarTurno: () => void): ControlChat {
  const [estado, despachar] = useReducer(reducirConversacion, null, estadoConSesionGuardada);
  const turnoActivo = useRef<AbortController | null>(null);
  const recibirConfig = useCallback(
    (resultado: ResultadoApi<ConfigResponse>) => despachar(accionDeConfig(resultado)),
    [],
  );
  const recibirSesion = useCallback((resultado: ResultadoApi<VistaSesionUi>) => {
    const accion = accionDeSesion(resultado);
    if (olvidaLaSesion(accion)) olvidarSesion();
    despachar(accion);
  }, []);

  const vencerAcceso = useCallback(
    (aviso: string) => despachar({ tipo: ACCION_UI.ACCESO_PEDIDO, aviso }),
    [],
  );

  const accesoConcedido = estado.acceso.tipo === ESTADO_ACCESO.CONCEDIDO;
  const sesionPorCargar = estado.hidratando ? estado.sesionId : null;

  useEffect(() => {
    if (!accesoConcedido || sesionPorCargar === null) return;
    const controlador = new AbortController();
    void obtenerSesionAsentada(sesionPorCargar, controlador.signal).then((resultado) => {
      if (!controlador.signal.aborted) recibirSesion(resultado);
    });
    return () => controlador.abort();
  }, [accesoConcedido, sesionPorCargar, recibirSesion]);

  function cambiarBorrador(borrador: string): void {
    despachar({ tipo: ACCION_UI.CAMBIAR_BORRADOR, borrador });
  }

  function iniciarTurno(texto: string, accion: AccionDeTarjeta | null): void {
    const mensaje = texto.trim();
    if (mensaje.length === 0 || estado.enCurso || estado.hidratando || turnoActivo.current !== null) return;
    const controlador = new AbortController();
    turnoActivo.current = controlador;
    let turnoFallido = false;
    const despacharDelTurno: Despachar = (accionUi) => {
      if (controlador.signal.aborted) return;
      if (esFalloDeTurno(accionUi)) turnoFallido = true;
      const sesionId = sesionDelEvento(accionUi);
      if (sesionId !== null) guardarSesionId(sesionId);
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

  function detener(): void {
    const controlador = turnoActivo.current;
    if (controlador === null) return;
    turnoActivo.current = null;
    controlador.abort();
    despachar({ tipo: ACCION_UI.DETENER });
  }

  function recargar(): void {
    despachar({ tipo: ACCION_UI.RECARGAR });
  }

  function nuevaSesion(): void {
    if (estado.enCurso || turnoActivo.current !== null) return;
    olvidarSesion();
    despachar({ tipo: ACCION_UI.NUEVA_SESION });
  }

  return {
    estado,
    borrador: estado.borrador,
    cambiarBorrador,
    enviar,
    enviarTexto,
    responderConfirmacion,
    recibirConfig,
    detener,
    recargar,
    nuevaSesion,
    vencerAcceso,
  };
}
