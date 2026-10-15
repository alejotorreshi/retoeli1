import {
  ESTADO_ETAPA,
  ESTADO_FIRMA,
  ESTADO_HERRAMIENTA,
  ETAPA,
  ETAPA_DE_HERRAMIENTA,
  ETAPAS_QUE_REINICIA_EL_PAQUETE,
  ORDEN_ETAPAS,
  SEPARADOR_FIRMA,
  SEPARADOR_RUTA,
} from "@web/config/constants/ui.constants.ts";
import type {
  ConfirmacionDelTurno,
  ContadorDeCaso,
  EstadoEtapa,
  EstadoFirma,
  Etapa,
  LlamadaDelTurno,
  ProgresoDeCaso,
  ResultadoDeCaso,
  ResultadoVisibleUi,
  TurnoConversacion,
  VistaTurnos,
} from "@web/types/chat.type.ts";
import { OUT_DIR } from "@/config/constants/files.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { HERRAMIENTA, HERRAMIENTA_POR_NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";

const ORDEN_DE_CONTADORES = [
  ESTADO_CAMPO.LLENO,
  ESTADO_CAMPO.FALTANTE,
  ESTADO_CAMPO.REQUIERE_CONFIRMACION,
] as const;

function resultadoVacio(caso: string): ResultadoDeCaso {
  return {
    caso,
    pais: null,
    formato: null,
    conteo: null,
    listoParaFirma: null,
    bloqueosLegibles: null,
    carpeta: null,
    aviso: null,
  };
}

function carpetaDelPaquete(caso: string, resultado: ResultadoVisibleUi): string | null {
  if (resultado.listoParaFirma === null || resultado.ruta === null) return null;
  const carpeta = `${OUT_DIR}${SEPARADOR_RUTA}${caso}${SEPARADOR_RUTA}`;
  return resultado.ruta.startsWith(carpeta) ? carpeta : null;
}

function sumarResultado(previo: ResultadoDeCaso, resultado: ResultadoVisibleUi): ResultadoDeCaso {
  return {
    caso: previo.caso,
    pais: resultado.pais ?? previo.pais,
    formato: resultado.formato ?? previo.formato,
    conteo: resultado.conteo ?? previo.conteo,
    listoParaFirma: resultado.listoParaFirma ?? previo.listoParaFirma,
    bloqueosLegibles: resultado.bloqueosLegibles ?? previo.bloqueosLegibles,
    carpeta: carpetaDelPaquete(previo.caso, resultado) ?? previo.carpeta,
    aviso: resultado.aviso ?? previo.aviso,
  };
}

function plegarPorCaso(turnos: readonly TurnoConversacion[]): ReadonlyMap<string, ResultadoDeCaso> {
  const porCaso = new Map<string, ResultadoDeCaso>();
  for (const llamada of turnos.flatMap((turno) => turno.llamadas)) {
    if (llamada.caso === null || llamada.resultado === null) continue;
    const previo = porCaso.get(llamada.caso) ?? resultadoVacio(llamada.caso);
    porCaso.set(llamada.caso, sumarResultado(previo, llamada.resultado));
  }
  return porCaso;
}

export function resultadosPorCaso(turnos: readonly TurnoConversacion[]): readonly ResultadoDeCaso[] {
  return [...plegarPorCaso(turnos).values()];
}

export function resultadosDelTurno(
  turnos: readonly TurnoConversacion[],
  indice: number,
): readonly ResultadoDeCaso[] {
  const turno = turnos[indice];
  if (turno === undefined) return [];
  const acumulado = plegarPorCaso(turnos.slice(0, indice + 1));
  return [...plegarPorCaso([turno]).keys()].flatMap((caso) => acumulado.get(caso) ?? []);
}

export function listoParaFirmaHasta(
  turnos: readonly TurnoConversacion[],
  caso: string,
  claveTurno: number | null,
): boolean | null {
  const hasta = claveTurno === null ? turnos : turnos.filter((turno) => turno.clave <= claveTurno);
  return plegarPorCaso(hasta).get(caso)?.listoParaFirma ?? null;
}

export function estadoDeFirma(listoParaFirma: boolean | null): EstadoFirma {
  if (listoParaFirma === null) return ESTADO_FIRMA.SIN_ARMAR;
  return listoParaFirma ? ESTADO_FIRMA.LISTO : ESTADO_FIRMA.NO_LISTO;
}

export function contadoresDe(resultado: ResultadoDeCaso): readonly ContadorDeCaso[] {
  return ORDEN_DE_CONTADORES.map((estado) => ({
    estado,
    cantidad: resultado.conteo === null ? null : resultado.conteo[estado],
  }));
}

type EtapasDeCaso = ReadonlyMap<Etapa, EstadoEtapa>;

type AvanceDeCaso = {
  readonly etapas: EtapasDeCaso;
  readonly primeraAparicion: number;
  readonly ultimaActividad: number;
};

function etapasIniciales(): EtapasDeCaso {
  return new Map(ORDEN_ETAPAS.map((etapa) => [etapa, ESTADO_ETAPA.PENDIENTE]));
}

