import { Compositor } from "@web/components/compositor.tsx";
import { Encabezado } from "@web/components/encabezado.tsx";
import { IndicadorPensando } from "@web/components/indicador-pensando.tsx";
import { LineaDeTiempo } from "@web/components/linea-de-tiempo.tsx";
import { useChat } from "@web/hooks/usar-chat.ts";

export function App() {
  const { estado, borrador, cambiarBorrador, enviar } = useChat();

  return (
    <>
      <Encabezado />
      <main>
        <LineaDeTiempo turnos={estado.turnos} enCurso={estado.enCurso}>
          {estado.enCurso ? <IndicadorPensando /> : null}
        </LineaDeTiempo>
        <Compositor valor={borrador} enCurso={estado.enCurso} alCambiar={cambiarBorrador} alEnviar={enviar} />
      </main>
    </>
  );
}
