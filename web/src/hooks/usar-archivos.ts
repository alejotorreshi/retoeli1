import { descargarArchivo, listarArchivos } from "@web/api/cliente-api.ts";
import { guardarEnElEquipo } from "@web/api/descarga-local.ts";
import { ESTADO_LISTA_ARCHIVOS, RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import { esArchivoNoEncontrado } from "@web/features/casos/estado/casos.ts";
import type {
  ArchivoUi,
  ControlArchivos,
  EstadoListaArchivos,
  OpcionesArchivos,
} from "@web/types/chat.type.ts";
import { useCallback, useEffect, useRef, useState } from "react";

const LISTA_CARGANDO: EstadoListaArchivos = { tipo: ESTADO_LISTA_ARCHIVOS.CARGANDO };

const LISTA_CON_ERROR: EstadoListaArchivos = { tipo: ESTADO_LISTA_ARCHIVOS.ERROR };

export function useArchivos({ caso, activo, marca, alVencerAcceso }: OpcionesArchivos): ControlArchivos {
  const [estado, setEstado] = useState<EstadoListaArchivos>(LISTA_CARGANDO);
  const [borrados, setBorrados] = useState(false);
  const pedidoActivo = useRef<AbortController | null>(null);
  const marcaDeLaLista = useRef(marca);

  const refrescar = useCallback(
    (marcaPedida: number) => {
      pedidoActivo.current?.abort();
      const controlador = new AbortController();
      pedidoActivo.current = controlador;
      if (marcaPedida !== marcaDeLaLista.current) {
        marcaDeLaLista.current = marcaPedida;
        setBorrados(false);
      }
      void listarArchivos(caso, controlador.signal).then((resultado) => {
        if (controlador.signal.aborted) return;
        if (pedidoActivo.current === controlador) pedidoActivo.current = null;
        if (resultado.tipo === RESULTADO_API.ACCESO_VENCIDO) {
          alVencerAcceso(resultado.mensaje);
          return;
        }
        setEstado(
          resultado.tipo === RESULTADO_API.OK
            ? { tipo: ESTADO_LISTA_ARCHIVOS.LISTA, archivos: resultado.valor }
            : LISTA_CON_ERROR,
        );
      });
    },
    [caso, alVencerAcceso],
  );

  useEffect(() => {
    if (!activo) return;
    refrescar(marca);
    return () => pedidoActivo.current?.abort();
  }, [activo, marca, refrescar]);

  function reintentar(): void {
    setEstado(LISTA_CARGANDO);
    refrescar(marcaDeLaLista.current);
  }

  const marcarBorrados = useCallback(() => setBorrados(true), []);

  const descargar = useCallback(
    (archivo: ArchivoUi) => {
      void descargarArchivo(caso, archivo.nombre, guardarEnElEquipo).then((resultado) => {
        if (resultado.tipo === RESULTADO_API.ACCESO_VENCIDO) alVencerAcceso(resultado.mensaje);
        if (esArchivoNoEncontrado(resultado)) marcarBorrados();
      });
    },
    [caso, alVencerAcceso, marcarBorrados],
  );

  return { estado, borrados, reintentar, descargar, marcarBorrados };
}
