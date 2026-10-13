import { TIPO_PLANTILLA } from "@/config/constants/forms.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import type { PlantillaCaso } from "@/domain/types/plantilla-caso.type.ts";
import type { Reglas } from "@/domain/types/reglas.type.ts";
import type { CampoAmbiguo, CampoSolicitado } from "@/domain/types/solicitud.type.ts";
import { normalizarEtiqueta } from "@/domain/utils/normalizar.util.ts";

export function camposSolicitados(plantilla: PlantillaCaso): CampoSolicitado[] {
  if (plantilla.tipo === TIPO_PLANTILLA.CELDAS) {
    return plantilla.campos.map((campo) => ({ etiqueta: campo.etiqueta, obligatorio: null }));
  }
  return plantilla.campos.map((campo) => ({ etiqueta: campo.etiqueta, obligatorio: campo.obligatorio }));
}

export function detectarAmbiguos(
  campos: readonly CampoSolicitado[],
  reglas: Reglas,
  pais: string,
): CampoAmbiguo[] {
  const genericas = new Set(reglas.etiquetas_genericas.map(normalizarEtiqueta));
  const porPais = reglas.identificador_tributario.por_pais;
  const propuesta = Object.hasOwn(porPais, pais) ? (porPais[pais] ?? null) : null;
  return campos
    .filter((campo) => genericas.has(normalizarEtiqueta(campo.etiqueta)))
    .map((campo) => ({ etiqueta: campo.etiqueta, estado: ESTADO_CAMPO.REQUIERE_CONFIRMACION, propuesta }));
}
