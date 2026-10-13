import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import type { CampoMapeado } from "@/domain/mapeo.ts";
import { renderizarTextoPlano } from "@/domain/plantillas.ts";
import type { ReglasSoportes } from "@/domain/reglas.ts";
import { exito, type Resultado } from "@/domain/resultado.ts";
import type { FechaISO } from "@/domain/tipos.ts";
import { evaluarVigencia } from "@/domain/vigencias.ts";

export type SoporteIndice = {
  readonly tipo: string;
  readonly archivo: string;
  readonly vigencia_hasta: string | null;
  readonly pais_emisor: string;
  readonly descripcion: string;
};

export type EstadoSoporte = "presente" | "ausente" | "vencido";

export type SoporteEvaluado = {
  readonly tipo: string;
  readonly estado: EstadoSoporte;
  readonly vigencia_hasta: string | null;
  readonly archivo: string | null;
  readonly aviso: string | null;
  readonly aviso_emisor: string | null;
};

export type CampoPorConfirmar = { readonly etiqueta: string; readonly nota: string };

export type Checklist = {
  readonly fecha_ejecucion: FechaISO;
  readonly listo_para_firma: boolean;
  readonly bloqueos: readonly string[];
  readonly soportes: readonly SoporteEvaluado[];
  readonly faltantes: readonly string[];
  readonly requiere_confirmacion: readonly CampoPorConfirmar[];
};

export type FilaSoporteChecklist = {
  readonly tipo: string;
  readonly archivo: string;
  readonly vigencia: string;
  readonly estado: EstadoSoporte;
  readonly aviso: string;
  readonly pais_emisor: string;
};

export type DatosChecklist = {
  readonly caso: string;
  readonly cliente: string;
  readonly fecha_ejecucion: string;
  readonly estado: string;
  readonly motivos: readonly { readonly motivo: string }[];
  readonly soportes: readonly FilaSoporteChecklist[];
  readonly faltantes: readonly { readonly etiqueta: string }[];
  readonly por_confirmar: readonly CampoPorConfirmar[];
  readonly ausentes: readonly { readonly tipo: string }[];
  readonly vencidos: readonly { readonly tipo: string; readonly vigencia: string }[];
};

export type CasoChecklist = { readonly caso: string; readonly cliente: string };

export const TEXTO_SIN_VIGENCIA = "no aplica";
export const TEXTO_CELDA_VACIA = "—";
export const ESTADO_LISTO = "LISTO";
export const ESTADO_BLOQUEADO = "BLOQUEADO";
export const NOTA_POR_CONFIRMAR = "confirmar con el cliente";
const NOMBRE_AVISO_EMISOR = "soportes.aviso_emisor_distinto";
const VIGENCIA_SIN_VENCIMIENTO = "9999-12-31";

function avisoEmisor(
  entrada: SoporteIndice,
  paisCliente: string,
  reglas: ReglasSoportes,
): Resultado<string | null> {
  if (entrada.pais_emisor === paisCliente) return exito(null);
  return renderizarTextoPlano(
    reglas.aviso_emisor_distinto,
    { pais_emisor: entrada.pais_emisor },
    NOMBRE_AVISO_EMISOR,
  );
}

function soporteAusente(tipo: string): SoporteEvaluado {
  return { tipo, estado: "ausente", vigencia_hasta: null, archivo: null, aviso: null, aviso_emisor: null };
}

function vigenciaComparable(entrada: SoporteIndice): string {
  return entrada.vigencia_hasta ?? VIGENCIA_SIN_VENCIMIENTO;
}

function masVigentePrimero(a: SoporteIndice, b: SoporteIndice): number {
  return vigenciaComparable(b).localeCompare(vigenciaComparable(a)) || a.archivo.localeCompare(b.archivo);
}

function entradaMasVigente(
  tipo: string,
  indice: readonly SoporteIndice[],
  presentes: ReadonlySet<string>,
): SoporteIndice | undefined {
  return indice
    .filter((candidata) => candidata.tipo === tipo && presentes.has(candidata.archivo))
    .sort(masVigentePrimero)[0];
}

