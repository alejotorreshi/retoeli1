import estilos from "@web/components/grupo-herramientas.module.css";
import { IconoChevron } from "@web/components/icons/iconos.tsx";
import { TarjetaHerramienta } from "@web/components/tarjeta-herramienta.tsx";
import { TEXTO_HERRAMIENTA } from "@web/config/strings.ts";
import { grupoSeCierraAlTerminar, resumenDeLlamadas } from "@web/features/chat/estado/conversacion.ts";
import type { PropsGrupoHerramientas } from "@web/types/ui.type.ts";
import { type SyntheticEvent, useEffect, useState } from "react";

export function GrupoHerramientas({ llamadas, enCurso }: PropsGrupoHerramientas) {
  const cerrarAlTerminar = !enCurso && grupoSeCierraAlTerminar(llamadas.length);
  const [abierto, setAbierto] = useState(!cerrarAlTerminar);

  useEffect(() => {
    if (cerrarAlTerminar) setAbierto(false);
  }, [cerrarAlTerminar]);

  function alAlternar(evento: SyntheticEvent<HTMLDetailsElement>): void {
    setAbierto(evento.currentTarget.open);
  }

  return (
    <li>
      <details className={estilos.grupo} open={abierto} onToggle={alAlternar}>
        <summary className={estilos.resumen}>
          <span className={estilos.chevron}>
            <IconoChevron />
          </span>
          {TEXTO_HERRAMIENTA.grupo(resumenDeLlamadas(llamadas))}
        </summary>
        <ul className={estilos.lista}>
          {llamadas.map((llamada) => (
            <TarjetaHerramienta key={llamada.llamadaId} llamada={llamada} />
          ))}
        </ul>
      </details>
    </li>
  );
}
