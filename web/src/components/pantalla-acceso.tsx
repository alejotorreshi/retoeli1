import { entrar } from "@web/api/cliente-api.ts";
import { AvisoSistema } from "@web/components/aviso.tsx";
import estilos from "@web/components/pantalla-acceso.module.css";
import { RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import { TEXTO_ACCESO, TEXTO_ERROR } from "@web/config/strings.ts";
import type { ResultadoApi } from "@web/types/chat.type.ts";
import type { PropsPantallaAcceso } from "@web/types/ui.type.ts";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";

function mensajeDelFallo(resultado: ResultadoApi<null>): string | null {
  switch (resultado.tipo) {
    case RESULTADO_API.OK:
      return null;
    case RESULTADO_API.SIN_RED:
      return TEXTO_ERROR.sinConexion;
    default:
      return resultado.mensaje;
  }
}

export function PantallaAcceso({ aviso, alEntrar }: PropsPantallaAcceso) {
  const idCampo = useId();
  const idError = useId();
  const campo = useRef<HTMLInputElement>(null);
  const [codigo, cambiarCodigo] = useState("");
  const [visible, cambiarVisible] = useState(false);
  const [pendiente, cambiarPendiente] = useState(false);
  const [error, cambiarError] = useState<string | null>(null);

  useEffect(() => {
    campo.current?.focus();
  }, []);

  async function alEnviarFormulario(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    if (codigo.length === 0 || pendiente) return;
    cambiarPendiente(true);
    const fallo = mensajeDelFallo(await entrar(codigo));
    if (fallo === null) {
      cambiarCodigo("");
      cambiarError(null);
      await alEntrar();
      cambiarPendiente(false);
      return;
    }
    cambiarError(fallo);
    cambiarPendiente(false);
    campo.current?.focus();
  }

  return (
    <main className={estilos.pantalla}>
      <form className={estilos.tarjeta} onSubmit={(evento) => void alEnviarFormulario(evento)} noValidate>
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
              type={visible ? "text" : "password"}
              autoComplete="current-password"
              spellCheck={false}
              value={codigo}
              aria-invalid={error !== null}
              aria-describedby={error === null ? undefined : idError}
              onChange={(evento) => cambiarCodigo(evento.target.value)}
            />
            <button
              type="button"
              className={estilos.alternar}
              aria-controls={idCampo}
              onClick={() => cambiarVisible((actual) => !actual)}
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
        <button type="submit" className={estilos.entrar} disabled={codigo.length === 0 || pendiente}>
          {pendiente ? TEXTO_ACCESO.verificando : TEXTO_ACCESO.entrar}
        </button>
      </form>
    </main>
  );
}
