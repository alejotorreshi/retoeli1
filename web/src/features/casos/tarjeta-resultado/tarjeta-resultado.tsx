import { ESTADO_FIRMA, TONO_CONTADOR } from "@web/config/constants/ui.constants.ts";
import { TEXTO_RESULTADO } from "@web/config/strings.ts";
import estilos from "@web/features/casos/tarjeta-resultado/tarjeta-resultado.module.css";
import { useTarjetaResultado } from "@web/features/casos/tarjeta-resultado/usar-tarjeta-resultado.ts";
import type { EstadoFirma } from "@web/types/chat.type.ts";
import type { PropsBloqueosResultado, PropsTarjetaResultado, TonoContador } from "@web/types/ui.type.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";

const CLASE_DE_TONO = {
  [ESTADO_CAMPO.LLENO]: estilos.lleno,
  [ESTADO_CAMPO.FALTANTE]: estilos.faltante,
  [ESTADO_CAMPO.REQUIERE_CONFIRMACION]: estilos.porConfirmar,
  [TONO_CONTADOR.TENUE]: estilos.tenue,
} as const satisfies Record<TonoContador, string | undefined>;

const CLASE_DE_FIRMA = {
  [ESTADO_FIRMA.LISTO]: estilos.listo,
  [ESTADO_FIRMA.NO_LISTO]: estilos.noListo,
  [ESTADO_FIRMA.SIN_ARMAR]: estilos.sinArmar,
} as const satisfies Record<EstadoFirma, string | undefined>;

function Bloqueos({ bloqueos }: PropsBloqueosResultado) {
  if (bloqueos === null) return <dd className={estilos.valor}>{TEXTO_RESULTADO.sinDato}</dd>;
  if (bloqueos.length === 0) return <dd className={estilos.valor}>{TEXTO_RESULTADO.sinBloqueos}</dd>;
  return (
    <dd className={estilos.valor}>
      <ul className={estilos.bloqueos}>
        {bloqueos.map((bloqueo) => (
          <li key={bloqueo}>{bloqueo}</li>
        ))}
      </ul>
    </dd>
  );
}

export function TarjetaResultado({ resultado }: PropsTarjetaResultado) {
  const { idTitulo, firma, paqueteArmado, contadores } = useTarjetaResultado(resultado);
  return (
    <li>
      <article className={estilos.tarjeta} aria-labelledby={idTitulo}>
        <header className={estilos.encabezado}>
          <h2 id={idTitulo} className={estilos.caso}>
            {resultado.caso}
          </h2>
          <span className={`${estilos.badge} ${estilos.neutro}`}>
            {TEXTO_RESULTADO.formato(resultado.formato)}
          </span>
          <span className={`${estilos.badge} ${estilos.neutro}`}>{TEXTO_RESULTADO.pais(resultado.pais)}</span>
        </header>
        <ul className={estilos.contadores}>
          {contadores.map((contador) => (
            <li key={contador.estado} className={estilos.celda}>
              <span className={`${estilos.numero} ${CLASE_DE_TONO[contador.tono]}`}>
                {TEXTO_RESULTADO.cantidad(contador.cantidad)}
              </span>
              <span className={estilos.rotulo}>{TEXTO_RESULTADO.contador(contador.estado)}</span>
            </li>
          ))}
        </ul>
        <p className={estilos.firma}>
          <span className={`${estilos.badge} ${CLASE_DE_FIRMA[firma]}`}>{TEXTO_RESULTADO.firma(firma)}</span>
        </p>
        <dl className={estilos.detalle}>
          <dt className={estilos.termino}>{TEXTO_RESULTADO.bloqueos}</dt>
          <Bloqueos bloqueos={paqueteArmado ? resultado.bloqueosLegibles : null} />
          <dt className={estilos.termino}>{TEXTO_RESULTADO.ruta}</dt>
          <dd className={resultado.carpeta === null ? estilos.valor : estilos.ruta}>
            {resultado.carpeta ?? TEXTO_RESULTADO.sinDato}
          </dd>
        </dl>
        {resultado.aviso === null ? null : <p className={estilos.portal}>{TEXTO_RESULTADO.portal}</p>}
      </article>
    </li>
  );
}
