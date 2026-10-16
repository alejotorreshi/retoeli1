import { ACCION_UI } from "@web/config/constants/ui.constants.ts";
import { sesionDelEvento } from "@web/state/conversacion.ts";
import type { AccionDeTarjeta, Despachar, EstadoConversacion } from "@web/types/chat.type.ts";
import type { Acciones, AlmacenRaiz, Dependencias } from "@web/types/store.type.ts";

export function crearAcciones(almacen: AlmacenRaiz, dependencias: Dependencias): Acciones {
  let turnoActivo: AbortController | null = null;

  function conversacion(): EstadoConversacion {
    return almacen.leer().conversacion;
  }

  function refrescarSalud(): void {}

  function iniciarTurno(texto: string, accion: AccionDeTarjeta | null): void {
    const mensaje = texto.trim();
    const estado = conversacion();
    if (mensaje.length === 0 || estado.enCurso || estado.hidratando || turnoActivo !== null) return;
    const controlador = new AbortController();
    turnoActivo = controlador;
    const despacharDelTurno: Despachar = (accionUi) => {
      if (controlador.signal.aborted) return;
      const sesionId = sesionDelEvento(accionUi);
      if (sesionId !== null) dependencias.guardarSesionId(sesionId);
      almacen.despachar(accionUi);
    };
    const pedido = { sessionId: estado.sesionId, message: mensaje };
    almacen.despachar(
      accion === null ? { tipo: ACCION_UI.ENVIAR, mensaje } : { tipo: ACCION_UI.ENVIAR, mensaje, accion },
    );
    void dependencias
      .enviarTurno(
        accion === null ? pedido : { ...pedido, accion },
        despacharDelTurno,
        controlador.signal,
        refrescarSalud,
      )
      .finally(() => {
        if (turnoActivo === controlador) turnoActivo = null;
      });
  }

  function enviarTexto(texto: string): void {
    iniciarTurno(texto, null);
  }

  return {
    cambiarBorrador: (borrador) => almacen.despachar({ tipo: ACCION_UI.CAMBIAR_BORRADOR, borrador }),
    enviar: () => enviarTexto(conversacion().borrador),
    enviarTexto,
    refrescarSalud,
  };
}
