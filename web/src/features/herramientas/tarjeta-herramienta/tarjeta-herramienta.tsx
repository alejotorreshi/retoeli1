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
import type { ComponenteIcono, PropsIconoDeEstado, PropsTarjetaHerramienta } from "@web/types/ui.type.ts";

const CLASE_DE_ESTADO = {
  [ESTADO_HERRAMIENTA.EN_CURSO]: estilos.enCurso,
  [ESTADO_HERRAMIENTA.CORRECTA]: estilos.correcta,
  [ESTADO_HERRAMIENTA.ERROR]: estilos.error,
} as const satisfies Record<EstadoHerramienta, string | undefined>;

function IconoHerramientaEnCurso() {
  return (
    <>
      <span className={estilos.giro}>
        <IconoGirando />
      </span>
      <span className={estilos.quieto}>
        <IconoReloj />
      </span>
    </>
  );
}

const ICONO_DE_ESTADO = {
  [ESTADO_HERRAMIENTA.EN_CURSO]: IconoHerramientaEnCurso,
  [ESTADO_HERRAMIENTA.CORRECTA]: IconoCheck,
  [ESTADO_HERRAMIENTA.ERROR]: IconoX,
} as const satisfies Record<EstadoHerramienta, ComponenteIcono>;

function IconoDeEstado({ estado }: PropsIconoDeEstado) {
  const Icono = ICONO_DE_ESTADO[estado];
  return (
    <span className={`${estilos.icono} ${CLASE_DE_ESTADO[estado]}`}>
      <Icono />
    </span>
  );
}

export function TarjetaHerramienta({ llamada }: PropsTarjetaHerramienta) {
  const { argumentos, resumen, resultado, codigoVisible } = controlTarjetaHerramienta(llamada);
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
          <span className={estilos.resumen}>{resumen}</span>
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
            <dd className={estilos.resultado}>{resultado}</dd>
          </dl>
          {codigoVisible === null ? null : <p className={estilos.codigo}>{codigoVisible}</p>}
        </div>
      </details>
    </li>
  );
}
