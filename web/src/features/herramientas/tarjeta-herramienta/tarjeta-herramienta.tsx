import {
  IconoCheck,
  IconoChevron,
  IconoGirando,
  IconoReloj,
  IconoX,
} from "@web/compartido/iconos/iconos.tsx";
import { ESTADO_HERRAMIENTA } from "@web/config/constants/ui.constants.ts";
import { TEXTO_HERRAMIENTA } from "@web/config/strings.ts";
import estilos from "@web/features/herramientas/tarjeta-herramienta/tarjeta-herramienta.module.css";
import { controlTarjetaHerramienta } from "@web/features/herramientas/tarjeta-herramienta/usar-tarjeta-herramienta.ts";
import type { EstadoHerramienta } from "@web/types/chat.type.ts";
import type { PropsIconoDeEstado, PropsTarjetaHerramienta } from "@web/types/ui.type.ts";

const CLASE_DE_ESTADO = {
  [ESTADO_HERRAMIENTA.EN_CURSO]: estilos.enCurso,
  [ESTADO_HERRAMIENTA.CORRECTA]: estilos.correcta,
  [ESTADO_HERRAMIENTA.ERROR]: estilos.error,
} as const satisfies Record<EstadoHerramienta, string | undefined>;

function IconoDeEstado({ estado }: PropsIconoDeEstado) {
  switch (estado) {
    case ESTADO_HERRAMIENTA.EN_CURSO:
      return (
        <span className={`${estilos.icono} ${estilos.enCurso}`}>
          <span className={estilos.giro}>
            <IconoGirando />
          </span>
          <span className={estilos.quieto}>
            <IconoReloj />
          </span>
        </span>
      );
    case ESTADO_HERRAMIENTA.CORRECTA:
      return (
        <span className={`${estilos.icono} ${estilos.correcta}`}>
          <IconoCheck />
        </span>
      );
    default:
      return (
        <span className={`${estilos.icono} ${estilos.error}`}>
          <IconoX />
        </span>
      );
  }
}

export function TarjetaHerramienta({ llamada }: PropsTarjetaHerramienta) {
  const { fallida, argumentos } = controlTarjetaHerramienta(llamada);
  return (
    <li>
      <details className={estilos.tarjeta}>
        <summary className={estilos.fila}>
          <span className={estilos.chevron}>
            <IconoChevron />
          </span>
          <IconoDeEstado estado={llamada.estado} />
          <span className={estilos.etiqueta}>{TEXTO_HERRAMIENTA.etiqueta(llamada.herramienta)}</span>
          {llamada.caso === null ? null : <span className={estilos.caso}>{llamada.caso}</span>}
          <span className={`${estilos.badge} ${CLASE_DE_ESTADO[llamada.estado]}`}>
            {TEXTO_HERRAMIENTA.estado(llamada.estado)}
          </span>
          <span className={estilos.resumen}>{llamada.resumen ?? ""}</span>
        </summary>
        <div className={estilos.cuerpo}>
          <dl className={estilos.detalle}>
            <dt className={estilos.termino}>{TEXTO_HERRAMIENTA.herramienta}</dt>
            <dd className={estilos.tecnico}>{llamada.herramienta}</dd>
            <dt className={estilos.termino}>{TEXTO_HERRAMIENTA.argumentos}</dt>
            <dd className={estilos.valor}>
              <pre className={estilos.argumentos}>{argumentos}</pre>
            </dd>
            <dt className={estilos.termino}>{TEXTO_HERRAMIENTA.resultado}</dt>
            <dd className={estilos.resultado}>{llamada.resumen ?? TEXTO_HERRAMIENTA.sinResultado}</dd>
          </dl>
          {fallida && llamada.codigo !== null ? (
            <p className={estilos.codigo}>{TEXTO_HERRAMIENTA.codigo(llamada.codigo)}</p>
          ) : null}
        </div>
      </details>
    </li>
  );
}
