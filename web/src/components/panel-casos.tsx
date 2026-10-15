import { IconoChevron } from "@web/components/icons/iconos.tsx";
import { ListaArchivos } from "@web/components/lista-archivos.tsx";
import estilos from "@web/components/panel-casos.module.css";
import { ProgresoCaso } from "@web/components/progreso-caso.tsx";
import { TEXTO_PANEL } from "@web/config/strings.ts";
import { useArchivos } from "@web/hooks/usar-archivos.ts";
import type { PropsBloqueCaso, PropsPanelCasos } from "@web/types/ui.type.ts";
import { type SyntheticEvent, useEffect, useId, useState } from "react";

function BloqueCaso({ progreso, reciente, marca, alVencerAcceso }: PropsBloqueCaso) {
  const [abierto, setAbierto] = useState(reciente);
  const archivos = useArchivos({ caso: progreso.caso, activo: abierto, marca, alVencerAcceso });

  useEffect(() => {
    setAbierto(reciente);
  }, [reciente]);

  function alAlternar(evento: SyntheticEvent<HTMLDetailsElement>): void {
    setAbierto(evento.currentTarget.open);
  }

  return (
    <li className={estilos.bloque}>
      <details open={abierto} onToggle={alAlternar}>
        <summary className={estilos.resumen}>
          <span className={estilos.chevron}>
            <IconoChevron />
          </span>
          <h3 className={estilos.caso}>{progreso.caso}</h3>
        </summary>
        <div className={estilos.detalle}>
          <ProgresoCaso progreso={progreso} />
          <ListaArchivos caso={progreso.caso} control={archivos} alVer={() => undefined} />
        </div>
      </details>
    </li>
  );
}

export function PanelCasos({ progresos, marcas, enCurso, alEnviar, alVencerAcceso }: PropsPanelCasos) {
  const idTitulo = useId();
  return (
    <aside className={estilos.panel} aria-labelledby={idTitulo}>
      <div className={estilos.contenido}>
        <h2 id={idTitulo} className={estilos.titulo}>
          {TEXTO_PANEL.titulo}
        </h2>
        {progresos.length === 0 ? (
          <p className={estilos.vacio}>{TEXTO_PANEL.vacio}</p>
        ) : (
          <ul className={estilos.casos}>
            {progresos.map((progreso, indice) => (
              <BloqueCaso
                key={progreso.caso}
                progreso={progreso}
                reciente={indice === 0}
                marca={marcas.get(progreso.caso) ?? 0}
                enCurso={enCurso}
                alEnviar={alEnviar}
                alVencerAcceso={alVencerAcceso}
              />
            ))}
          </ul>
        )}
      </div>
      <p className={estilos.pie}>{TEXTO_PANEL.pie}</p>
    </aside>
  );
}
