import { seleccionarDialogoAbierto } from "@web/store/selectores.ts";
import { useAcciones, useSeleccion } from "@web/store/usar-almacen.ts";
import type { ControlDialogoNuevaSesion } from "@web/types/ui.type.ts";
import { useEffect, useId, useRef } from "react";

function elementoEnFoco(): HTMLElement | null {
  return document.activeElement instanceof HTMLElement ? document.activeElement : null;
}

export function useDialogoNuevaSesion(): ControlDialogoNuevaSesion {
  const abierto = useSeleccion(seleccionarDialogoAbierto);
  const { cerrarNuevaSesion, nuevaSesion } = useAcciones();
  const dialogo = useRef<HTMLDialogElement>(null);
  const seguir = useRef<HTMLButtonElement>(null);
  const disparador = useRef<HTMLElement | null>(null);
  const idTitulo = useId();
  const idCuerpo = useId();

  useEffect(() => {
    const elemento = dialogo.current;
    if (elemento === null) return;
    if (abierto && !elemento.open) {
      disparador.current = elementoEnFoco();
      elemento.showModal();
      seguir.current?.focus();
    }
    if (!abierto && elemento.open) elemento.close();
  }, [abierto]);

  function alCerrarDialogo(): void {
    cerrarNuevaSesion();
    const previo = disparador.current;
    disparador.current = null;
    if (previo?.isConnected) previo.focus();
  }

  function cerrar(): void {
    dialogo.current?.close();
  }

  function confirmar(): void {
    nuevaSesion();
    cerrar();
  }

  return { dialogo, seguir, idTitulo, idCuerpo, alCerrarDialogo, cerrar, confirmar };
}
