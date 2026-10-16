import estilos from "@web/compartido/icono-en-curso/icono-en-curso.module.css";
import { IconoGirando, IconoReloj } from "@web/compartido/iconos/iconos.tsx";

export function IconoEnCurso() {
  return (
    <>
      <span className={estilos.giro}>
        <IconoGirando />
      </span>
      <span className={estilos.quieto}>
        <IconoReloj />
      </span>
    </>
  );
}
