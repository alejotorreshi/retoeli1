import { obtenerVistaPrevia } from "@web/api/cliente-api.ts";
import { ESTADO_VISTA_PREVIA, RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import { estadoDeVistaPreviaFallida } from "@web/features/archivos/estado/vista-previa.ts";
import { esArchivoNoEncontrado } from "@web/features/casos/estado/casos.ts";
import { useAcciones } from "@web/store/usar-almacen.ts";
import type { EstadoVistaPrevia } from "@web/types/chat.type.ts";
import type { ControlDialogoVistaPrevia, OpcionesDialogoVistaPrevia } from "@web/types/ui.type.ts";
import { useEffect, useId, useRef, useState } from "react";

const VISTA_CARGANDO: EstadoVistaPrevia = { tipo: ESTADO_VISTA_PREVIA.CARGANDO };

export function useDialogoVistaPrevia({
  caso,
  abierta,
  alDescargar,
  alNoEncontrado,
}: OpcionesDialogoVistaPrevia): ControlDialogoVistaPrevia {
  const { vencerAcceso } = useAcciones();
  const dialogo = useRef<HTMLDialogElement>(null);
  const cerrarBoton = useRef<HTMLButtonElement>(null);
  const [estado, setEstado] = useState<EstadoVistaPrevia>(VISTA_CARGANDO);
  const idTitulo = useId();

  useEffect(() => {
    const elemento = dialogo.current;
    if (elemento === null) return;
    if (abierta !== null && !elemento.open) {
      elemento.showModal();
      cerrarBoton.current?.focus();
    }
    if (abierta === null && elemento.open) elemento.close();
  }, [abierta]);

  useEffect(() => {
    if (abierta === null) return;
    setEstado(VISTA_CARGANDO);
    const controlador = new AbortController();
    void obtenerVistaPrevia(caso, abierta.archivo.nombre, controlador.signal).then((resultado) => {
      if (controlador.signal.aborted) return;
      if (resultado.tipo === RESULTADO_API.OK) {
        setEstado({ tipo: ESTADO_VISTA_PREVIA.LISTA, vista: resultado.valor });
        return;
      }
      if (resultado.tipo === RESULTADO_API.ACCESO_VENCIDO) vencerAcceso(resultado.mensaje);
      if (esArchivoNoEncontrado(resultado)) alNoEncontrado();
      setEstado(estadoDeVistaPreviaFallida(resultado));
    });
    return () => controlador.abort();
  }, [caso, abierta, alNoEncontrado, vencerAcceso]);

  function cerrar(): void {
    dialogo.current?.close();
  }

  function descargar(): void {
    if (abierta !== null) alDescargar(abierta.archivo);
  }

  return { dialogo, cerrarBoton, idTitulo, estado, cerrar, descargar };
}
