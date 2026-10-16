import { ESTADO_ACCESO, SIN_CASOS } from "@web/config/constants/ui.constants.ts";
import { firmaDelProgreso, marcasDeArchivos, progresoPorCaso } from "@web/features/casos/estado/casos.ts";
import {
  etiquetaPensando,
  eventosDelTurno,
  faltaConfig,
  usoDeSesion,
} from "@web/features/chat/estado/conversacion.ts";
import { envioEnPausa } from "@web/features/encabezado/estado/modelo.ts";
import type {
  AvisoDeSesion,
  EstadoAcceso,
  EstadoConversacion,
  EstadoModelo,
  ProgresoDeCaso,
  TarjetaDeConfirmacion,
  TurnoConversacion,
  UsoDeSesion,
} from "@web/types/chat.type.ts";
import type { EstadoRaiz } from "@web/types/store.type.ts";
import type { HealthResponse } from "@/http/types/api.type.ts";

export function memoizarPorReferencia<O extends object, T>(derivar: (origen: O) => T): (origen: O) => T {
  const cache = new WeakMap<O, { readonly valor: T }>();
  return (origen) => {
    const previo = cache.get(origen);
    if (previo !== undefined) return previo.valor;
    const valor = derivar(origen);
    cache.set(origen, { valor });
    return valor;
  };
}

const usoPorConversacion = memoizarPorReferencia((conversacion: EstadoConversacion) =>
  usoDeSesion(conversacion),
);

const progresosPorConversacion = memoizarPorReferencia((conversacion: EstadoConversacion) =>
  progresoPorCaso(conversacion),
);

const firmaPorConversacion = memoizarPorReferencia((conversacion: EstadoConversacion) =>
  firmaDelProgreso(progresosPorConversacion(conversacion)),
);

const marcasPorConversacion = memoizarPorReferencia((conversacion: EstadoConversacion) =>
  marcasDeArchivos(conversacion),
);

export function seleccionarAcceso(estado: EstadoRaiz): EstadoAcceso {
  return estado.conversacion.acceso;
}

export function seleccionarAccesoConcedido(estado: EstadoRaiz): boolean {
  return estado.conversacion.acceso.tipo === ESTADO_ACCESO.CONCEDIDO;
}

export function seleccionarSesionPorCargar(estado: EstadoRaiz): string | null {
  return estado.conversacion.hidratando ? estado.conversacion.sesionId : null;
}

export function seleccionarFaltaConfig(estado: EstadoRaiz): boolean {
  return faltaConfig(estado.conversacion);
}

export function seleccionarCasos(estado: EstadoRaiz): readonly string[] {
  return estado.conversacion.config?.casos ?? SIN_CASOS;
}

export function seleccionarFechaEjecucion(estado: EstadoRaiz): string | null {
  return estado.conversacion.config?.fechaEjecucion ?? null;
}

export function seleccionarZona(estado: EstadoRaiz): string | null {
  return estado.conversacion.config?.zona ?? null;
}

export function seleccionarMensajeMaximo(estado: EstadoRaiz): number | null {
  return estado.conversacion.config?.mensajeMaximo ?? null;
}

export function seleccionarTurnos(estado: EstadoRaiz): readonly TurnoConversacion[] {
  return estado.conversacion.turnos;
}

export function seleccionarConHistorial(estado: EstadoRaiz): boolean {
  return estado.conversacion.turnos.length > 0;
}

export function seleccionarEnCurso(estado: EstadoRaiz): boolean {
  return estado.conversacion.enCurso;
}

export function seleccionarHidratando(estado: EstadoRaiz): boolean {
  return estado.conversacion.hidratando;
}

export function seleccionarAvisoSesion(estado: EstadoRaiz): AvisoDeSesion | null {
  return estado.conversacion.avisoSesion;
}

export function seleccionarTarjetasConfirmacion(estado: EstadoRaiz): readonly TarjetaDeConfirmacion[] {
  return estado.conversacion.tarjetasConfirmacion;
}

export function seleccionarBorrador(estado: EstadoRaiz): string {
  return estado.conversacion.borrador;
}

export function seleccionarSalud(estado: EstadoRaiz): HealthResponse | null {
  return estado.salud.salud;
}

export function seleccionarEstadoLlm(estado: EstadoRaiz): EstadoModelo | null {
  return estado.salud.salud?.llm ?? null;
}

export function seleccionarComprobando(estado: EstadoRaiz): boolean {
  return estado.salud.comprobando;
}

export function seleccionarEnvioEnPausa(estado: EstadoRaiz): boolean {
  return envioEnPausa(seleccionarEstadoLlm(estado));
}

export function seleccionarEnvioDeshabilitado(estado: EstadoRaiz): boolean {
  return estado.conversacion.enCurso || estado.conversacion.hidratando || seleccionarEnvioEnPausa(estado);
}

export function seleccionarUsoDeSesion(estado: EstadoRaiz): UsoDeSesion | null {
  return usoPorConversacion(estado.conversacion);
}

export function seleccionarEtiquetaPensando(estado: EstadoRaiz): string {
  return etiquetaPensando(estado.conversacion);
}

export function seleccionarEventosDelTurno(estado: EstadoRaiz): number {
  return eventosDelTurno(estado.conversacion);
}

export function seleccionarProgresos(estado: EstadoRaiz): readonly ProgresoDeCaso[] {
  return progresosPorConversacion(estado.conversacion);
}

export function seleccionarFirmaDelProgreso(estado: EstadoRaiz): string {
  return firmaPorConversacion(estado.conversacion);
}

export function seleccionarMarcasDeArchivos(estado: EstadoRaiz): ReadonlyMap<string, number> {
  return marcasPorConversacion(estado.conversacion);
}

export function seleccionarDialogoAbierto(estado: EstadoRaiz): boolean {
  return estado.dialogoSesion.abierto;
}
