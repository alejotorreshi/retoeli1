import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import type { CampoMapeado } from "@/domain/mapeo.ts";
import type { EstadoCampo } from "@/domain/reglas.ts";
import type { FechaISO } from "@/domain/tipos.ts";

export const AVISO_FORMATO_NO_SOPORTADO = "formato no soportado";

export type CampoPortal = {
  readonly etiqueta: string;
  readonly valor: string;
  readonly estado: string;
  readonly nota: string;
};

export type DatosValoresPortal = {
  readonly caso: string;
  readonly cliente: string;
  readonly fecha_ejecucion: string;
  readonly aviso: string;
  readonly campos: readonly CampoPortal[];
  readonly pendientes: readonly CampoPortal[];
};

export type CasoPortal = { readonly caso: string; readonly cliente: string };

const ESTADO_VISIBLE: Readonly<Record<EstadoCampo, string>> = {
  [ESTADO_CAMPO.LLENO]: "lleno",
  [ESTADO_CAMPO.FALTANTE]: "faltante",
  [ESTADO_CAMPO.REQUIERE_CONFIRMACION]: "por confirmar",
};

function campoPortal(campo: CampoMapeado): CampoPortal {
  return {
    etiqueta: campo.etiqueta,
    valor: campo.estado === ESTADO_CAMPO.FALTANTE ? "" : (campo.valor ?? ""),
    estado: ESTADO_VISIBLE[campo.estado],
    nota: campo.nota ?? "",
  };
}

export function construirDatosPortal(
  caso: CasoPortal,
  canonico: readonly CampoMapeado[],
  fecha: FechaISO,
): DatosValoresPortal {
  return {
    caso: caso.caso,
    cliente: caso.cliente,
    fecha_ejecucion: fecha,
    aviso: AVISO_FORMATO_NO_SOPORTADO,
    campos: canonico.map(campoPortal),
    pendientes: canonico.filter((campo) => campo.estado !== ESTADO_CAMPO.LLENO).map(campoPortal),
  };
}
