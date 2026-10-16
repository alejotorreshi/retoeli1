import { AvisoSistema } from "@web/compartido/aviso/aviso.tsx";
import { TEXTO_ACCESO } from "@web/config/strings.ts";
import estilos from "@web/features/acceso/pantalla-acceso/pantalla-acceso.module.css";
import { usePantallaAcceso } from "@web/features/acceso/pantalla-acceso/usar-pantalla-acceso.ts";
import type { PropsPantallaAcceso } from "@web/types/ui.type.ts";

export function PantallaAcceso({ aviso }: PropsPantallaAcceso) {
  const {
    idCampo,
    idError,
    campo,
    codigo,
    visible,
    tipoCampo,
    pendiente,
    error,
    envioDeshabilitado,
    alCambiarCodigo,
    alAlternarVisible,
    alEnviarFormulario,
  } = usePantallaAcceso();

  return (
    <main className={estilos.pantalla}>
      <form className={estilos.tarjeta} onSubmit={alEnviarFormulario} noValidate>
        <h1 className={estilos.titulo}>{TEXTO_ACCESO.titulo}</h1>
        <p className={estilos.ayuda}>{TEXTO_ACCESO.ayuda}</p>
        {aviso === null ? null : <AvisoSistema mensaje={aviso} />}
        <div className={estilos.grupo}>
          <label className={estilos.etiqueta} htmlFor={idCampo}>
            {TEXTO_ACCESO.etiqueta}
          </label>
          <div className={estilos.fila}>
            <input
              ref={campo}
              id={idCampo}
              className={estilos.campo}
              type={tipoCampo}
              autoComplete="current-password"
              spellCheck={false}
              value={codigo}
              aria-invalid={error !== null}
              aria-describedby={error === null ? undefined : idError}
              onChange={alCambiarCodigo}
            />
            <button
              type="button"
              className={estilos.alternar}
              aria-controls={idCampo}
              onClick={alAlternarVisible}
            >
              {visible ? TEXTO_ACCESO.ocultar : TEXTO_ACCESO.mostrar}
            </button>
          </div>
          {error === null ? null : (
            <p id={idError} className={estilos.error}>
              {error}
            </p>
          )}
        </div>
        <button type="submit" className={estilos.entrar} disabled={envioDeshabilitado}>
          {pendiente ? TEXTO_ACCESO.verificando : TEXTO_ACCESO.entrar}
        </button>
      </form>
    </main>
  );
}
