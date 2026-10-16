import { IconoChevron } from "@web/compartido/iconos/iconos.tsx";
import { AvisoDiscoEfimero } from "@web/components/aviso-disco-efimero.tsx";
import { DialogoVistaPrevia } from "@web/components/dialogo-vista-previa.tsx";
import { ProgresoCaso } from "@web/components/progreso-caso.tsx";
import { ListaArchivos } from "@web/features/archivos/lista-archivos/lista-archivos.tsx";
import estilos from "@web/features/casos/bloque-caso/bloque-caso.module.css";
import { useBloqueCaso } from "@web/features/casos/bloque-caso/usar-bloque-caso.ts";
import type { PropsBloqueCaso } from "@web/types/ui.type.ts";

export function BloqueCaso({ progreso, reciente, marca, envioDeshabilitado }: PropsBloqueCaso) {
  const {
    abierto,
    alAlternar,
    archivos,
    vistaPrevia,
    alVer,
    alCerrarVistaPrevia,
    discoBorrado,
    enviarTexto,
    vencerAcceso,
  } = useBloqueCaso({ progreso, reciente, marca });

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
          {discoBorrado ? (
            <AvisoDiscoEfimero
              caso={progreso.caso}
              deshabilitado={envioDeshabilitado}
              alProcesar={enviarTexto}
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
          alVencerAcceso={vencerAcceso}
        />
      </details>
    </li>
  );
}
