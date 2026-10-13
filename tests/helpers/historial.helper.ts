import type { MensajeWire } from "@tests/helpers/types/fetch-falso.type.ts";
import { ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import type { Mensaje } from "@/llm/types/llm.type.ts";

function resultadosSeguidos(mensajes: readonly Mensaje[], desde: number): readonly string[] {
  const ids: string[] = [];
  for (const mensaje of mensajes.slice(desde)) {
    if (mensaje.rol !== ROL_MENSAJE.HERRAMIENTA) break;
    ids.push(mensaje.llamadaId);
  }
  return ids;
}

function violacionesDelPaso(
  indice: number,
  llamadas: readonly string[],
  resultados: readonly string[],
): string[] {
  const sinResultado = llamadas
    .filter((id) => resultados.filter((resultado) => resultado === id).length !== 1)
    .map((id) => `mensaje ${indice}: la llamada ${id} no tiene exactamente un resultado a continuación`);
  const ajenos = resultados
    .filter((resultado) => !llamadas.includes(resultado))
    .map(
      (resultado) => `mensaje ${indice}: el resultado ${resultado} no corresponde a ninguna llamada del paso`,
    );
  return [...sinResultado, ...ajenos];
}

export function historialIntegro(mensajes: readonly Mensaje[]): string[] {
  const violaciones: string[] = [];
  let indice = 0;
  while (indice < mensajes.length) {
    const mensaje = mensajes[indice];
    if (mensaje?.rol === ROL_MENSAJE.HERRAMIENTA) {
      violaciones.push(`mensaje ${indice}: resultado huérfano ${mensaje.llamadaId}`);
      indice += 1;
      continue;
    }
    if (mensaje?.rol !== ROL_MENSAJE.ASISTENTE || mensaje.llamadas.length === 0) {
      indice += 1;
      continue;
    }
    const resultados = resultadosSeguidos(mensajes, indice + 1);
    const llamadas = mensaje.llamadas.map((llamada) => llamada.id);
    violaciones.push(...violacionesDelPaso(indice, llamadas, resultados));
    indice += 1 + resultados.length;
  }
  return violaciones;
}

function mensajeDeWire(mensaje: MensajeWire): Mensaje {
  if (mensaje.role === ROL_MENSAJE.HERRAMIENTA) {
    return {
      rol: ROL_MENSAJE.HERRAMIENTA,
      llamadaId: mensaje.tool_call_id ?? "",
      contenido: mensaje.content,
    };
  }
  if (mensaje.role === ROL_MENSAJE.ASISTENTE) {
    return {
      rol: ROL_MENSAJE.ASISTENTE,
      contenido: mensaje.content,
      llamadas: (mensaje.tool_calls ?? []).map(({ id }) => ({ id, nombre: "", argumentos: "" })),
      razonamiento: null,
    };
  }
  return mensaje.role === ROL_MENSAJE.SISTEMA
    ? { rol: ROL_MENSAJE.SISTEMA, contenido: mensaje.content }
    : { rol: ROL_MENSAJE.USUARIO, contenido: mensaje.content };
}

export function historialWireIntegro(mensajes: readonly MensajeWire[]): string[] {
  return historialIntegro(mensajes.map(mensajeDeWire));
}
