import { obtenerConfig, obtenerSesion } from "@web/api/cliente-api.ts";
import { AccionesRapidas } from "@web/components/acciones-rapidas.tsx";
import { AvisoModelo } from "@web/components/aviso-modelo.tsx";
import { Compositor } from "@web/components/compositor.tsx";
import { Encabezado } from "@web/components/encabezado.tsx";
import { IndicadorPensando } from "@web/components/indicador-pensando.tsx";
import { LineaDeTiempo } from "@web/components/linea-de-tiempo.tsx";
import { PanelCasos } from "@web/components/panel-casos.tsx";
import { PantallaAcceso } from "@web/components/pantalla-acceso.tsx";
import {
  CLASE_GLOBAL,
  DISENO,
  ESTADO_ACCESO,
  ORDEN_PESTANAS,
  PESTANA,
  SUFIJO_ID,
  TECLA_PESTANA,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_APP, TEXTO_PESTANAS } from "@web/config/strings.ts";
import { useChat } from "@web/hooks/usar-chat.ts";
import { useDiseno } from "@web/hooks/usar-diseno.ts";
import { usePestanas } from "@web/hooks/usar-pestanas.ts";
import { useSalud } from "@web/hooks/usar-salud.ts";
import { firmaDelProgreso, progresoPorCaso } from "@web/state/casos.ts";
import { etiquetaPensando, eventosDelTurno } from "@web/state/conversacion.ts";
import type { ControlPestanas, IdsDePestanas, Pestana, PropsBarraDePestanas } from "@web/types/ui.type.ts";
import { type HTMLAttributes, type KeyboardEvent, useEffect, useId, useRef } from "react";

function pestanaPorTecla(tecla: string, actual: Pestana): Pestana | null {
  const indice = ORDEN_PESTANAS.indexOf(actual);
  const total = ORDEN_PESTANAS.length;
  switch (tecla) {
    case TECLA_PESTANA.ANTERIOR:
      return ORDEN_PESTANAS[(indice - 1 + total) % total] ?? null;
    case TECLA_PESTANA.SIGUIENTE:
      return ORDEN_PESTANAS[(indice + 1) % total] ?? null;
    case TECLA_PESTANA.PRIMERA:
      return ORDEN_PESTANAS[0];
    case TECLA_PESTANA.ULTIMA:
      return ORDEN_PESTANAS[total - 1] ?? null;
    default:
      return null;
  }
}

