import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { TIPO_PLANTILLA } from "@/config/constants/forms.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import type { FilaFormulario, Formulario } from "@/domain/types/formulario.type.ts";
import type { CampoMapeado } from "@/domain/types/mapeo.type.ts";
import type { PlantillaCaso } from "@/domain/types/plantilla-caso.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";
import { exito, fallo } from "@/domain/utils/resultado.util.ts";

type Ubicable = { readonly etiqueta: string };

function filaDe(campo: CampoMapeado, obligatorio: boolean | null): FilaFormulario {
  return {
    etiqueta: campo.etiqueta,
    obligatorio,
    estado: campo.estado,
    valor: campo.estado === ESTADO_CAMPO.FALTANTE ? null : campo.valor,
    nota: campo.nota,
  };
}

function emparejar<T extends Ubicable, F>(
  campos: readonly T[],
  canonico: readonly CampoMapeado[],
  construir: (campo: T, mapeado: CampoMapeado) => F,
): Resultado<readonly F[]> {
  if (campos.length !== canonico.length) return fallo(CODIGO_ERROR.ERROR_INTERNO);
  const filas: F[] = [];
  for (const [indice, campo] of campos.entries()) {
    const mapeado = canonico[indice];
    if (mapeado === undefined || mapeado.etiqueta !== campo.etiqueta)
      return fallo(CODIGO_ERROR.ERROR_INTERNO);
    filas.push(construir(campo, mapeado));
  }
  return exito(filas);
}

export function construirFilas(
  plantilla: PlantillaCaso,
  canonico: readonly CampoMapeado[],
): Resultado<Formulario> {
  if (plantilla.tipo === TIPO_PLANTILLA.CELDAS) {
    const filas = emparejar(plantilla.campos, canonico, (campo, mapeado) => ({
      ...filaDe(mapeado, null),
      hoja: campo.hoja,
      celda_etiqueta: campo.celda_etiqueta,
      celda_valor: campo.celda_valor,
    }));
    return filas.ok ? exito({ tipo: TIPO_PLANTILLA.CELDAS, filas: filas.data }) : filas;
  }
  const filas = emparejar(plantilla.campos, canonico, (campo, mapeado) => filaDe(mapeado, campo.obligatorio));
  return filas.ok ? exito({ tipo: TIPO_PLANTILLA.CAMPOS, filas: filas.data }) : filas;
}