function conEstados(etapas: EtapasDeCaso, cambios: readonly (readonly [Etapa, EstadoEtapa])[]): EtapasDeCaso {
  return new Map([...etapas, ...cambios]);
}

function estadoDeLlamada(llamada: LlamadaDelTurno, turnoActivo: boolean): EstadoEtapa | null {
  switch (llamada.estado) {
    case ESTADO_HERRAMIENTA.CORRECTA:
      return ESTADO_ETAPA.HECHA;
    case ESTADO_HERRAMIENTA.ERROR:
      return ESTADO_ETAPA.ERROR;
    default:
      return turnoActivo ? ESTADO_ETAPA.EN_CURSO : null;
  }
}

function cambiosDeLlamada(
  llamada: LlamadaDelTurno,
  turnoActivo: boolean,
): readonly (readonly [Etapa, EstadoEtapa])[] {
  const herramienta = HERRAMIENTA_POR_NOMBRE_VISIBLE.get(llamada.herramienta);
  const estado = estadoDeLlamada(llamada, turnoActivo);
  if (herramienta === undefined || estado === null) return [];
  const propia = [ETAPA_DE_HERRAMIENTA[herramienta], estado] as const;
  if (estado !== ESTADO_ETAPA.HECHA) return [propia];
  if (herramienta === HERRAMIENTA.ARMAR_PAQUETE) {
    return [
      propia,
      ...ETAPAS_QUE_REINICIA_EL_PAQUETE.map((etapa) => [etapa, ESTADO_ETAPA.PENDIENTE] as const),
    ];
  }
  if (herramienta === HERRAMIENTA.SIMULAR_ENVIO) return [[ETAPA.CONFIRMACION, ESTADO_ETAPA.HECHA], propia];
  return [propia];
}

class PlegadoDeProgreso {
  private readonly avances = new Map<string, AvanceDeCaso>();
  private actividad = 0;

  registrar(caso: string, cambios: readonly (readonly [Etapa, EstadoEtapa])[]): void {
    if (cambios.length === 0) return;
    this.actividad += 1;
    const previo = this.avances.get(caso);
    this.avances.set(caso, {
      etapas: conEstados(previo?.etapas ?? etapasIniciales(), cambios),
      primeraAparicion: previo?.primeraAparicion ?? this.actividad,
      ultimaActividad: this.actividad,
    });
  }

  registrarConfirmacion(caso: string): void {
    const previo = this.avances.get(caso)?.etapas.get(ETAPA.CONFIRMACION);
    if (previo === ESTADO_ETAPA.ESPERANDO) return;
    this.registrar(caso, [[ETAPA.CONFIRMACION, ESTADO_ETAPA.ESPERANDO]]);
  }

  resultado(): readonly ProgresoDeCaso[] {
    const porAparicion = [...this.avances.entries()].sort(
      ([, uno], [, otro]) => uno.primeraAparicion - otro.primeraAparicion,
    );
    const porActividad = [...porAparicion].sort(
      ([, uno], [, otro]) => otro.ultimaActividad - uno.ultimaActividad,
    );
    const reciente = porActividad[0]?.[0] ?? null;
    return [
      ...porAparicion.filter(([caso]) => caso === reciente),
      ...porAparicion.filter(([caso]) => caso !== reciente),
    ].map(([caso, avance]) => ({
      caso,
      etapas: ORDEN_ETAPAS.map((etapa) => ({
        etapa,
        estado: avance.etapas.get(etapa) ?? ESTADO_ETAPA.PENDIENTE,
      })),
    }));
  }
}

function confirmacionesTras(
  confirmaciones: readonly ConfirmacionDelTurno[],
  llamadas: number,
): readonly ConfirmacionDelTurno[] {
  return confirmaciones.filter((confirmacion) => confirmacion.trasLlamadas === llamadas);
}

function plegarTurno(plegado: PlegadoDeProgreso, turno: TurnoConversacion, turnoActivo: boolean): void {
  const registrarConfirmaciones = (llamadas: number) => {
    for (const confirmacion of confirmacionesTras(turno.confirmaciones, llamadas)) {
      plegado.registrarConfirmacion(confirmacion.caso);
    }
  };
  turno.llamadas.forEach((llamada, indice) => {
    registrarConfirmaciones(indice);
    if (llamada.caso !== null) plegado.registrar(llamada.caso, cambiosDeLlamada(llamada, turnoActivo));
  });
  registrarConfirmaciones(turno.llamadas.length);
}

export function progresoPorCaso({ turnos, enCurso }: VistaTurnos): readonly ProgresoDeCaso[] {
  const plegado = new PlegadoDeProgreso();
  turnos.forEach((turno, indice) => {
    plegarTurno(plegado, turno, enCurso && indice === turnos.length - 1);
  });
  return plegado.resultado();
}

export function firmaDelProgreso(progresos: readonly ProgresoDeCaso[]): string {
  return progresos
    .map(({ caso, etapas }) => [caso, ...etapas.map(({ estado }) => estado)].join(SEPARADOR_FIRMA))
    .sort()
    .join(SEPARADOR_FIRMA);
}
