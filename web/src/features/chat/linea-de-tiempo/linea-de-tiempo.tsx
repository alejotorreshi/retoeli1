import { AvisoError, AvisoSistema } from "@web/compartido/aviso/aviso.tsx";
import { IconoChevron } from "@web/compartido/iconos/iconos.tsx";
import { AVISO_SESION, CLASE_GLOBAL } from "@web/config/constants/ui.constants.ts";
import { TEXTO_AVISO, TEXTO_CHAT } from "@web/config/strings.ts";
import { TarjetaResultado } from "@web/features/casos/tarjeta-resultado/tarjeta-resultado.tsx";
import { EstadoVacio } from "@web/features/chat/estado-vacio/estado-vacio.tsx";
import { IndicadorPensando } from "@web/features/chat/indicador-pensando/indicador-pensando.tsx";
import estilos from "@web/features/chat/linea-de-tiempo/linea-de-tiempo.module.css";
import { useLineaDeTiempo } from "@web/features/chat/linea-de-tiempo/usar-linea-de-tiempo.ts";
import { MensajeAgente, MensajeUsuaria } from "@web/features/chat/mensaje/mensaje.tsx";
import { PilaConfirmaciones } from "@web/features/confirmacion/tarjeta-confirmacion/tarjeta-confirmacion.tsx";
import { GrupoHerramientas } from "@web/features/herramientas/grupo-herramientas/grupo-herramientas.tsx";
import type {
  PropsAvisoInicial,
  PropsCuerpoLinea,
  PropsErrorDelTurno,
  PropsTurno,
} from "@web/types/ui.type.ts";

function ErrorDelTurno({ mensaje, accion }: PropsErrorDelTurno) {
  return (
    <AvisoError
      mensaje={mensaje}
      acciones={
        accion === null ? undefined : (
          <button type="button" className={estilos.accionAviso} onClick={accion.alPulsar}>
            {TEXTO_AVISO.accion(accion.accion)}
          </button>
        )
      }
    />
  );
}

function Turno({ entrada }: PropsTurno) {
  const { turno, enCurso, resultados, confirmaciones, accionDelError } = entrada;
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
      <PilaConfirmaciones {...confirmaciones} />
      {turno.error === null ? null : (
        <li>
          <ErrorDelTurno mensaje={turno.error.mensaje} accion={accionDelError} />
        </li>
      )}
    </>
  );
}

function AvisoInicial({ aviso }: PropsAvisoInicial) {
  return aviso.tipo === AVISO_SESION.NO_CARGADA ? (
    <AvisoError mensaje={aviso.mensaje} />
  ) : (
    <AvisoSistema mensaje={aviso.mensaje} />
  );
}

function CuerpoLinea({ turnos, cargando }: PropsCuerpoLinea) {
  if (cargando) return <IndicadorPensando etiqueta={TEXTO_CHAT.cargandoConversacion} marca={0} />;
  if (turnos.length === 0) return <EstadoVacio />;
  return (
    <ol className={estilos.lista}>
      {turnos.map((entrada) => (
        <Turno key={entrada.turno.clave} entrada={entrada} />
      ))}
    </ol>
  );
}

export function LineaDeTiempo() {
  const {
    zona,
    contenido,
    siguiendo,
    contenidoNuevo,
    alDesplazar,
    irAlFinal,
    aviso,
    cargando,
    turnos,
    indicador,
    anuncio,
  } = useLineaDeTiempo();

  return (
    <div className={estilos.marco}>
      <section
        ref={zona}
        aria-label={TEXTO_CHAT.lineaDeTiempo}
        className={siguiendo ? `${estilos.zona} ${estilos.siguiendo}` : estilos.zona}
        onScroll={alDesplazar}
      >
        <div ref={contenido} className={estilos.contenido}>
          {aviso === null ? null : <AvisoInicial aviso={aviso} />}
          <CuerpoLinea turnos={turnos} cargando={cargando} />
          {indicador === null ? null : (
            <IndicadorPensando etiqueta={indicador.etiqueta} marca={indicador.marca} />
          )}
        </div>
      </section>
      {contenidoNuevo ? (
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
        {anuncio}
      </div>
    </div>
  );
}
