import { useListaArchivos } from "@web/features/archivos/lista-archivos/usar-lista-archivos.ts";
import { discoBorrado } from "@web/features/casos/estado/casos.ts";
import { useAcciones } from "@web/store/usar-almacen.ts";
import type { ArchivoUi } from "@web/types/chat.type.ts";
import type { ControlBloqueCaso, OpcionesBloqueCaso, VistaPreviaAbierta } from "@web/types/ui.type.ts";
import { type SyntheticEvent, useState } from "react";

export function useBloqueCaso({ progreso, reciente, marca }: OpcionesBloqueCaso): ControlBloqueCaso {
  const { enviarTexto, vencerAcceso } = useAcciones();
  const [abierto, setAbierto] = useState(reciente);
  const [vistaPrevia, setVistaPrevia] = useState<VistaPreviaAbierta | null>(null);
  const [recienteVisto, setRecienteVisto] = useState(reciente);
  if (reciente !== recienteVisto) {
    setRecienteVisto(reciente);
    if (reciente || vistaPrevia === null) setAbierto(reciente);
  }
  const archivos = useListaArchivos({
    caso: progreso.caso,
    activo: abierto,
    marca,
    alVencerAcceso: vencerAcceso,
  });

  function alVer(archivo: ArchivoUi, disparador: HTMLElement): void {
    setVistaPrevia({ archivo, disparador });
  }

  function alCerrarVistaPrevia(): void {
    const disparador = vistaPrevia?.disparador ?? null;
    setVistaPrevia(null);
    if (disparador?.isConnected) disparador.focus();
  }

  function alAlternar(evento: SyntheticEvent<HTMLDetailsElement>): void {
    setAbierto(evento.currentTarget.open);
  }

  return {
    abierto,
    alAlternar,
    archivos,
    vistaPrevia,
    alVer,
    alCerrarVistaPrevia,
    discoBorrado: discoBorrado(progreso, archivos.estado, archivos.borrados),
    enviarTexto,
  };
}
