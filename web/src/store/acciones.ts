import {
  ACCION_DIALOGO_SESION,
  ACCION_SALUD,
  ACCION_UI,
  RESULTADO_API,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_CONFIRMACION } from "@web/config/strings.ts";
import {
  accionDeConfig,
  configResuelta,
  sesionDelEvento,
  sesionGuardadaTras,
} from "@web/features/chat/estado/conversacion.ts";
import { hayTarjetaAbierta } from "@web/features/confirmacion/estado/confirmaciones.ts";
import { accionDeSesion, olvidaLaSesion } from "@web/features/sesion/estado/hidratacion.ts";
import type {
  AccionDeTarjeta,
  AccionUi,
  Despachar,
  EstadoConversacion,
  ResultadoApi,
} from "@web/types/chat.type.ts";
import type { Acciones, AlmacenRaiz, Dependencias } from "@web/types/store.type.ts";
import type { ConfigResponse } from "@/http/types/api.type.ts";

export function crearAcciones(almacen: AlmacenRaiz, dependencias: Dependencias): Acciones {
  let turnoActivo: AbortController | null = null;
  let pedidoDeSalud: AbortController | null = null;

  function conversacion(): EstadoConversacion {
    return almacen.leer().conversacion;
  }

  function turnoEnMarcha(): boolean {
    return conversacion().enCurso || turnoActivo !== null;
  }

  function refrescarSalud(): void {
    pedidoDeSalud?.abort();
    const controlador = new AbortController();
    pedidoDeSalud = controlador;
    almacen.despachar({ tipo: ACCION_SALUD.COMPROBANDO });
    void dependencias
      .obtenerSalud(controlador.signal)
      .then((resultado) => {
        if (controlador.signal.aborted) return;
        if (resultado.tipo === RESULTADO_API.OK) {
          almacen.despachar({ tipo: ACCION_SALUD.RECIBIDA, salud: resultado.valor });
        }
      })
      .finally(() => {
        if (pedidoDeSalud !== controlador) return;
        pedidoDeSalud = null;
        almacen.despachar({ tipo: ACCION_SALUD.TERMINADA });
      });
  }

  function cancelarSalud(): void {
    pedidoDeSalud?.abort();
  }

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

  function responderConfirmacion(accion: AccionDeTarjeta): void {
    if (!hayTarjetaAbierta(conversacion().tarjetasConfirmacion, accion.caso)) return;
    iniciarTurno(TEXTO_CONFIRMACION.mensaje(accion), accion);
  }

  function recibirConfig(resultado: ResultadoApi<ConfigResponse>): void {
    almacen.despachar(accionDeConfig(resultado));
  }

  async function cargarConfig(signal: AbortSignal): Promise<void> {
    const resultado = await dependencias.obtenerConfig(signal);
    if (!signal.aborted) recibirConfig(resultado);
  }

  async function reintentarConfig(signal: AbortSignal): Promise<void> {
    const resultado = await dependencias.obtenerConfig(signal);
    if (!signal.aborted && configResuelta(resultado)) recibirConfig(resultado);
  }

  async function cargarSesion(sesionId: string, signal: AbortSignal): Promise<void> {
    const resultado = await dependencias.obtenerSesionAsentada(sesionId, signal);
    if (signal.aborted) return;
    const accion = accionDeSesion(resultado);
    if (olvidaLaSesion(accion)) dependencias.olvidarSesion();
    almacen.despachar(accion);
  }

  function detener(): void {
    const controlador = turnoActivo;
    if (controlador === null) return;
    turnoActivo = null;
    controlador.abort();
    almacen.despachar({ tipo: ACCION_UI.DETENER });
  }

  function sincronizarSesionGuardada(accion: AccionUi): void {
    const guardada = dependencias.leerSesionGuardada();
    const siguiente = sesionGuardadaTras(guardada, conversacion(), accion);
    if (siguiente === guardada) return;
    if (siguiente === null) dependencias.olvidarSesion();
    else dependencias.guardarSesionId(siguiente);
  }

  function cambiarDeSesion(accion: AccionUi): void {
    if (turnoEnMarcha()) return;
    sincronizarSesionGuardada(accion);
    almacen.despachar(accion);
  }

  return {
    cambiarBorrador: (borrador) => almacen.despachar({ tipo: ACCION_UI.CAMBIAR_BORRADOR, borrador }),
    enviar: () => enviarTexto(conversacion().borrador),
    enviarTexto,
    responderConfirmacion,
    recibirConfig,
    cargarConfig,
    reintentarConfig,
    cargarSesion,
    detener,
    recargar: () => almacen.despachar({ tipo: ACCION_UI.RECARGAR }),
    nuevaSesion: () => cambiarDeSesion({ tipo: ACCION_UI.NUEVA_SESION }),
    volverASesionAnterior: () => cambiarDeSesion({ tipo: ACCION_UI.VOLVER_SESION_ANTERIOR }),
    vencerAcceso: (aviso) => almacen.despachar({ tipo: ACCION_UI.ACCESO_PEDIDO, aviso }),
    refrescarSalud,
    cancelarSalud,
    abrirNuevaSesion: () => almacen.despachar({ tipo: ACCION_DIALOGO_SESION.ABRIR }),
    cerrarNuevaSesion: () => almacen.despachar({ tipo: ACCION_DIALOGO_SESION.CERRAR }),
  };
}
