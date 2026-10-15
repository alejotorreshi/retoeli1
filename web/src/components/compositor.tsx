import estilos from "@web/components/compositor.module.css";
import { MARGEN_AVISO_CONTADOR, TECLA_ENVIAR } from "@web/config/constants/ui.constants.ts";
import { TEXTO_CHAT } from "@web/config/strings.ts";
import type { PropsCompositor } from "@web/types/ui.type.ts";
import { type FormEvent, type KeyboardEvent, useId } from "react";

function esEnvioPorTeclado(evento: KeyboardEvent<HTMLTextAreaElement>): boolean {
  return evento.key === TECLA_ENVIAR && !evento.shiftKey && !evento.nativeEvent.isComposing;
}

function contadorVisible(caracteres: number, maximo: number | null): maximo is number {
  return maximo !== null && caracteres >= maximo - MARGEN_AVISO_CONTADOR;
}

export function Compositor({ valor, maximo, enCurso, alCambiar, alEnviar }: PropsCompositor) {
  const idAyuda = useId();
  const idContador = useId();
  const caracteres = valor.length;
  const conContador = contadorVisible(caracteres, maximo);
  const enElLimite = conContador && caracteres >= maximo;

  function alEnviarFormulario(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    alEnviar();
  }

  function alPresionarTecla(evento: KeyboardEvent<HTMLTextAreaElement>): void {
    if (!esEnvioPorTeclado(evento)) return;
    evento.preventDefault();
    evento.currentTarget.form?.requestSubmit();
  }

  return (
    <form className={estilos.compositor} onSubmit={alEnviarFormulario}>
      <div className={estilos.interior}>
        <textarea
          className={estilos.campo}
          aria-label={TEXTO_CHAT.etiquetaMensaje}
          aria-describedby={conContador ? `${idAyuda} ${idContador}` : idAyuda}
          maxLength={maximo ?? undefined}
          placeholder={TEXTO_CHAT.placeholder}
          value={valor}
          onChange={(evento) => alCambiar(evento.target.value)}
          onKeyDown={alPresionarTecla}
        />
        <div className={estilos.pie}>
          <p id={idAyuda} className={estilos.ayuda}>
            {TEXTO_CHAT.ayuda}
          </p>
          {conContador ? (
            <p
              id={idContador}
              className={enElLimite ? `${estilos.contador} ${estilos.limite}` : estilos.contador}
            >
              {TEXTO_CHAT.contador(caracteres, maximo)}
            </p>
          ) : null}
          <button type="submit" className={estilos.enviar} disabled={enCurso}>
            {TEXTO_CHAT.enviar}
          </button>
        </div>
      </div>
    </form>
  );
}
