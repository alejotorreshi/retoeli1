import { AvisoError } from "@web/components/aviso.tsx";
import { GrupoHerramientas } from "@web/components/grupo-herramientas.tsx";
import estilos from "@web/components/linea-de-tiempo.module.css";
import { MensajeAgente, MensajeUsuaria } from "@web/components/mensaje.tsx";
import { CLASE_GLOBAL, DISTANCIA_PEGADO_AL_FINAL } from "@web/config/constants/ui.constants.ts";
import { TEXTO_CHAT } from "@web/config/strings.ts";
import { anuncioDeEstado } from "@web/state/conversacion.ts";
import type { PropsLineaDeTiempo, PropsTurno } from "@web/types/ui.type.ts";
import { useEffect, useRef, useState } from "react";

function Turno({ turno, enCurso }: PropsTurno) {
  return (
    <>
      <MensajeUsuaria texto={turno.mensaje} />
      {turno.llamadas.length === 0 ? null : <GrupoHerramientas llamadas={turno.llamadas} enCurso={enCurso} />}
      {turno.textos.map((texto) => (
        <MensajeAgente key={texto.clave} texto={texto.texto} />
      ))}
      {turno.error === null ? null : (
        <li>
          <AvisoError mensaje={turno.error.mensaje} />
        </li>
      )}
    </>
  );
}

function EstadoVacio() {
  return (
    <div className={estilos.vacio}>
      <h2 className={estilos.vacioTitulo}>{TEXTO_CHAT.vacioTitulo}</h2>
      <p className={estilos.vacioCuerpo}>{TEXTO_CHAT.vacioCuerpo}</p>
    </div>
  );
}

function estaCercaDelFinal(zona: HTMLElement): boolean {
  return zona.scrollHeight - zona.scrollTop - zona.clientHeight <= DISTANCIA_PEGADO_AL_FINAL;
}

function bajarAlFinal(zona: HTMLElement): void {
  zona.scrollTop = zona.scrollHeight;
}

export function LineaDeTiempo({ turnos, enCurso, children }: PropsLineaDeTiempo) {
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
          {turnos.length === 0 ? (
            <EstadoVacio />
          ) : (
            <ol className={estilos.lista}>
              {turnos.map((turno, indice) => (
                <Turno key={turno.clave} turno={turno} enCurso={enCurso && indice === turnos.length - 1} />
              ))}
            </ol>
          )}
          {children}
        </div>
      </section>
      {hayContenidoNuevo ? (
        <button type="button" className={estilos.irAlFinal} onClick={irAlFinal}>
          {TEXTO_CHAT.irAlFinal}
        </button>
      ) : null}
      <div aria-live="polite" className={CLASE_GLOBAL.OCULTO}>
        {anuncioDeEstado({ turnos, enCurso })}
      </div>
    </div>
  );
}
