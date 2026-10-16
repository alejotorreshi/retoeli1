import { IconoEnCurso } from "@web/compartido/icono-en-curso/icono-en-curso.tsx";
import { IconoCheck, IconoPendiente, IconoReloj, IconoX } from "@web/compartido/iconos/iconos.tsx";
import { ESTADO_ETAPA } from "@web/config/constants/ui.constants.ts";
import { TEXTO_PROGRESO } from "@web/config/strings.ts";
import estilos from "@web/features/casos/progreso-caso/progreso-caso.module.css";
import type { EstadoEtapa } from "@web/types/chat.type.ts";
import type { ComponenteIcono, PropsIconoDeEtapa, PropsProgresoCaso } from "@web/types/ui.type.ts";

const CLASE_DE_ESTADO = {
  [ESTADO_ETAPA.PENDIENTE]: estilos.pendiente,
  [ESTADO_ETAPA.EN_CURSO]: estilos.enCurso,
  [ESTADO_ETAPA.HECHA]: estilos.hecha,
  [ESTADO_ETAPA.ERROR]: estilos.error,
  [ESTADO_ETAPA.ESPERANDO]: estilos.esperando,
  [ESTADO_ETAPA.CANCELADA]: estilos.cancelada,
} as const satisfies Record<EstadoEtapa, string | undefined>;

const ICONO_DE_ESTADO = {
  [ESTADO_ETAPA.PENDIENTE]: IconoPendiente,
  [ESTADO_ETAPA.EN_CURSO]: IconoEnCurso,
  [ESTADO_ETAPA.HECHA]: IconoCheck,
  [ESTADO_ETAPA.ERROR]: IconoX,
  [ESTADO_ETAPA.ESPERANDO]: IconoReloj,
  [ESTADO_ETAPA.CANCELADA]: IconoX,
} as const satisfies Record<EstadoEtapa, ComponenteIcono>;

function IconoDeEtapa({ estado }: PropsIconoDeEtapa) {
  const Icono = ICONO_DE_ESTADO[estado];
  return <Icono />;
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
