import type {
  CostoAcumulado,
  EscenarioCosto,
  EvidenciaCosto,
  PreciosEvidencia,
  Tarifa,
  UsoAgregado,
} from "@tests/helpers/types/costo.type.ts";
import type { HojaMaestro } from "@tests/helpers/types/pii.type.ts";
import { ESTADO_EVIDENCIA_COSTO } from "@/config/constants/costo.constants.ts";

const SIN_TARIFA: Tarifa = { cacheHit: 0, cacheMiss: 0, salida: 0 };
const SIN_PRECIOS: PreciosEvidencia = {
  fuente: "",
  consultado: "",
  moneda: "",
  tokensPorUnidad: 0,
  pico: SIN_TARIFA,
  valle: SIN_TARIFA,
};
const SIN_COSTO: CostoAcumulado = {
  turnos: 0,
  llamadas: 0,
  entrada: 0,
  cacheHit: 0,
  cacheMiss: 0,
  salida: 0,
  costoPicoUsd: 0,
  costoValleUsd: 0,
};

export function preciosEvidencia(): PreciosEvidencia {
  return SIN_PRECIOS;
}

export function redondear(valor: number): number {
  return valor;
}

export function costoUsd(_uso: UsoAgregado, _tarifa: Tarifa): number {
  return 0;
}

export function acumular(_escenarios: readonly EscenarioCosto[]): CostoAcumulado {
  return SIN_COSTO;
}

export function escenarioDesdeUsos(
  id: string,
  _turnos: number,
  _usos: readonly UsoAgregado[],
): EscenarioCosto {
  return { ...SIN_COSTO, id };
}

export function evidenciaMedida(
  _escenarios: readonly EscenarioCosto[],
  _fechaCorridaUtc: string,
  _proveedor: string,
  _modelo: string,
): EvidenciaCosto {
  return evidenciaPendiente();
}

export function evidenciaPendiente(): EvidenciaCosto {
  return {
    estado: ESTADO_EVIDENCIA_COSTO.MEDIDO,
    fechaCorridaUtc: null,
    proveedor: null,
    modelo: null,
    precios: SIN_PRECIOS,
    escenarios: [],
    total: null,
  };
}

export function formatoUsd(valor: number): string {
  return String(valor);
}

export async function escribirEvidencia(_raiz: string, _evidencia: EvidenciaCosto): Promise<void> {}

export async function casosEn(_casosDir: string): Promise<string[]> {
  return [];
}

export function clavesLlm(_entorno: Readonly<Record<string, string | undefined>>): string[] {
  return [];
}

export function fugasDeEvidencia(
  _serializada: string,
  _sensibles: readonly HojaMaestro[],
  _claves: readonly string[],
): string[] {
  return [];
}
