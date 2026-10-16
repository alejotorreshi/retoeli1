import { TEXTO_CHAT } from "@web/config/strings.ts";
import estilos from "@web/features/chat/compositor/compositor.module.css";
import { useCompositor } from "@web/features/chat/compositor/usar-compositor.ts";

export function Compositor() {
  const {
    idCampo,
    registrarCampo,
    idAyuda,
    idContador,
    descritoPor,
    valor,
    maximo,
    enCurso,
    deshabilitado,
    ayuda,
    contador,
    uso,
    alCambiar,
    alEnviarFormulario,
    alPresionarTecla,
    alDetener,
  } = useCompositor();

  return (
    <form className={estilos.compositor} onSubmit={alEnviarFormulario}>
      <div className={estilos.interior}>
        <textarea
          ref={registrarCampo}
          id={idCampo}
          className={estilos.campo}
          aria-label={TEXTO_CHAT.etiquetaMensaje}
          aria-describedby={descritoPor}
          maxLength={maximo}
          placeholder={TEXTO_CHAT.placeholder}
          value={valor}
          disabled={deshabilitado}
          onChange={alCambiar}
          onKeyDown={alPresionarTecla}
        />
        <div className={estilos.pie}>
          <p id={idAyuda} className={estilos.ayuda}>
            {ayuda}
          </p>
          {contador === null ? null : (
            <p
              id={idContador}
              className={contador.enElLimite ? `${estilos.contador} ${estilos.limite}` : estilos.contador}
            >
              {contador.texto}
            </p>
          )}
          {uso === null ? null : <p className={estilos.uso}>{uso}</p>}
          {enCurso ? (
            <button type="button" className={estilos.detener} onClick={alDetener}>
              {TEXTO_CHAT.detener}
            </button>
          ) : (
            <button type="submit" className={estilos.enviar} disabled={deshabilitado}>
              {TEXTO_CHAT.enviar}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
