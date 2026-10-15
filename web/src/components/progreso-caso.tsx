import {
  IconoCheck,
  IconoGirando,
  IconoPendiente,
  IconoReloj,
  IconoX,
} from "@web/components/icons/iconos.tsx";
import estilos from "@web/components/progreso-caso.module.css";
import { ESTADO_ETAPA } from "@web/config/constants/ui.constants.ts";
import { TEXTO_PROGRESO } from "@web/config/strings.ts";
import type { EstadoEtapa } from "@web/types/chat.type.ts";
import type { PropsIconoDeEtapa, PropsProgresoCaso } from "@web/types/ui.type.ts";

const CLASE_DE_ESTADO = {
  [ESTADO_ETAPA.PENDIENTE]: estilos.pendiente,
  [ESTADO_ETAPA.EN_CURSO]: estilos.enCurso,
  [ESTADO_ETAPA.HECHA]: estilos.hecha,
  [ESTADO_ETAPA.ERROR]: estilos.error,
  [ESTADO_ETAPA.ESPERANDO]: estilos.esperando,
  [ESTADO_ETAPA.CANCELADA]: estilos.cancelada,
} as const satisfies Record<EstadoEtapa, string | undefined>;

function IconoDeEtapa({ estado }: PropsIconoDeEtapa) {
  switch (estado) {
    case ESTADO_ETAPA.EN_CURSO:
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
    case ESTADO_ETAPA.HECHA:
      return <IconoCheck />;
    case ESTADO_ETAPA.ESPERANDO:
      return <IconoReloj />;
    case ESTADO_ETAPA.ERROR:
    case ESTADO_ETAPA.CANCELADA:
      return <IconoX />;
    default:
      return <IconoPendiente />;
  }
}

export function ProgresoCaso({ progreso }: PropsProgresoCaso) {
  return (
    <ol className={estilos.etapas} aria-label={TEXTO_PROGRESO.lista(progreso.caso)}>
      {progreso.etapas.map(({ etapa, estado }) => (
        <li
          key={etapa}
          className={`${estilos.etapa} ${CLASE_DE_ESTADO[estado]}`}
          aria-label={TEXTO_PROGRESO.aria(etapa, estado)}
        >
          <span className={estilos.icono}>
            <IconoDeEtapa estado={estado} />
          </span>
          <span className={estilos.nombre}>{TEXTO_PROGRESO.etapa(etapa)}</span>
        </li>
      ))}
    </ol>
  );
}
