import { ESTADO_FIRMA, SEPARADOR_RUTA } from "@web/config/constants/ui.constants.ts";
import type {
  ContadorDeCaso,
  EstadoFirma,
  ResultadoDeCaso,
  ResultadoVisibleUi,
  TurnoConversacion,
} from "@web/types/chat.type.ts";
import { OUT_DIR } from "@/config/constants/files.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";

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
