import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { SEPARADOR_PARRAFOS } from "@/config/constants/text.constants.ts";
import type {
  EventoAgente,
  EventoFinHerramienta,
  EventoInicioHerramienta,
} from "@/loop/types/evento.type.ts";
import type { LlamadaRespondida, RespuestaTurno } from "@/loop/types/turno.type.ts";

function llamadaRespondida(
  inicio: EventoInicioHerramienta,
  fines: ReadonlyMap<string, EventoFinHerramienta>,
): LlamadaRespondida {
  const fin = fines.get(inicio.llamadaId);
  return {
    herramienta: inicio.herramienta,
    argumentos: inicio.argumentos,
    ok: fin?.ok ?? false,
    codigo: fin?.codigo ?? null,
    resumen: fin?.resumen ?? null,
  };
}

export function respuestaDeTurno(eventos: readonly EventoAgente[]): RespuestaTurno {
  const textos: string[] = [];
  const inicios: EventoInicioHerramienta[] = [];
  const fines = new Map<string, EventoFinHerramienta>();
  let needsConfirmation = false;
  for (const evento of eventos) {
    if (evento.tipo === TIPO_EVENTO.TEXTO) textos.push(evento.texto);
    if (evento.tipo === TIPO_EVENTO.INICIO_HERRAMIENTA) inicios.push(evento);
    if (evento.tipo === TIPO_EVENTO.FIN_HERRAMIENTA) fines.set(evento.llamadaId, evento);
    if (evento.tipo === TIPO_EVENTO.FIN_TURNO) needsConfirmation = evento.needsConfirmation;
  }
  return {
    reply: textos.join(SEPARADOR_PARRAFOS),
    toolCalls: inicios.map((inicio) => llamadaRespondida(inicio, fines)),
    needsConfirmation,
  };
}
