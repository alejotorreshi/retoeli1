import { IconoAlerta } from "@web/compartido/iconos/iconos.tsx";
import {
  ESTADO_FIRMA,
  ESTADO_TARJETA_CONFIRMACION,
  TAMANO_ICONO,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_CONFIRMACION, TEXTO_RESULTADO } from "@web/config/strings.ts";
import estilos from "@web/features/confirmacion/tarjeta-confirmacion/tarjeta-confirmacion.module.css";
import {
  usePilaConfirmaciones,
  useTarjetaConfirmacion,
} from "@web/features/confirmacion/tarjeta-confirmacion/usar-tarjeta-confirmacion.ts";
import type { EstadoFirma, EstadoTarjetaConfirmacion } from "@web/types/chat.type.ts";
import type { PropsPilaConfirmaciones, PropsTarjetaConfirmacion } from "@web/types/ui.type.ts";

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

export function TarjetaConfirmacion(props: PropsTarjetaConfirmacion) {
  const { tarjeta } = props;
  const {
    idTitulo,
    idAyuda,
    firma,
    abierta,
    bloqueada,
    cantidadBloqueos,
    ayuda,
    textoConfirmar,
    textoCancelar,
    alConfirmar,
    alCancelar,
  } = useTarjetaConfirmacion(props);

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
              onClick={alConfirmar}
            >
              {textoConfirmar}
            </button>
            <button
              type="button"
              className={`${estilos.boton} ${estilos.cancelar}`}
              aria-disabled={bloqueada}
              aria-describedby={bloqueada ? idAyuda : undefined}
              onClick={alCancelar}
            >
              {textoCancelar}
            </button>
          </div>
          {bloqueada ? (
            <p id={idAyuda} className={estilos.ayuda}>
              {ayuda}
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

export function PilaConfirmaciones({
  tarjetas,
  turnos,
  ocupada,
  pausada,
  alResponder,
}: PropsPilaConfirmaciones) {
  const pila = usePilaConfirmaciones(tarjetas, turnos);
  if (pila.length === 0) return null;
  return (
    <li className={estilos.pila}>
      {pila.map(({ tarjeta, listoParaFirma }) => (
        <TarjetaConfirmacion
          key={tarjeta.clave}
          tarjeta={tarjeta}
          listoParaFirma={listoParaFirma}
          ocupada={ocupada}
          pausada={pausada}
          alResponder={alResponder}
        />
      ))}
    </li>
  );
}
