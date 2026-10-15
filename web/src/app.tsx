import { obtenerConfig } from "@web/api/cliente-api.ts";
import { AccionesRapidas } from "@web/components/acciones-rapidas.tsx";
import { AvisoModelo } from "@web/components/aviso-modelo.tsx";
import { Compositor } from "@web/components/compositor.tsx";
import { DialogoNuevaSesion } from "@web/components/dialogo-nueva-sesion.tsx";
import { Encabezado } from "@web/components/encabezado.tsx";
import { IndicadorPensando } from "@web/components/indicador-pensando.tsx";
import { LineaDeTiempo } from "@web/components/linea-de-tiempo.tsx";
import { PanelCasos } from "@web/components/panel-casos.tsx";
import { PantallaAcceso } from "@web/components/pantalla-acceso.tsx";
import {
  ACCION_AVISO,
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
import { useReintentoConfig } from "@web/hooks/usar-reintento-config.ts";
import { useSalud } from "@web/hooks/usar-salud.ts";
import { firmaDelProgreso, marcasDeArchivos, progresoPorCaso } from "@web/state/casos.ts";
import { etiquetaPensando, eventosDelTurno, faltaConfig, usoDeSesion } from "@web/state/conversacion.ts";
import { envioEnPausa } from "@web/state/modelo.ts";
import type { AccionDeAviso } from "@web/types/chat.type.ts";
import type { ControlPestanas, IdsDePestanas, Pestana, PropsBarraDePestanas } from "@web/types/ui.type.ts";
import { type HTMLAttributes, type KeyboardEvent, useEffect, useId, useRef, useState } from "react";

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
  const { salud, refrescar, comprobando } = useSalud();
  const {
    estado,
    borrador,
    cambiarBorrador,
    enviar,
    enviarTexto,
    responderConfirmacion,
    recibirConfig,
    detener,
    recargar,
    nuevaSesion,
    vencerAcceso,
  } = useChat(refrescar);
  const [nuevaSesionAbierta, setNuevaSesionAbierta] = useState(false);
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

  useReintentoConfig(faltaConfig(estado), recibirConfig);

  function alAccionDeAviso(accion: AccionDeAviso): void {
    if (accion === ACCION_AVISO.RECARGAR) recargar();
    if (accion === ACCION_AVISO.NUEVA_SESION) setNuevaSesionAbierta(true);
  }

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
  const enPausa = envioEnPausa(salud?.llm ?? null);
  const envioDeshabilitado = estado.enCurso || enPausa;

  return (
    <div className={CLASE_GLOBAL.APP} data-diseno={diseno}>
      <Encabezado
        fechaEjecucion={estado.config?.fechaEjecucion ?? null}
        salud={salud}
        angosto={diseno === DISENO.ANGOSTO}
        nuevaSesionDeshabilitada={estado.enCurso}
        alNuevaSesion={() => setNuevaSesionAbierta(true)}
      />
      <AvisoModelo
        estado={salud?.llm ?? null}
        zona={estado.config?.zona ?? null}
        comprobando={comprobando}
        alComprobar={refrescar}
      />
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
              pausada={enPausa}
              tarjetasConfirmacion={estado.tarjetasConfirmacion}
              alResponderConfirmacion={responderConfirmacion}
              alAccionDeAviso={alAccionDeAviso}
              acciones={
                <AccionesRapidas
                  casos={casos}
                  deshabilitadas={envioDeshabilitado}
                  compactas={false}
                  angosto={false}
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
                deshabilitadas={envioDeshabilitado}
                compactas={true}
                angosto={diseno === DISENO.ANGOSTO}
                alEnviar={enviarTexto}
              />
            ) : null}
            <Compositor
              valor={borrador}
              maximo={estado.config?.mensajeMaximo ?? null}
              enCurso={estado.enCurso}
              bloqueado={estado.hidratando}
              pausado={enPausa}
              uso={usoDeSesion(estado)}
              alCambiar={cambiarBorrador}
              alEnviar={enviar}
              alDetener={detener}
            />
          </main>
        </div>
        <div
          className={CLASE_GLOBAL.VISTA_CASOS}
          {...atributosDeVista(conPestanas, pestanas, ids, PESTANA.CASOS)}
        >
          <PanelCasos
            progresos={progresos}
            marcas={marcasDeArchivos(estado)}
            envioDeshabilitado={envioDeshabilitado}
            alEnviar={enviarTexto}
            alVencerAcceso={vencerAcceso}
          />
        </div>
      </div>
      <DialogoNuevaSesion
        abierto={nuevaSesionAbierta}
        alCerrar={() => setNuevaSesionAbierta(false)}
        alConfirmar={nuevaSesion}
      />
    </div>
  );
}