function evaluarSoporte(
  tipo: string,
  indice: readonly SoporteIndice[],
  presentes: ReadonlySet<string>,
  hoy: FechaISO,
  paisCliente: string,
  reglas: ReglasSoportes,
): Resultado<SoporteEvaluado> {
  const entrada = entradaMasVigente(tipo, indice, presentes);
  if (entrada === undefined) return exito(soporteAusente(tipo));
  const vigencia = evaluarVigencia(entrada.vigencia_hasta, hoy, reglas.dias_aviso_vencimiento);
  const emisor = avisoEmisor(entrada, paisCliente, reglas);
  if (!emisor.ok) return emisor;
  return exito({
    tipo,
    estado: vigencia.estado === "vencido" ? "vencido" : "presente",
    vigencia_hasta: entrada.vigencia_hasta,
    archivo: entrada.archivo,
    aviso: vigencia.aviso,
    aviso_emisor: emisor.data,
  });
}

export function evaluarSoportes(
  exigidos: readonly string[],
  indice: readonly SoporteIndice[],
  presentes: ReadonlySet<string>,
  hoy: FechaISO,
  paisCliente: string,
  reglas: ReglasSoportes,
): Resultado<readonly SoporteEvaluado[]> {
  const evaluados: SoporteEvaluado[] = [];
  for (const tipo of exigidos) {
    const soporte = evaluarSoporte(tipo, indice, presentes, hoy, paisCliente, reglas);
    if (!soporte.ok) return soporte;
    evaluados.push(soporte.data);
  }
  return exito(evaluados);
}

function bloqueoDe(soporte: SoporteEvaluado): readonly string[] {
  if (soporte.estado === "ausente") return [`ausente: ${soporte.tipo}`];
  if (soporte.estado === "vencido") return [`vencido: ${soporte.tipo} (${soporte.vigencia_hasta ?? ""})`];
  return [];
}

export function construirChecklist(
  soportes: readonly SoporteEvaluado[],
  campos: readonly CampoMapeado[],
  hoy: FechaISO,
): Checklist {
  const bloqueos = soportes.flatMap(bloqueoDe);
  return {
    fecha_ejecucion: hoy,
    listo_para_firma: bloqueos.length === 0,
    bloqueos,
    soportes,
    faltantes: campos
      .filter((campo) => campo.estado === ESTADO_CAMPO.FALTANTE)
      .map((campo) => campo.etiqueta),
    requiere_confirmacion: campos
      .filter((campo) => campo.estado === ESTADO_CAMPO.REQUIERE_CONFIRMACION)
      .map((campo) => ({ etiqueta: campo.etiqueta, nota: campo.nota ?? NOTA_POR_CONFIRMAR })),
  };
}

function vigenciaVisible(soporte: SoporteEvaluado): string {
  if (soporte.estado === "ausente") return TEXTO_CELDA_VACIA;
  return soporte.vigencia_hasta ?? TEXTO_SIN_VIGENCIA;
}

function filaSoporte(soporte: SoporteEvaluado): FilaSoporteChecklist {
  return {
    tipo: soporte.tipo,
    archivo: soporte.archivo ?? TEXTO_CELDA_VACIA,
    vigencia: vigenciaVisible(soporte),
    estado: soporte.estado,
    aviso: soporte.aviso ?? TEXTO_CELDA_VACIA,
    pais_emisor: soporte.aviso_emisor ?? TEXTO_CELDA_VACIA,
  };
}

export function construirDatosChecklist(caso: CasoChecklist, checklist: Checklist): DatosChecklist {
  const { soportes } = checklist;
  return {
    caso: caso.caso,
    cliente: caso.cliente,
    fecha_ejecucion: checklist.fecha_ejecucion,
    estado: checklist.listo_para_firma ? ESTADO_LISTO : ESTADO_BLOQUEADO,
    motivos: checklist.bloqueos.map((motivo) => ({ motivo })),
    soportes: soportes.map(filaSoporte),
    faltantes: checklist.faltantes.map((etiqueta) => ({ etiqueta })),
    por_confirmar: checklist.requiere_confirmacion,
    ausentes: soportes.filter((soporte) => soporte.estado === "ausente").map(({ tipo }) => ({ tipo })),
    vencidos: soportes
      .filter((soporte) => soporte.estado === "vencido")
      .map((soporte) => ({ tipo: soporte.tipo, vigencia: vigenciaVisible(soporte) })),
  };
}
