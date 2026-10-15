import { IconoAlerta } from "@web/components/icons/iconos.tsx";
import estilos from "@web/components/tarjeta-confirmacion.module.css";
import {
  ESTADO_FIRMA,
  ESTADO_TARJETA_CONFIRMACION,
  TAMANO_ICONO,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_CONFIRMACION, TEXTO_RESULTADO } from "@web/config/strings.ts";
import { estadoDeFirma, listoParaFirmaHasta } from "@web/state/casos.ts";
import type { EstadoFirma, EstadoTarjetaConfirmacion, TipoAccion } from "@web/types/chat.type.ts";
import type { PropsPilaConfirmaciones, PropsTarjetaConfirmacion } from "@web/types/ui.type.ts";
import { useId } from "react";
import { TIPO_ACCION } from "@/config/constants/confirmation.constants.ts";

const CLASE_DE_FIRMA = {
  [ESTADO_FIRMA.LISTO]: estilos.exito,
  [ESTADO_FIRMA.NO_LISTO]: estilos.error,
  [ESTADO_FIRMA.SIN_ARMAR]: estilos.info,
} as const satisfies Record<EstadoFirma, string | undefined>;

const CLASE_DE_DESENLACE = {
  [ESTADO_TARJETA_CONFIRMACION.ABIERTA]: estilos.info,
  [ESTADO_TARJETA_CONFIRMACION.REGISTRADA]: estilos.exito,
  [ESTADO_TARJETA_CONFIRMACION.CANCELADA]: estilos.info,
  [ESTADO_TARJETA_CONFIRMACION.REEMPLAZADA]: estilos.info,
} as const satisfies Record<EstadoTarjetaConfirmacion, string | undefined>;

function textoDelBoton(tipo: TipoAccion, enviando: TipoAccion | null, texto: string): string {
  return enviando === tipo ? TEXTO_CONFIRMACION.enviando : texto;
}

export function TarjetaConfirmacion({
  tarjeta,
  listoParaFirma,
  ocupada,
  alResponder,
}: PropsTarjetaConfirmacion) {
  const idTitulo = useId();
  const idAyuda = useId();
  const firma = estadoDeFirma(listoParaFirma);
  const abierta = tarjeta.estado === ESTADO_TARJETA_CONFIRMACION.ABIERTA;
  const bloqueada = ocupada || tarjeta.enviando !== null;
  const cantidadBloqueos = tarjeta.bloqueosLegibles.length;

  function responder(tipo: TipoAccion): void {
    if (bloqueada) return;
    alResponder({ tipo, caso: tarjeta.caso });
  }

  return (
    <article
      className={abierta ? estilos.tarjeta : `${estilos.tarjeta} ${estilos.resuelta}`}
      aria-labelledby={idTitulo}
    >
      <header className={estilos.encabezado}>
        <span className={estilos.icono}>
          <IconoAlerta tamano={TAMANO_ICONO.GRANDE} />
        </span>
        <h2 id={idTitulo} className={estilos.titulo}>
          {TEXTO_CONFIRMACION.titulo}
        </h2>
      </header>
      <p className={estilos.dato}>
        {TEXTO_CONFIRMACION.caso}
        <span className={estilos.caso}>{tarjeta.caso}</span>
      </p>
      <p className={estilos.dato}>{TEXTO_CONFIRMACION.accion}</p>
      <p className={estilos.dato}>
        <span className={`${estilos.badge} ${CLASE_DE_FIRMA[firma]}`}>{TEXTO_RESULTADO.firma(firma)}</span>
      </p>
      {cantidadBloqueos === 0 ? null : (
        <div className={estilos.bloque}>
          <p className={estilos.termino}>{TEXTO_CONFIRMACION.bloqueos}</p>
          <ul className={estilos.bloqueos}>
            {tarjeta.bloqueosLegibles.map((bloqueo) => (
              <li key={bloqueo}>{bloqueo}</li>
            ))}
          </ul>
          <p className={estilos.advertencia}>{TEXTO_CONFIRMACION.conBloqueos(cantidadBloqueos)}</p>
        </div>
      )}
      <p className={estilos.nota}>{TEXTO_CONFIRMACION.nota}</p>
      {abierta ? (
        <div className={estilos.pie}>
          <div className={estilos.acciones}>
            <button
              type="button"
              className={`${estilos.boton} ${estilos.confirmar}`}
              aria-disabled={bloqueada}
              aria-describedby={bloqueada ? idAyuda : undefined}
              onClick={() => responder(TIPO_ACCION.CONFIRMAR)}
            >
              {textoDelBoton(TIPO_ACCION.CONFIRMAR, tarjeta.enviando, TEXTO_CONFIRMACION.confirmar)}
            </button>
          </div>
          {bloqueada ? (
            <p id={idAyuda} className={estilos.ayuda}>
              {TEXTO_CONFIRMACION.ocupada}
            </p>
          ) : null}
        </div>
      ) : (
        <p className={estilos.dato}>
          <span className={`${estilos.badge} ${CLASE_DE_DESENLACE[tarjeta.estado]}`}>
            {TEXTO_CONFIRMACION.desenlace(tarjeta.estado)}
          </span>
        </p>
      )}
    </article>
  );
}

export function PilaConfirmaciones({ tarjetas, turnos, ocupada, alResponder }: PropsPilaConfirmaciones) {
  if (tarjetas.length === 0) return null;
  return (
    <li className={estilos.pila}>
      {tarjetas.map((tarjeta) => (
        <TarjetaConfirmacion
          key={tarjeta.clave}
          tarjeta={tarjeta}
          listoParaFirma={listoParaFirmaHasta(turnos, tarjeta.caso, tarjeta.resueltaEnTurno)}
          ocupada={ocupada}
          alResponder={alResponder}
        />
      ))}
    </li>
  );
}
