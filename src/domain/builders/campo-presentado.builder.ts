import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { enmascarar } from "@/domain/policies/pii.policy.ts";
import type { CampoMapeado } from "@/domain/types/mapeo.type.ts";
import type { CampoPresentado } from "@/domain/types/pii.type.ts";

function valorEnmascarado(campo: CampoMapeado): string | null {
  if (campo.estado === ESTADO_CAMPO.FALTANTE || campo.ruta === null || campo.valor === null) return null;
  return enmascarar(campo.ruta, campo.valor);
}

export function presentarCampo(campo: CampoMapeado): CampoPresentado {
  return {
    etiqueta: campo.etiqueta,
    ruta: campo.ruta,
    estado: campo.estado,
    regla: campo.regla,
    confianza: campo.confianza,
    valor_enmascarado: valorEnmascarado(campo),
    nota: campo.nota,
    propuesta: campo.propuesta,
  };
}
