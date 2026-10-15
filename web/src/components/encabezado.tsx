import estilos from "@web/components/encabezado.module.css";
import { TEXTO_APP } from "@web/config/strings.ts";

export function Encabezado() {
  return (
    <header className={estilos.encabezado}>
      <div className={estilos.marca}>
        <h1 className={estilos.titulo}>{TEXTO_APP.titulo}</h1>
        <span className={estilos.separador} aria-hidden="true">
          {TEXTO_APP.separador}
        </span>
        <p className={estilos.subtitulo}>{TEXTO_APP.subtitulo}</p>
      </div>
    </header>
  );
}
