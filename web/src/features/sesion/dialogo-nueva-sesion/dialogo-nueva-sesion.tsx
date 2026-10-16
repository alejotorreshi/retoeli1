import { TEXTO_NUEVA_SESION } from "@web/config/strings.ts";
import estilos from "@web/features/sesion/dialogo-nueva-sesion/dialogo-nueva-sesion.module.css";
import { useDialogoNuevaSesion } from "@web/features/sesion/dialogo-nueva-sesion/usar-dialogo-nueva-sesion.ts";

export function DialogoNuevaSesion() {
  const { dialogo, seguir, idTitulo, idCuerpo, alCerrarDialogo, cerrar, confirmar } = useDialogoNuevaSesion();

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
