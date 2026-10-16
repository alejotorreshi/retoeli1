import { ESTADO_ACCESO } from "@web/config/constants/ui.constants.ts";
import { PantallaAcceso } from "@web/features/acceso/pantalla-acceso/pantalla-acceso.tsx";
import { PantallaCarga } from "@web/features/acceso/pantalla-carga/pantalla-carga.tsx";
import { PanelCasos } from "@web/features/casos/panel-casos/panel-casos.tsx";
import { AccionesRapidas } from "@web/features/chat/acciones-rapidas/acciones-rapidas.tsx";
import { Compositor } from "@web/features/chat/compositor/compositor.tsx";
import { LineaDeTiempo } from "@web/features/chat/linea-de-tiempo/linea-de-tiempo.tsx";
import { BarraPestanas } from "@web/features/disposicion/barra-pestanas/barra-pestanas.tsx";
import estilos from "@web/features/disposicion/columnas/columnas.module.css";
import { useColumnas } from "@web/features/disposicion/columnas/usar-columnas.ts";
import { AvisoModelo } from "@web/features/encabezado/aviso-modelo/aviso-modelo.tsx";
import { Encabezado } from "@web/features/encabezado/encabezado/encabezado.tsx";
import { DialogoNuevaSesion } from "@web/features/sesion/dialogo-nueva-sesion/dialogo-nueva-sesion.tsx";

export function Columnas() {
  const { acceso, diseno, angosto, conPestanas, conHistorial, pestanas, ids, vistaChat, vistaCasos } =
    useColumnas();

  if (acceso.tipo === ESTADO_ACCESO.VERIFICANDO) return <PantallaCarga />;

  if (acceso.tipo === ESTADO_ACCESO.PEDIDO) return <PantallaAcceso aviso={acceso.aviso} />;

  return (
    <div className={estilos.app} data-diseno={diseno}>
      <Encabezado angosto={angosto} />
      <AvisoModelo />
      {conPestanas ? <BarraPestanas control={pestanas} ids={ids} /> : null}
      <div className={estilos.columnas}>
        <div className={estilos.vistaChat} {...vistaChat}>
          <main className={estilos.chat}>
            <LineaDeTiempo />
            {conHistorial ? <AccionesRapidas compactas={true} angosto={angosto} /> : null}
            <Compositor />
          </main>
        </div>
        <div className={estilos.vistaCasos} {...vistaCasos}>
          <PanelCasos />
        </div>
      </div>
      <DialogoNuevaSesion />
    </div>
  );
}
