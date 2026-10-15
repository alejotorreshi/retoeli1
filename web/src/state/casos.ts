import {
  ARCHIVOS_ESPERADOS_POR_ETAPA,
  ESTADO_ETAPA,
  ESTADO_FIRMA,
  ESTADO_HERRAMIENTA,
  ESTADO_LISTA_ARCHIVOS,
  ESTADO_TARJETA_CONFIRMACION,
  ETAPA,
  ETAPA_DE_HERRAMIENTA,
  ETAPAS_QUE_REINICIA_EL_PAQUETE,
  ORDEN_ETAPAS,
  RESULTADO_API,
  SEPARADOR_FIRMA,
  SEPARADOR_RUTA,
} from "@web/config/constants/ui.constants.ts";
import type {
  ArchivoUi,
  ConfirmacionDelTurno,
  ContadorDeCaso,
  EstadoEtapa,
  EstadoFirma,
  EstadoListaArchivos,
  Etapa,
  LlamadaDelTurno,
  ProgresoDeCaso,
  ResultadoApi,
  ResultadoDeCaso,
  ResultadoVisibleUi,
  TarjetaDeConfirmacion,
  TipoArchivoUi,
  TurnoConversacion,
  VistaConConfirmaciones,
  VistaTurnos,
} from "@web/types/chat.type.ts";
import { OUT_DIR } from "@/config/constants/files.constants.ts";
import { RESPUESTA_HTTP } from "@/config/constants/http.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { PATRON_CASO } from "@/config/constants/patterns.constants.ts";
import { HERRAMIENTA, HERRAMIENTA_POR_NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";

const ORDEN_DE_CONTADORES = [
  ESTADO_CAMPO.LLENO,
  ESTADO_CAMPO.FALTANTE,
  ESTADO_CAMPO.REQUIERE_CONFIRMACION,
] as const;

export function casoDelPanel(
  llamada: LlamadaDelTurno,
  casosConocidos: readonly string[] | null,
): string | null {
  const { caso } = llamada;
  if (caso === null || !PATRON_CASO.test(caso)) return null;
  return casosConocidos === null || casosConocidos.includes(caso) ? caso : null;
}

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

function resultadoConCaso(llamada: LlamadaDelTurno): readonly (readonly [string, ResultadoVisibleUi])[] {
  const caso = casoDelPanel(llamada, null);
  return caso === null || llamada.resultado === null ? [] : [[caso, llamada.resultado]];
}

function plegarPorCaso(turnos: readonly TurnoConversacion[]): ReadonlyMap<string, ResultadoDeCaso> {
  const porCaso = new Map<string, ResultadoDeCaso>();
  for (const [caso, resultado] of turnos.flatMap((turno) => turno.llamadas).flatMap(resultadoConCaso)) {
    porCaso.set(caso, sumarResultado(porCaso.get(caso) ?? resultadoVacio(caso), resultado));
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

  registrar(caso: string | null, cambios: readonly (readonly [Etapa, EstadoEtapa])[]): void {
    if (caso === null || cambios.length === 0) return;
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
    plegado.registrar(casoDelPanel(llamada, null), cambiosDeLlamada(llamada, turnoActivo));
  });
  registrarConfirmaciones(turno.llamadas.length);
}

function cancelacionesDelTurno(
  tarjetas: readonly TarjetaDeConfirmacion[],
  turno: TurnoConversacion,
): readonly string[] {
  return tarjetas
    .filter(
      (tarjeta) =>
        tarjeta.estado === ESTADO_TARJETA_CONFIRMACION.CANCELADA && tarjeta.resueltaEnTurno === turno.clave,
    )
    .map((tarjeta) => tarjeta.caso);
}

export function progresoPorCaso({
  turnos,
  enCurso,
  tarjetasConfirmacion,
}: VistaConConfirmaciones): readonly ProgresoDeCaso[] {
  const plegado = new PlegadoDeProgreso();
  turnos.forEach((turno, indice) => {
    plegarTurno(plegado, turno, enCurso && indice === turnos.length - 1);
    for (const caso of cancelacionesDelTurno(tarjetasConfirmacion, turno)) {
      plegado.registrar(caso, [[ETAPA.CONFIRMACION, ESTADO_ETAPA.CANCELADA]]);
    }
  });
  return plegado.resultado();
}

export function firmaDelProgreso(progresos: readonly ProgresoDeCaso[]): string {
  return progresos
    .map(({ caso, etapas }) => [caso, ...etapas.map(({ estado }) => estado)].join(SEPARADOR_FIRMA))
    .sort()
    .join(SEPARADOR_FIRMA);
}

function casosDelTurno(turno: TurnoConversacion): ReadonlySet<string> {
  return new Set(turno.llamadas.flatMap((llamada) => casoDelPanel(llamada, null) ?? []));
}

export function marcasDeArchivos({ turnos, enCurso }: VistaTurnos): ReadonlyMap<string, number> {
  const terminados = enCurso ? turnos.slice(0, -1) : turnos;
  const marcas = new Map<string, number>();
  for (const caso of terminados.flatMap((turno) => [...casosDelTurno(turno)])) {
    marcas.set(caso, (marcas.get(caso) ?? 0) + 1);
  }
  return marcas;
}

export function esArchivoNoEncontrado(resultado: ResultadoApi<unknown>): boolean {
  return resultado.tipo === RESULTADO_API.RECHAZO && resultado.status === RESPUESTA_HTTP.NO_ENCONTRADO;
}

export function archivosFaltantes(
  progreso: ProgresoDeCaso,
  archivos: readonly ArchivoUi[],
): readonly Etapa[] {
  const presentes = new Set<TipoArchivoUi>(archivos.map((archivo) => archivo.tipo));
  const hechas = new Set(
    progreso.etapas.filter(({ estado }) => estado === ESTADO_ETAPA.HECHA).map(({ etapa }) => etapa),
  );
  return ARCHIVOS_ESPERADOS_POR_ETAPA.filter(
    ([etapa, tipos]) => hechas.has(etapa) && !tipos.some((tipo) => presentes.has(tipo)),
  ).map(([etapa]) => etapa);
}

export function discoBorrado(
  progreso: ProgresoDeCaso,
  lista: EstadoListaArchivos,
  borrados: boolean,
): boolean {
  if (borrados) return true;
  return lista.tipo === ESTADO_LISTA_ARCHIVOS.LISTA && archivosFaltantes(progreso, lista.archivos).length > 0;
}
