import { AvisoError, AvisoSistema } from "@web/components/aviso.tsx";
import { GrupoHerramientas } from "@web/components/grupo-herramientas.tsx";
import { IndicadorPensando } from "@web/components/indicador-pensando.tsx";
import estilos from "@web/components/linea-de-tiempo.module.css";
import { MensajeAgente, MensajeUsuaria } from "@web/components/mensaje.tsx";
import { PilaConfirmaciones } from "@web/components/tarjeta-confirmacion.tsx";
import { TarjetaResultado } from "@web/components/tarjeta-resultado.tsx";
import { AVISO_SESION, CLASE_GLOBAL, DISTANCIA_PEGADO_AL_FINAL } from "@web/config/constants/ui.constants.ts";
import { TEXTO_AVISO, TEXTO_CHAT } from "@web/config/strings.ts";
import { resultadosDelTurno } from "@web/state/casos.ts";
import { tarjetasDelTurno } from "@web/state/confirmaciones.ts";
import { anuncioDeEstado } from "@web/state/conversacion.ts";
import type {
  PropsAvisoInicial,
  PropsCuerpoLinea,
  PropsErrorDelTurno,
  PropsEstadoVacio,
  PropsLineaDeTiempo,
  PropsTurno,
} from "@web/types/ui.type.ts";
import { useEffect, useRef, useState } from "react";

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
              alResponder={alResponderConfirmacion}
            />
          }
        />
      ))}
    </ol>
  );
}

function estaCercaDelFinal(zona: HTMLElement): boolean {
  return zona.scrollHeight - zona.scrollTop - zona.clientHeight <= DISTANCIA_PEGADO_AL_FINAL;
}

function bajarAlFinal(zona: HTMLElement): void {
  zona.scrollTop = zona.scrollHeight;
}

export function LineaDeTiempo({
  turnos,
  cargando,
  aviso,
  enCurso,
  tarjetasConfirmacion,
  alResponderConfirmacion,
  alAccionDeAviso,
  acciones,
  children,
}: PropsLineaDeTiempo) {
  const zona = useRef<HTMLElement>(null);
  const contenido = useRef<HTMLDivElement>(null);
  const pegadoAlFinal = useRef(true);
  const [hayContenidoNuevo, setHayContenidoNuevo] = useState(false);

  useEffect(() => {
    const desplazable = zona.current;
    const cuerpo = contenido.current;
    if (desplazable === null || cuerpo === null) return;
    const observador = new ResizeObserver(() => {
      if (pegadoAlFinal.current) bajarAlFinal(desplazable);
      else setHayContenidoNuevo(true);
    });
    observador.observe(cuerpo);
    return () => observador.disconnect();
  }, []);

  function alDesplazar(): void {
    if (zona.current === null) return;
    pegadoAlFinal.current = estaCercaDelFinal(zona.current);
    if (pegadoAlFinal.current) setHayContenidoNuevo(false);
  }

  function irAlFinal(): void {
    if (zona.current === null) return;
    pegadoAlFinal.current = true;
    setHayContenidoNuevo(false);
    bajarAlFinal(zona.current);
  }

  return (
    <div className={estilos.marco}>
      <section
        ref={zona}
        aria-label={TEXTO_CHAT.lineaDeTiempo}
        className={estilos.zona}
        onScroll={alDesplazar}
      >
        <div ref={contenido} className={estilos.contenido}>
          {aviso === null ? null : <AvisoInicial aviso={aviso} />}
          <CuerpoLinea
            turnos={turnos}
            cargando={cargando}
            enCurso={enCurso}
            tarjetasConfirmacion={tarjetasConfirmacion}
            alResponderConfirmacion={alResponderConfirmacion}
            alAccionDeAviso={alAccionDeAviso}
            acciones={acciones}
          />
          {children}
        </div>
      </section>
      {hayContenidoNuevo ? (
        <button type="button" className={estilos.irAlFinal} onClick={irAlFinal}>
          {TEXTO_CHAT.irAlFinal}
        </button>
      ) : null}
      <div aria-live="polite" className={CLASE_GLOBAL.OCULTO}>
        {anuncioDeEstado({ turnos, enCurso, tarjetasConfirmacion })}
      </div>
    </div>
  );
}
