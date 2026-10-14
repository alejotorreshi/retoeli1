import { enviarMensaje } from "@web/api/flujo-chat.ts";
import {
  ACCION_UI,
  ESTILO_TEXTO_PLANO,
  FILAS_COMPOSITOR,
  TECLA_ENVIAR,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_APP, TEXTO_CHAT } from "@web/config/strings.ts";
import { estadoInicialConversacion, reducirConversacion } from "@web/state/conversacion.ts";
import type { TurnoConversacion } from "@web/types/chat.type.ts";
import { type FormEvent, type KeyboardEvent, useReducer, useRef, useState } from "react";

function BurbujasDelTurno({ turno }: { readonly turno: TurnoConversacion }) {
  return (
    <>
      <li>
        <p style={ESTILO_TEXTO_PLANO}>{turno.mensaje}</p>
      </li>
      {turno.textos.map((texto) => (
        <li key={`${turno.clave}-${texto.clave}`}>
          <p style={ESTILO_TEXTO_PLANO}>{texto.texto}</p>
        </li>
      ))}
    </>
  );
}

export function App() {
  const [estado, despachar] = useReducer(reducirConversacion, estadoInicialConversacion);
  const [borrador, setBorrador] = useState("");
  const controlador = useRef<AbortController | null>(null);

  function enviar(): void {
    const mensaje = borrador.trim();
    if (mensaje.length === 0 || estado.enCurso) return;
    despachar({ tipo: ACCION_UI.ENVIAR, mensaje });
    setBorrador("");
    controlador.current = new AbortController();
    void enviarMensaje(
      { sessionId: estado.sesionId, message: mensaje },
      despachar,
      controlador.current.signal,
    );
  }

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
    <main>
      <header>
        <h1>{TEXTO_APP.titulo}</h1>
        <p>{TEXTO_APP.subtitulo}</p>
      </header>
      <section aria-label={TEXTO_CHAT.lineaDeTiempo}>
        {estado.turnos.length === 0 ? (
          <div>
            <h2>{TEXTO_CHAT.vacioTitulo}</h2>
            <p>{TEXTO_CHAT.vacioCuerpo}</p>
          </div>
        ) : (
          <ol>
            {estado.turnos.map((turno) => (
              <BurbujasDelTurno key={turno.clave} turno={turno} />
            ))}
          </ol>
        )}
        {estado.enCurso ? <div role="status">{TEXTO_CHAT.pensando}</div> : null}
      </section>
      <form onSubmit={alEnviarFormulario}>
        <textarea
          aria-label={TEXTO_CHAT.etiquetaMensaje}
          placeholder={TEXTO_CHAT.placeholder}
          rows={FILAS_COMPOSITOR}
          value={borrador}
          onChange={(evento) => setBorrador(evento.target.value)}
          onKeyDown={alPresionarTecla}
        />
        <p>{TEXTO_CHAT.ayuda}</p>
        <button type="submit" disabled={estado.enCurso}>
          {TEXTO_CHAT.enviar}
        </button>
      </form>
    </main>
  );
}
