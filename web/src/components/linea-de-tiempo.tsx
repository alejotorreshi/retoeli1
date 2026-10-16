import { AvisoError, AvisoSistema } from "@web/compartido/aviso/aviso.tsx";
import { IconoChevron } from "@web/compartido/iconos/iconos.tsx";
import { GrupoHerramientas } from "@web/components/grupo-herramientas.tsx";
import { IndicadorPensando } from "@web/components/indicador-pensando.tsx";
import estilos from "@web/components/linea-de-tiempo.module.css";
import { MensajeAgente, MensajeUsuaria } from "@web/components/mensaje.tsx";
import { PilaConfirmaciones } from "@web/components/tarjeta-confirmacion.tsx";
import { TarjetaResultado } from "@web/components/tarjeta-resultado.tsx";
import { AVISO_SESION, CLASE_GLOBAL, SENAL_SEGUIMIENTO } from "@web/config/constants/ui.constants.ts";
import { TEXTO_AVISO, TEXTO_CHAT } from "@web/config/strings.ts";
import { resultadosDelTurno } from "@web/features/casos/estado/casos.ts";
import { anuncioDeEstado } from "@web/features/chat/estado/conversacion.ts";
import { reducirSeguimiento, seguimientoInicial } from "@web/features/chat/estado/seguimiento.ts";
import { tarjetasDelTurno } from "@web/features/confirmacion/estado/confirmaciones.ts";
import type {
  PropsAvisoInicial,
  PropsCuerpoLinea,
  PropsErrorDelTurno,
  PropsEstadoVacio,
  PropsLineaDeTiempo,
  PropsTurno,
  SenalSeguimiento,
} from "@web/types/ui.type.ts";
import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

function ErrorDelTurno({ error, alAccionDeAviso }: PropsErrorDelTurno) {
  const { accion } = error;
  return (
    <AvisoError
      mensaje={error.mensaje}
      acciones={
        accion === null ? undefined : (
          <button type="button" className={estilos.accionAviso} onClick={() => alAccionDeAviso(accion)}>
            {TEXTO_AVISO.accion(accion)}
          </button>
        )
      }
    />
  );
}

function Turno({ turno, enCurso, resultados, confirmaciones, alAccionDeAviso }: PropsTurno) {
  return (
    <>
      <MensajeUsuaria texto={turno.mensaje} />
      {turno.llamadas.length === 0 ? null : <GrupoHerramientas llamadas={turno.llamadas} enCurso={enCurso} />}
      {turno.textos.map((texto) => (
        <MensajeAgente key={texto.clave} texto={texto.texto} />
      ))}
      {resultados.map((resultado) => (
        <TarjetaResultado key={resultado.caso} resultado={resultado} />
      ))}
      {confirmaciones}
      {turno.error === null ? null : (
        <li>
          <ErrorDelTurno error={turno.error} alAccionDeAviso={alAccionDeAviso} />
        </li>
      )}
    </>
  );
}

function EstadoVacio({ acciones }: PropsEstadoVacio) {
  return (
    <div className={estilos.vacio}>
      <h2 className={estilos.vacioTitulo}>{TEXTO_CHAT.vacioTitulo}</h2>
      <p className={estilos.vacioCuerpo}>{TEXTO_CHAT.vacioCuerpo}</p>
      <div className={estilos.vacioAcciones}>{acciones}</div>
    </div>
  );
}

function AvisoInicial({ aviso }: PropsAvisoInicial) {
  return aviso.tipo === AVISO_SESION.NO_CARGADA ? (
    <AvisoError mensaje={aviso.mensaje} />
  ) : (
    <AvisoSistema mensaje={aviso.mensaje} />
  );
}

function CuerpoLinea({
  turnos,
  cargando,
  enCurso,
  pausada,
  tarjetasConfirmacion,
  alResponderConfirmacion,
  alAccionDeAviso,
  acciones,
}: PropsCuerpoLinea) {
  if (cargando) return <IndicadorPensando etiqueta={TEXTO_CHAT.cargandoConversacion} marca={0} />;
  if (turnos.length === 0) return <EstadoVacio acciones={acciones} />;
  return (
    <ol className={estilos.lista}>
      {turnos.map((turno, indice) => (
        <Turno
          key={turno.clave}
          turno={turno}
          enCurso={enCurso && indice === turnos.length - 1}
          resultados={resultadosDelTurno(turnos, indice)}
          alAccionDeAviso={alAccionDeAviso}
          confirmaciones={
            <PilaConfirmaciones
              tarjetas={tarjetasDelTurno(tarjetasConfirmacion, turno.clave)}
              turnos={turnos}
              ocupada={enCurso}
              pausada={pausada}
              alResponder={alResponderConfirmacion}
            />
          }
        />
      ))}
    </ol>
  );
}

function distanciaAlFinal(zona: HTMLElement): number {
  return zona.scrollHeight - zona.scrollTop - zona.clientHeight;
}

export function LineaDeTiempo({
  turnos,
  cargando,
  aviso,
  enCurso,
  pausada,
  tarjetasConfirmacion,
  alResponderConfirmacion,
  alAccionDeAviso,
  acciones,
  children,
}: PropsLineaDeTiempo) {
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
      despachar({ tipo: SENAL_SEGUIMIENTO.CRECIMIENTO, distancia: distanciaAlFinal(desplazable) });
      if (seguimiento.current.pegado) seguirAlFinal(desplazable);
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

  return (
    <div className={estilos.marco}>
      <section
        ref={zona}
        aria-label={TEXTO_CHAT.lineaDeTiempo}
        className={vista.pegado ? `${estilos.zona} ${estilos.siguiendo}` : estilos.zona}
        onScroll={alDesplazar}
      >
        <div ref={contenido} className={estilos.contenido}>
          {aviso === null ? null : <AvisoInicial aviso={aviso} />}
          <CuerpoLinea
            turnos={turnos}
            cargando={cargando}
            enCurso={enCurso}
            pausada={pausada}
            tarjetasConfirmacion={tarjetasConfirmacion}
            alResponderConfirmacion={alResponderConfirmacion}
            alAccionDeAviso={alAccionDeAviso}
            acciones={acciones}
          />
          {children}
        </div>
      </section>
      {vista.contenidoNuevo ? (
        <button
          type="button"
          className={estilos.irAlFinal}
          aria-label={TEXTO_CHAT.irAlFinal}
          onClick={irAlFinal}
        >
          <span className={estilos.iconoIrAlFinal}>
            <IconoChevron />
          </span>
          <span className={estilos.textoIrAlFinal}>{TEXTO_CHAT.irAlFinal}</span>
        </button>
      ) : null}
      <div aria-live="polite" className={CLASE_GLOBAL.OCULTO}>
        {anuncioDeEstado({ turnos, enCurso, tarjetasConfirmacion })}
      </div>
    </div>
  );
}
