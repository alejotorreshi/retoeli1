import { obtenerConfig } from "@web/api/cliente-api.ts";
import { AccionesRapidas } from "@web/components/acciones-rapidas.tsx";
import { AvisoModelo } from "@web/components/aviso-modelo.tsx";
import { Compositor } from "@web/components/compositor.tsx";
import { Encabezado } from "@web/components/encabezado.tsx";
import { IndicadorPensando } from "@web/components/indicador-pensando.tsx";
import { LineaDeTiempo } from "@web/components/linea-de-tiempo.tsx";
import { PantallaAcceso } from "@web/components/pantalla-acceso.tsx";
import { CLASE_GLOBAL, ESTADO_ACCESO } from "@web/config/constants/ui.constants.ts";
import { TEXTO_APP } from "@web/config/strings.ts";
import { useChat } from "@web/hooks/usar-chat.ts";
import { useSalud } from "@web/hooks/usar-salud.ts";
import { etiquetaPensando, eventosDelTurno } from "@web/state/conversacion.ts";
import { useEffect } from "react";

export function App() {
  const { salud, refrescar } = useSalud();
  const { estado, borrador, cambiarBorrador, enviar, enviarTexto, recibirConfig } = useChat(refrescar);

  useEffect(() => {
    const controlador = new AbortController();
    void obtenerConfig(controlador.signal).then((resultado) => {
      if (!controlador.signal.aborted) recibirConfig(resultado);
    });
    return () => controlador.abort();
  }, [recibirConfig]);

  async function alEntrar(): Promise<void> {
    recibirConfig(await obtenerConfig());
  }

  if (estado.acceso.tipo === ESTADO_ACCESO.VERIFICANDO) {
    return (
      <main aria-busy="true">
        <p role="status" className={CLASE_GLOBAL.OCULTO}>
          {TEXTO_APP.cargando}
        </p>
      </main>
    );
  }

  if (estado.acceso.tipo === ESTADO_ACCESO.PEDIDO) {
    return <PantallaAcceso aviso={estado.acceso.aviso} alEntrar={alEntrar} />;
  }

  const casos = estado.config?.casos ?? [];
  const conHistorial = estado.turnos.length > 0;

  return (
    <>
      <Encabezado fechaEjecucion={estado.config?.fechaEjecucion ?? null} salud={salud} />
      <AvisoModelo estado={salud?.llm ?? null} zona={estado.config?.zona ?? null} />
      <main>
        <LineaDeTiempo
          turnos={estado.turnos}
          enCurso={estado.enCurso}
          acciones={
            <AccionesRapidas
              casos={casos}
              enCurso={estado.enCurso}
              compactas={false}
              alEnviar={enviarTexto}
            />
          }
        >
          {estado.enCurso ? (
            <IndicadorPensando etiqueta={etiquetaPensando(estado)} marca={eventosDelTurno(estado)} />
          ) : null}
        </LineaDeTiempo>
        {conHistorial ? (
          <AccionesRapidas casos={casos} enCurso={estado.enCurso} compactas={true} alEnviar={enviarTexto} />
        ) : null}
        <Compositor
          valor={borrador}
          maximo={estado.config?.mensajeMaximo ?? null}
          enCurso={estado.enCurso}
          alCambiar={cambiarBorrador}
          alEnviar={enviar}
        />
      </main>
    </>
  );
}
