import { ESTADO_HERRAMIENTA, ESTADO_TARJETA_CONFIRMACION } from "@web/config/constants/ui.constants.ts";
import type {
  AccionDeTarjeta,
  ConfirmacionDelTurno,
  EstadoTarjetaConfirmacion,
  TarjetaDeConfirmacion,
  TurnoConversacion,
  TurnoTerminado,
} from "@web/types/chat.type.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";

type HechosDelTurno = {
  readonly clave: number;
  readonly completo: boolean;
  readonly enviados: ReadonlySet<string>;
  readonly rearmados: ReadonlySet<string>;
  readonly confirmaciones: ReadonlyMap<string, ConfirmacionDelTurno>;
};

function casosConLlamadaCorrecta(turno: TurnoConversacion, herramienta: string): ReadonlySet<string> {
  return new Set(
    turno.llamadas.flatMap((llamada) =>
      llamada.herramienta === herramienta &&
      llamada.estado === ESTADO_HERRAMIENTA.CORRECTA &&
      llamada.caso !== null
        ? [llamada.caso]
        : [],
    ),
  );
}

function ultimaConfirmacionPorCaso(turno: TurnoConversacion): ReadonlyMap<string, ConfirmacionDelTurno> {
  return new Map(turno.confirmaciones.map((confirmacion) => [confirmacion.caso, confirmacion]));
}

function hechosDe({ turno, completo }: TurnoTerminado): HechosDelTurno {
  return {
    clave: turno.clave,
    completo,
    enviados: casosConLlamadaCorrecta(turno, NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO]),
    rearmados: casosConLlamadaCorrecta(turno, NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE]),
    confirmaciones: ultimaConfirmacionPorCaso(turno),
  };
}

function resolver(
  tarjeta: TarjetaDeConfirmacion,
  estado: EstadoTarjetaConfirmacion,
  clave: number,
): TarjetaDeConfirmacion {
  return { ...tarjeta, estado, resueltaEnTurno: clave };
}

function desenlace(tarjeta: TarjetaDeConfirmacion, hechos: HechosDelTurno): TarjetaDeConfirmacion {
  if (tarjeta.estado !== ESTADO_TARJETA_CONFIRMACION.ABIERTA) return tarjeta;
  const libre = { ...tarjeta, enviando: null };
  if (hechos.enviados.has(tarjeta.caso)) {
    return resolver(libre, ESTADO_TARJETA_CONFIRMACION.REGISTRADA, hechos.clave);
  }
  const confirmacion = hechos.confirmaciones.get(tarjeta.caso);
  if (confirmacion !== undefined && hechos.rearmados.has(tarjeta.caso)) {
    return resolver(libre, ESTADO_TARJETA_CONFIRMACION.REEMPLAZADA, hechos.clave);
  }
  if (confirmacion !== undefined) return { ...libre, bloqueosLegibles: confirmacion.bloqueosLegibles };
  if (!hechos.completo) return libre;
  return resolver(libre, ESTADO_TARJETA_CONFIRMACION.CANCELADA, hechos.clave);
}

function estaAbierta(tarjeta: TarjetaDeConfirmacion): boolean {
  return tarjeta.estado === ESTADO_TARJETA_CONFIRMACION.ABIERTA;
}

function tarjetaNueva(
  clave: number,
  turno: number,
  confirmacion: ConfirmacionDelTurno,
): TarjetaDeConfirmacion {
  return {
    clave,
    caso: confirmacion.caso,
    turno,
    bloqueosLegibles: confirmacion.bloqueosLegibles,
    estado: ESTADO_TARJETA_CONFIRMACION.ABIERTA,
    resueltaEnTurno: null,
    enviando: null,
  };
}

export function reducirConfirmaciones(
  tarjetas: readonly TarjetaDeConfirmacion[],
  turnoTerminado: TurnoTerminado,
): readonly TarjetaDeConfirmacion[] {
  const hechos = hechosDe(turnoTerminado);
  const resueltas = tarjetas.map((tarjeta) => desenlace(tarjeta, hechos));
  const conAbierta = new Set(resueltas.filter(estaAbierta).map((tarjeta) => tarjeta.caso));
  const nuevas = [...hechos.confirmaciones.values()]
    .filter((confirmacion) => !conAbierta.has(confirmacion.caso))
    .map((confirmacion, indice) => tarjetaNueva(resueltas.length + indice, hechos.clave, confirmacion));
  return [...resueltas, ...nuevas];
}

export function marcarEnviando(
  tarjetas: readonly TarjetaDeConfirmacion[],
  accion: AccionDeTarjeta,
): readonly TarjetaDeConfirmacion[] {
  return tarjetas.map((tarjeta) =>
    estaAbierta(tarjeta) && tarjeta.caso === accion.caso ? { ...tarjeta, enviando: accion.tipo } : tarjeta,
  );
}

export function soltarEnvios(tarjetas: readonly TarjetaDeConfirmacion[]): readonly TarjetaDeConfirmacion[] {
  return tarjetas.map((tarjeta) => (tarjeta.enviando === null ? tarjeta : { ...tarjeta, enviando: null }));
}

export function tarjetasDelTurno(
  tarjetas: readonly TarjetaDeConfirmacion[],
  turno: number,
): readonly TarjetaDeConfirmacion[] {
  return tarjetas.filter((tarjeta) => tarjeta.turno === turno);
}

export function casosAbiertosEnTurno(
  tarjetas: readonly TarjetaDeConfirmacion[],
  turno: number,
): readonly string[] {
  return tarjetasDelTurno(tarjetas, turno)
    .filter(estaAbierta)
    .map((tarjeta) => tarjeta.caso);
}

export function hayTarjetaAbierta(tarjetas: readonly TarjetaDeConfirmacion[], caso: string): boolean {
  return tarjetas.some((tarjeta) => estaAbierta(tarjeta) && tarjeta.caso === caso);
}
