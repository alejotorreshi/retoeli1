import estilos from "@web/components/dialogo-nueva-sesion.module.css";
import { TEXTO_NUEVA_SESION } from "@web/config/strings.ts";
import type { PropsDialogoNuevaSesion } from "@web/types/ui.type.ts";
import { useEffect, useId, useRef } from "react";

function elementoEnFoco(): HTMLElement | null {
  return document.activeElement instanceof HTMLElement ? document.activeElement : null;
}

export function DialogoNuevaSesion({ abierto, alCerrar, alConfirmar }: PropsDialogoNuevaSesion) {
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
    alCerrar();
    const previo = disparador.current;
    disparador.current = null;
    if (previo?.isConnected) previo.focus();
  }

  function cerrar(): void {
    dialogo.current?.close();
  }

  function confirmar(): void {
    alConfirmar();
    cerrar();
  }

  return (
    <dialog
      ref={dialogo}
      className={estilos.dialogo}
      aria-labelledby={idTitulo}
      aria-describedby={idCuerpo}
      onClose={alCerrarDialogo}
    >
      <h2 id={idTitulo} className={estilos.titulo}>
        {TEXTO_NUEVA_SESION.titulo}
      </h2>
      <p id={idCuerpo} className={estilos.cuerpo}>
        {TEXTO_NUEVA_SESION.cuerpo}
      </p>
      <div className={estilos.acciones}>
        <button ref={seguir} type="button" className={estilos.seguir} onClick={cerrar}>
          {TEXTO_NUEVA_SESION.seguir}
        </button>
        <button type="button" className={estilos.empezar} onClick={confirmar}>
          {TEXTO_NUEVA_SESION.empezar}
        </button>
      </div>
    </dialog>
  );
}
