import { entrar } from "@web/api/cliente-api.ts";
import { RESULTADO_API, TIPO_CAMPO_CODIGO } from "@web/config/constants/ui.constants.ts";
import { TEXTO_ERROR } from "@web/config/strings.ts";
import { useAcciones } from "@web/store/usar-almacen.ts";
import type { ResultadoApi } from "@web/types/chat.type.ts";
import type { ControlPantallaAcceso } from "@web/types/ui.type.ts";
import { type ChangeEvent, type FormEvent, useEffect, useId, useRef, useState } from "react";

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

export function usePantallaAcceso(): ControlPantallaAcceso {
  const { cargarConfig } = useAcciones();
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

  async function enviar(): Promise<void> {
    if (codigo.length === 0 || pendiente) return;
    cambiarPendiente(true);
    const fallo = mensajeDelFallo(await entrar(codigo));
    if (fallo === null) {
      cambiarCodigo("");
      cambiarError(null);
      await cargarConfig(new AbortController().signal);
      cambiarPendiente(false);
      return;
    }
    cambiarError(fallo);
    cambiarPendiente(false);
    campo.current?.focus();
  }

  return {
    idCampo,
    idError,
    campo,
    codigo,
    visible,
    tipoCampo: visible ? TIPO_CAMPO_CODIGO.VISIBLE : TIPO_CAMPO_CODIGO.OCULTO,
    pendiente,
    error,
    envioDeshabilitado: codigo.length === 0 || pendiente,
    alCambiarCodigo: (evento: ChangeEvent<HTMLInputElement>) => cambiarCodigo(evento.target.value),
    alAlternarVisible: () => cambiarVisible((actual) => !actual),
    alEnviarFormulario: (evento: FormEvent<HTMLFormElement>) => {
      evento.preventDefault();
      void enviar();
    },
  };
}
