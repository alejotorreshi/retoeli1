import { ID_CAMPO_MENSAJE, MARGEN_AVISO_CONTADOR, TECLA_ENVIAR } from "@web/config/constants/ui.constants.ts";
import { TEXTO_CHAT } from "@web/config/strings.ts";
import {
  seleccionarBorrador,
  seleccionarEnCurso,
  seleccionarEnvioEnPausa,
  seleccionarHidratando,
  seleccionarMensajeMaximo,
  seleccionarUsoDeSesion,
} from "@web/store/selectores.ts";
import { useAcciones, useSeleccion } from "@web/store/usar-almacen.ts";
import type { ContadorCompositor, ControlCompositor } from "@web/types/ui.type.ts";
import { type FormEvent, type KeyboardEvent, useId } from "react";

function esEnvioPorTeclado(evento: KeyboardEvent<HTMLTextAreaElement>): boolean {
  return evento.key === TECLA_ENVIAR && !evento.shiftKey && !evento.nativeEvent.isComposing;
}

function contadorVisible(caracteres: number, maximo: number | null): maximo is number {
  return maximo !== null && caracteres >= maximo - MARGEN_AVISO_CONTADOR;
}

function contadorDe(caracteres: number, maximo: number | null): ContadorCompositor | null {
  if (!contadorVisible(caracteres, maximo)) return null;
  return { texto: TEXTO_CHAT.contador(caracteres, maximo), enElLimite: caracteres >= maximo };
}

export function useCompositor(): ControlCompositor {
  const valor = useSeleccion(seleccionarBorrador);
  const maximo = useSeleccion(seleccionarMensajeMaximo);
  const enCurso = useSeleccion(seleccionarEnCurso);
  const bloqueado = useSeleccion(seleccionarHidratando);
  const pausado = useSeleccion(seleccionarEnvioEnPausa);
  const uso = useSeleccion(seleccionarUsoDeSesion);
  const { cambiarBorrador, enviar, detener } = useAcciones();
  const idAyuda = useId();
  const idContador = useId();
  const contador = contadorDe(valor.length, maximo);
  const deshabilitado = bloqueado || pausado;

  function alEnviarFormulario(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    enviar();
  }

  function alPresionarTecla(evento: KeyboardEvent<HTMLTextAreaElement>): void {
    if (!esEnvioPorTeclado(evento)) return;
    evento.preventDefault();
    if (!enCurso && !deshabilitado) evento.currentTarget.form?.requestSubmit();
  }

  return {
    idCampo: ID_CAMPO_MENSAJE,
    idAyuda,
    idContador,
    descritoPor: contador === null ? idAyuda : `${idAyuda} ${idContador}`,
    valor,
    maximo: maximo ?? undefined,
    enCurso,
    deshabilitado,
    ayuda: pausado ? TEXTO_CHAT.enPausa : TEXTO_CHAT.ayuda,
    contador,
    uso: uso === null ? null : TEXTO_CHAT.uso(uso.usados, uso.tope),
    alCambiar: cambiarBorrador,
    alEnviarFormulario,
    alPresionarTecla,
    alDetener: detener,
  };
}