function BarraDePestanas({ control, ids }: PropsBarraDePestanas) {
  const botones = useRef(new Map<Pestana, HTMLButtonElement>());

  function alTeclear(evento: KeyboardEvent<HTMLDivElement>): void {
    const destino = pestanaPorTecla(evento.key, control.pestana);
    if (destino === null) return;
    evento.preventDefault();
    control.elegir(destino);
    botones.current.get(destino)?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={TEXTO_PESTANAS.grupo}
      className={CLASE_GLOBAL.PESTANAS}
      onKeyDown={alTeclear}
    >
      {ORDEN_PESTANAS.map((pestana) => {
        const elegida = pestana === control.pestana;
        const conPunto = pestana === PESTANA.CASOS && control.cambiosSinVer;
        return (
          <button
            key={pestana}
            ref={(boton) => {
              if (boton === null) botones.current.delete(pestana);
              else botones.current.set(pestana, boton);
            }}
            type="button"
            role="tab"
            id={ids.pestana(pestana)}
            aria-selected={elegida}
            aria-controls={ids.vista(pestana)}
            tabIndex={elegida ? 0 : -1}
            className={CLASE_GLOBAL.PESTANA}
            onClick={() => control.elegir(pestana)}
          >
            {TEXTO_PESTANAS.etiqueta(pestana)}
            {conPunto ? (
              <>
                <span className={CLASE_GLOBAL.PUNTO_CAMBIOS} aria-hidden="true" />
                <span className={CLASE_GLOBAL.OCULTO}>{TEXTO_PESTANAS.cambiosSinVer}</span>
              </>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function atributosDeVista(
  conPestanas: boolean,
  control: ControlPestanas,
  ids: IdsDePestanas,
  pestana: Pestana,
): HTMLAttributes<HTMLDivElement> {
  if (!conPestanas) return {};
  return {
    role: "tabpanel",
    id: ids.vista(pestana),
    "aria-labelledby": ids.pestana(pestana),
    hidden: control.pestana !== pestana,
  };
}

export function App() {
  const { salud, refrescar } = useSalud();
  const {
    estado,
    borrador,
    cambiarBorrador,
    enviar,
    enviarTexto,
    responderConfirmacion,
    recibirConfig,
    recibirSesion,
  } = useChat(refrescar);
  const diseno = useDiseno();
  const conPestanas = diseno !== DISENO.ANCHO;
  const progresos = progresoPorCaso(estado);
  const pestanas = usePestanas(conPestanas, firmaDelProgreso(progresos));
  const base = useId();
  const ids: IdsDePestanas = {
    pestana: (pestana) => `${base}${SUFIJO_ID.PESTANA}${pestana}`,
    vista: (pestana) => `${base}${SUFIJO_ID.VISTA}${pestana}`,
  };

  useEffect(() => {
    const controlador = new AbortController();
    void obtenerConfig(controlador.signal).then((resultado) => {
      if (!controlador.signal.aborted) recibirConfig(resultado);
    });
    return () => controlador.abort();
  }, [recibirConfig]);

  const accesoConcedido = estado.acceso.tipo === ESTADO_ACCESO.CONCEDIDO;
  const sesionPorCargar = estado.hidratando ? estado.sesionId : null;

  useEffect(() => {
    if (!accesoConcedido || sesionPorCargar === null) return;
    const controlador = new AbortController();
    void obtenerSesion(sesionPorCargar, controlador.signal).then((resultado) => {
      if (!controlador.signal.aborted) recibirSesion(resultado);
    });
    return () => controlador.abort();
  }, [accesoConcedido, sesionPorCargar, recibirSesion]);

  async function alEntrar(): Promise<void> {
    recibirConfig(await obtenerConfig());
  }

  if (estado.acceso.tipo === ESTADO_ACCESO.VERIFICANDO) {
    return (
      <main aria-busy="true">
        <p role="status" className={CLASE_GLOBAL.OCULTO}>
          {TEXTO_APP.cargando}
        </p>
      </main>
    );
  }

  if (estado.acceso.tipo === ESTADO_ACCESO.PEDIDO) {
    return <PantallaAcceso aviso={estado.acceso.aviso} alEntrar={alEntrar} />;
  }

  const casos = estado.config?.casos ?? [];
  const conHistorial = estado.turnos.length > 0;

  return (
    <div className={CLASE_GLOBAL.APP} data-diseno={diseno}>
      <Encabezado fechaEjecucion={estado.config?.fechaEjecucion ?? null} salud={salud} />
      <AvisoModelo estado={salud?.llm ?? null} zona={estado.config?.zona ?? null} />
      {conPestanas ? <BarraDePestanas control={pestanas} ids={ids} /> : null}
      <div className={CLASE_GLOBAL.COLUMNAS}>
        <div
          className={CLASE_GLOBAL.VISTA_CHAT}
          {...atributosDeVista(conPestanas, pestanas, ids, PESTANA.CHAT)}
        >
          <main className={CLASE_GLOBAL.CHAT}>
            <LineaDeTiempo
              turnos={estado.turnos}
              cargando={estado.hidratando}
              aviso={estado.avisoSesion}
              enCurso={estado.enCurso}
              tarjetasConfirmacion={estado.tarjetasConfirmacion}
              alResponderConfirmacion={responderConfirmacion}
              acciones={
                <AccionesRapidas
                  casos={casos}
                  enCurso={estado.enCurso}
                  compactas={false}
                  alEnviar={enviarTexto}
                />
              }
            >
              {estado.enCurso ? (
                <IndicadorPensando etiqueta={etiquetaPensando(estado)} marca={eventosDelTurno(estado)} />
              ) : null}
            </LineaDeTiempo>
            {conHistorial ? (
              <AccionesRapidas
                casos={casos}
                enCurso={estado.enCurso}
                compactas={true}
                alEnviar={enviarTexto}
              />
            ) : null}
            <Compositor
              valor={borrador}
              maximo={estado.config?.mensajeMaximo ?? null}
              enCurso={estado.enCurso}
              bloqueado={estado.hidratando}
              alCambiar={cambiarBorrador}
              alEnviar={enviar}
            />
          </main>
        </div>
        <div
          className={CLASE_GLOBAL.VISTA_CASOS}
          {...atributosDeVista(conPestanas, pestanas, ids, PESTANA.CASOS)}
        >
          <PanelCasos progresos={progresos} />
        </div>
      </div>
    </div>
  );
}
