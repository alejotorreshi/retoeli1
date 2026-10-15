import { Encabezado } from "@web/components/encabezado.tsx";
import { IndicadorPensando } from "@web/components/indicador-pensando.tsx";
import { LineaDeTiempo } from "@web/components/linea-de-tiempo.tsx";
import { TECLA_ENVIAR } from "@web/config/constants/ui.constants.ts";
import { TEXTO_CHAT } from "@web/config/strings.ts";
import { useChat } from "@web/hooks/usar-chat.ts";
import type { FormEvent, KeyboardEvent } from "react";

export function App() {
  const { estado, borrador, cambiarBorrador, enviar } = useChat();

  function alEnviarFormulario(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    enviar();
  }

  function alPresionarTecla(evento: KeyboardEvent<HTMLTextAreaElement>): void {
    if (evento.key !== TECLA_ENVIAR || evento.shiftKey || evento.nativeEvent.isComposing) return;
    evento.preventDefault();
    enviar();
  }

  return (
    <>
      <Encabezado />
      <main>
        <LineaDeTiempo turnos={estado.turnos} enCurso={estado.enCurso}>
          {estado.enCurso ? <IndicadorPensando /> : null}
        </LineaDeTiempo>
        <form onSubmit={alEnviarFormulario}>
          <textarea
            aria-label={TEXTO_CHAT.etiquetaMensaje}
            placeholder={TEXTO_CHAT.placeholder}
            value={borrador}
            onChange={(evento) => cambiarBorrador(evento.target.value)}
            onKeyDown={alPresionarTecla}
          />
          <p>{TEXTO_CHAT.ayuda}</p>
          <button type="submit" disabled={estado.enCurso}>
            {TEXTO_CHAT.enviar}
          </button>
        </form>
      </main>
    </>
  );
}
