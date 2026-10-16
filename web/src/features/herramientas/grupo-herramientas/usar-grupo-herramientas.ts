import { TEXTO_HERRAMIENTA } from "@web/config/strings.ts";
import { grupoSeCierraAlTerminar, resumenDeLlamadas } from "@web/features/chat/estado/conversacion.ts";
import type { LlamadaDelTurno } from "@web/types/chat.type.ts";
import type { ControlGrupoHerramientas } from "@web/types/ui.type.ts";
import { type SyntheticEvent, useState } from "react";

export function useGrupoHerramientas(
  llamadas: readonly LlamadaDelTurno[],
  enCurso: boolean,
): ControlGrupoHerramientas {
  const cerrarAlTerminar = !enCurso && grupoSeCierraAlTerminar(llamadas.length);
  const [abierto, setAbierto] = useState(!cerrarAlTerminar);
  const [cerrabaAlTerminar, setCerrabaAlTerminar] = useState(cerrarAlTerminar);
  if (cerrarAlTerminar !== cerrabaAlTerminar) {
    setCerrabaAlTerminar(cerrarAlTerminar);
    if (cerrarAlTerminar) setAbierto(false);
  }

  function alAlternar(evento: SyntheticEvent<HTMLDetailsElement>): void {
    setAbierto(evento.currentTarget.open);
  }

  return { abierto, resumen: TEXTO_HERRAMIENTA.grupo(resumenDeLlamadas(llamadas)), alAlternar };
}
