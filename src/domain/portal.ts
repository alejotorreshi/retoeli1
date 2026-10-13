import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { TEXTO_PORTAL } from "@/config/strings.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";
import type { CampoMapeado } from "@/domain/types/mapeo.type.ts";
import type { CampoPortal, CasoPortal, DatosValoresPortal } from "@/domain/types/portal.type.ts";
import type { EstadoCampo } from "@/domain/types/reglas.type.ts";

const ESTADO_VISIBLE: Readonly<Record<EstadoCampo, string>> = TEXTO_PORTAL.estado;

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
    aviso: TEXTO_PORTAL.avisoFormatoNoSoportado,
    campos: canonico.map(campoPortal),
    pendientes: canonico.filter((campo) => campo.estado !== ESTADO_CAMPO.LLENO).map(campoPortal),
  };
}
