import { ACCION_AVISO, SENAL_SEGUIMIENTO } from "@web/config/constants/ui.constants.ts";
import { resultadosDelTurno } from "@web/features/casos/estado/casos.ts";
import { anuncioDeEstado } from "@web/features/chat/estado/conversacion.ts";
import {
  debeSeguirAlFinal,
  reducirSeguimiento,
  seguimientoInicial,
} from "@web/features/chat/estado/seguimiento.ts";
import { tarjetasDelTurno } from "@web/features/confirmacion/estado/confirmaciones.ts";
import {
  seleccionarAvisoSesion,
  seleccionarEnCurso,
  seleccionarEnvioEnPausa,
  seleccionarEtiquetaPensando,
  seleccionarEventosDelTurno,
  seleccionarHidratando,
  seleccionarTarjetasConfirmacion,
  seleccionarTurnos,
} from "@web/store/selectores.ts";
import { useAcciones, useSeleccion } from "@web/store/usar-almacen.ts";
import type { AccionDeAviso, TurnoConversacion } from "@web/types/chat.type.ts";
import type {
  AccionDelError,
  ControlLineaDeTiempo,
  SenalSeguimiento,
  TurnoEnLinea,
} from "@web/types/ui.type.ts";
import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

function distanciaAlFinal(zona: HTMLElement): number {
  return zona.scrollHeight - zona.scrollTop - zona.clientHeight;
}

export function useLineaDeTiempo(): ControlLineaDeTiempo {
  const turnos = useSeleccion(seleccionarTurnos);
  const cargando = useSeleccion(seleccionarHidratando);
  const aviso = useSeleccion(seleccionarAvisoSesion);
  const enCurso = useSeleccion(seleccionarEnCurso);
  const pausada = useSeleccion(seleccionarEnvioEnPausa);
  const tarjetasConfirmacion = useSeleccion(seleccionarTarjetasConfirmacion);
  const etiquetaPensando = useSeleccion(seleccionarEtiquetaPensando);
  const eventosDelTurno = useSeleccion(seleccionarEventosDelTurno);
  const { responderConfirmacion, recargar, abrirNuevaSesion, volverASesionAnterior } = useAcciones();

  const zona = useRef<HTMLElement>(null);
  const contenido = useRef<HTMLDivElement>(null);
  const seguimiento = useRef(seguimientoInicial);
  const [vista, setVista] = useState(seguimientoInicial);
  const turnosVistos = useRef(turnos.length);

  const despachar = useCallback((senal: SenalSeguimiento) => {
    const anterior = seguimiento.current;
    const siguiente = reducirSeguimiento(anterior, senal);
    seguimiento.current = siguiente;
    if (siguiente.pegado !== anterior.pegado || siguiente.contenidoNuevo !== anterior.contenidoNuevo) {
      setVista(siguiente);
    }
  }, []);

  const seguirAlFinal = useCallback(
    (desplazable: HTMLElement) => {
      desplazable.scrollTop = desplazable.scrollHeight;
      despachar({ tipo: SENAL_SEGUIMIENTO.AJUSTE_PROPIO, posicion: desplazable.scrollTop });
    },
    [despachar],
  );

  useEffect(() => {
    const desplazable = zona.current;
    const cuerpo = contenido.current;
    if (desplazable === null || cuerpo === null) return;
    const observador = new ResizeObserver(() => {
      const turnosActuales = turnosVistos.current;
      despachar({
        tipo: SENAL_SEGUIMIENTO.CRECIMIENTO,
        distancia: distanciaAlFinal(desplazable),
        turnos: turnosActuales,
      });
      if (debeSeguirAlFinal(seguimiento.current, turnosActuales)) seguirAlFinal(desplazable);
    });
    observador.observe(cuerpo);
    return () => observador.disconnect();
  }, [despachar, seguirAlFinal]);

  useLayoutEffect(() => {
    const crecio = turnos.length > turnosVistos.current;
    turnosVistos.current = turnos.length;
    if (!crecio || zona.current === null) return;
    despachar({ tipo: SENAL_SEGUIMIENTO.ENVIO });
    seguirAlFinal(zona.current);
  }, [turnos.length, despachar, seguirAlFinal]);

  function alDesplazar(evento: SyntheticEvent<HTMLElement>): void {
    const desplazable = evento.currentTarget;
    despachar({
      tipo: SENAL_SEGUIMIENTO.DESPLAZAMIENTO,
      posicion: desplazable.scrollTop,
      distancia: distanciaAlFinal(desplazable),
    });
  }

  function irAlFinal(): void {
    if (zona.current === null) return;
    despachar({ tipo: SENAL_SEGUIMIENTO.IR_AL_FINAL });
    seguirAlFinal(zona.current);
  }

  function alAccionDeAviso(accion: AccionDeAviso): void {
    if (accion === ACCION_AVISO.RECARGAR) recargar();
    if (accion === ACCION_AVISO.NUEVA_SESION) abrirNuevaSesion();
    if (accion === ACCION_AVISO.VOLVER_SESION_ANTERIOR) volverASesionAnterior();
  }

  function accionDelError(turno: TurnoConversacion): AccionDelError | null {
    const accion = turno.error?.accion ?? null;
    return accion === null ? null : { accion, alPulsar: () => alAccionDeAviso(accion) };
  }

  const entradas: readonly TurnoEnLinea[] = turnos.map((turno, indice) => ({
    turno,
    enCurso: enCurso && indice === turnos.length - 1,
    resultados: resultadosDelTurno(turnos, indice),
    confirmaciones: {
      tarjetas: tarjetasDelTurno(tarjetasConfirmacion, turno.clave),
      turnos,
      ocupada: enCurso,
      pausada,
      alResponder: responderConfirmacion,
    },
    accionDelError: accionDelError(turno),
  }));

  return {
    zona,
    contenido,
    siguiendo: vista.pegado,
    contenidoNuevo: vista.contenidoNuevo,
    alDesplazar,
    irAlFinal,
    aviso,
    cargando,
    turnos: entradas,
    indicador: enCurso ? { etiqueta: etiquetaPensando, marca: eventosDelTurno } : null,
    anuncio: anuncioDeEstado({ turnos, enCurso, tarjetasConfirmacion }),
  };
}
