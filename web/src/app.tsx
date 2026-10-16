import { AccionesRapidas } from "@web/components/acciones-rapidas.tsx";
import { Compositor } from "@web/components/compositor.tsx";
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
import { AvisoModelo } from "@web/features/encabezado/aviso-modelo/aviso-modelo.tsx";
import { Encabezado } from "@web/features/encabezado/encabezado/encabezado.tsx";
import { DialogoNuevaSesion } from "@web/features/sesion/dialogo-nueva-sesion/dialogo-nueva-sesion.tsx";
import { useDiseno } from "@web/hooks/usar-diseno.ts";
import { usePestanas } from "@web/hooks/usar-pestanas.ts";
import { ProveedorAlmacen } from "@web/store/proveedor-almacen.tsx";
import {
  seleccionarAcceso,
  seleccionarAvisoSesion,
  seleccionarBorrador,
  seleccionarCasos,
  seleccionarConHistorial,
  seleccionarEnCurso,
  seleccionarEnvioDeshabilitado,
  seleccionarEnvioEnPausa,
  seleccionarEtiquetaPensando,
  seleccionarEventosDelTurno,
  seleccionarFirmaDelProgreso,
  seleccionarHidratando,
  seleccionarMarcasDeArchivos,
  seleccionarMensajeMaximo,
  seleccionarProgresos,
  seleccionarTarjetasConfirmacion,
  seleccionarTurnos,
  seleccionarUsoDeSesion,
} from "@web/store/selectores.ts";
import { useAcciones, useSeleccion, useSincronizacion } from "@web/store/usar-almacen.ts";
import type { AccionDeAviso } from "@web/types/chat.type.ts";
import type {
  ControlPestanas,
  IdsDePestanas,
  Pestana,
  PropsApp,
  PropsBarraDePestanas,
} from "@web/types/ui.type.ts";
import { type HTMLAttributes, type KeyboardEvent, useId, useRef } from "react";

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

function Pantalla() {
  useSincronizacion();
  const acciones = useAcciones();
  const acceso = useSeleccion(seleccionarAcceso);
  const casos = useSeleccion(seleccionarCasos);
  const mensajeMaximo = useSeleccion(seleccionarMensajeMaximo);
  const turnos = useSeleccion(seleccionarTurnos);
  const conHistorial = useSeleccion(seleccionarConHistorial);
  const enCurso = useSeleccion(seleccionarEnCurso);
  const hidratando = useSeleccion(seleccionarHidratando);
  const avisoSesion = useSeleccion(seleccionarAvisoSesion);
  const tarjetasConfirmacion = useSeleccion(seleccionarTarjetasConfirmacion);
  const borrador = useSeleccion(seleccionarBorrador);
  const enPausa = useSeleccion(seleccionarEnvioEnPausa);
  const envioDeshabilitado = useSeleccion(seleccionarEnvioDeshabilitado);
  const uso = useSeleccion(seleccionarUsoDeSesion);
  const etiquetaPensando = useSeleccion(seleccionarEtiquetaPensando);
  const eventosDelTurno = useSeleccion(seleccionarEventosDelTurno);
  const progresos = useSeleccion(seleccionarProgresos);
  const firmaDelProgreso = useSeleccion(seleccionarFirmaDelProgreso);
  const marcas = useSeleccion(seleccionarMarcasDeArchivos);
  const diseno = useDiseno();
  const conPestanas = diseno !== DISENO.ANCHO;
  const pestanas = usePestanas(conPestanas, firmaDelProgreso);
  const base = useId();
  const ids: IdsDePestanas = {
    pestana: (pestana) => `${base}${SUFIJO_ID.PESTANA}${pestana}`,
    vista: (pestana) => `${base}${SUFIJO_ID.VISTA}${pestana}`,
  };

  function alAccionDeAviso(accion: AccionDeAviso): void {
    if (accion === ACCION_AVISO.RECARGAR) acciones.recargar();
    if (accion === ACCION_AVISO.NUEVA_SESION) acciones.abrirNuevaSesion();
    if (accion === ACCION_AVISO.VOLVER_SESION_ANTERIOR) acciones.volverASesionAnterior();
  }

  function alEntrar(): Promise<void> {
    return acciones.cargarConfig(new AbortController().signal);
  }

  if (acceso.tipo === ESTADO_ACCESO.VERIFICANDO) {
    return (
      <main aria-busy="true">
        <p role="status" className={CLASE_GLOBAL.OCULTO}>
          {TEXTO_APP.cargando}
        </p>
      </main>
    );
  }

  if (acceso.tipo === ESTADO_ACCESO.PEDIDO) {
    return <PantallaAcceso aviso={acceso.aviso} alEntrar={alEntrar} />;
  }

  return (
    <div className={CLASE_GLOBAL.APP} data-diseno={diseno}>
      <Encabezado angosto={diseno === DISENO.ANGOSTO} />
      <AvisoModelo />
      {conPestanas ? <BarraDePestanas control={pestanas} ids={ids} /> : null}
      <div className={CLASE_GLOBAL.COLUMNAS}>
        <div
          className={CLASE_GLOBAL.VISTA_CHAT}
          {...atributosDeVista(conPestanas, pestanas, ids, PESTANA.CHAT)}
        >
          <main className={CLASE_GLOBAL.CHAT}>
            <LineaDeTiempo
              turnos={turnos}
              cargando={hidratando}
              aviso={avisoSesion}
              enCurso={enCurso}
              pausada={enPausa}
              tarjetasConfirmacion={tarjetasConfirmacion}
              alResponderConfirmacion={acciones.responderConfirmacion}
              alAccionDeAviso={alAccionDeAviso}
              acciones={
                <AccionesRapidas
                  casos={casos}
                  deshabilitadas={envioDeshabilitado}
                  compactas={false}
                  angosto={false}
                  alEnviar={acciones.enviarTexto}
                />
              }
            >
              {enCurso ? <IndicadorPensando etiqueta={etiquetaPensando} marca={eventosDelTurno} /> : null}
            </LineaDeTiempo>
            {conHistorial ? (
              <AccionesRapidas
                casos={casos}
                deshabilitadas={envioDeshabilitado}
                compactas={true}
                angosto={diseno === DISENO.ANGOSTO}
                alEnviar={acciones.enviarTexto}
              />
            ) : null}
            <Compositor
              valor={borrador}
              maximo={mensajeMaximo}
              enCurso={enCurso}
              bloqueado={hidratando}
              pausado={enPausa}
              uso={uso}
              alCambiar={acciones.cambiarBorrador}
              alEnviar={acciones.enviar}
              alDetener={acciones.detener}
            />
          </main>
        </div>
        <div
          className={CLASE_GLOBAL.VISTA_CASOS}
          {...atributosDeVista(conPestanas, pestanas, ids, PESTANA.CASOS)}
        >
          <PanelCasos
            progresos={progresos}
            marcas={marcas}
            envioDeshabilitado={envioDeshabilitado}
            alEnviar={acciones.enviarTexto}
            alVencerAcceso={acciones.vencerAcceso}
          />
        </div>
      </div>
      <DialogoNuevaSesion />
    </div>
  );
}

export function App({ instancia }: PropsApp) {
  return (
    <ProveedorAlmacen instancia={instancia}>
      <Pantalla />
    </ProveedorAlmacen>
  );
}
