import { IconoChevron } from "@web/compartido/iconos/iconos.tsx";
import { AvisoDiscoEfimero } from "@web/components/aviso-disco-efimero.tsx";
import { DialogoVistaPrevia } from "@web/components/dialogo-vista-previa.tsx";
import { ListaArchivos } from "@web/components/lista-archivos.tsx";
import estilos from "@web/components/panel-casos.module.css";
import { ProgresoCaso } from "@web/components/progreso-caso.tsx";
import { TEXTO_PANEL } from "@web/config/strings.ts";
import { discoBorrado } from "@web/features/casos/estado/casos.ts";
import { useArchivos } from "@web/hooks/usar-archivos.ts";
import type { ArchivoUi } from "@web/types/chat.type.ts";
import type { PropsBloqueCaso, PropsPanelCasos, VistaPreviaAbierta } from "@web/types/ui.type.ts";
import { type SyntheticEvent, useEffect, useId, useState } from "react";

function BloqueCaso({
  progreso,
  reciente,
  marca,
  envioDeshabilitado,
  alEnviar,
  alVencerAcceso,
}: PropsBloqueCaso) {
  const [abierto, setAbierto] = useState(reciente);
  const [vistaPrevia, setVistaPrevia] = useState<VistaPreviaAbierta | null>(null);
  const archivos = useArchivos({ caso: progreso.caso, activo: abierto, marca, alVencerAcceso });

  function alVer(archivo: ArchivoUi, disparador: HTMLElement): void {
    setVistaPrevia({ archivo, disparador });
  }

  function alCerrarVistaPrevia(): void {
    const disparador = vistaPrevia?.disparador ?? null;
    setVistaPrevia(null);
    if (disparador?.isConnected) disparador.focus();
  }

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
          {discoBorrado(progreso, archivos.estado, archivos.borrados) ? (
            <AvisoDiscoEfimero
              caso={progreso.caso}
              deshabilitado={envioDeshabilitado}
              alProcesar={alEnviar}
            />
          ) : null}
          <ListaArchivos caso={progreso.caso} control={archivos} alVer={alVer} />
        </div>
        <DialogoVistaPrevia
          caso={progreso.caso}
          abierta={vistaPrevia}
          alCerrar={alCerrarVistaPrevia}
          alDescargar={archivos.descargar}
          alNoEncontrado={archivos.marcarBorrados}
          alVencerAcceso={alVencerAcceso}
        />
      </details>
    </li>
  );
}

export function PanelCasos({
  progresos,
  marcas,
  envioDeshabilitado,
  alEnviar,
  alVencerAcceso,
}: PropsPanelCasos) {
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
                envioDeshabilitado={envioDeshabilitado}
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
