import type { CampoMapeado } from "@/domain/mapeo.ts";
import type { EstadoCampo } from "@/domain/reglas.ts";
import { exito, fallo, type Resultado } from "@/domain/resultado.ts";
import type { Plantilla } from "@/domain/tipos.ts";

export type FilaFormulario = {
  readonly etiqueta: string;
  readonly obligatorio: boolean | null;
  readonly estado: EstadoCampo;
  readonly valor: string | null;
  readonly nota: string | null;
};

export type FilaCelda = FilaFormulario & {
  readonly hoja: string;
  readonly celda_etiqueta: string;
  readonly celda_valor: string;
};

export type Formulario =
  | { readonly tipo: "celdas"; readonly filas: readonly FilaCelda[] }
  | { readonly tipo: "campos"; readonly filas: readonly FilaFormulario[] };

type Ubicable = { readonly etiqueta: string };

function filaDe(campo: CampoMapeado, obligatorio: boolean | null): FilaFormulario {
  return {
    etiqueta: campo.etiqueta,
    obligatorio,
    estado: campo.estado,
    valor: campo.estado === "faltante" ? null : campo.valor,
    nota: campo.nota,
  };
}

function emparejar<T extends Ubicable, F>(
  campos: readonly T[],
  canonico: readonly CampoMapeado[],
  construir: (campo: T, mapeado: CampoMapeado) => F,
): Resultado<readonly F[]> {
  if (campos.length !== canonico.length) return fallo("ERROR_INTERNO");
  const filas: F[] = [];
  for (const [indice, campo] of campos.entries()) {
    const mapeado = canonico[indice];
    if (mapeado === undefined || mapeado.etiqueta !== campo.etiqueta) return fallo("ERROR_INTERNO");
    filas.push(construir(campo, mapeado));
  }
  return exito(filas);
}

export function construirFilas(
  plantilla: Plantilla,
  canonico: readonly CampoMapeado[],
): Resultado<Formulario> {
  if (plantilla.tipo === "celdas") {
    const filas = emparejar(plantilla.campos, canonico, (campo, mapeado) => ({
      ...filaDe(mapeado, null),
      hoja: campo.hoja,
      celda_etiqueta: campo.celda_etiqueta,
      celda_valor: campo.celda_valor,
    }));
    return filas.ok ? exito({ tipo: "celdas", filas: filas.data }) : filas;
  }
  const filas = emparejar(plantilla.campos, canonico, (campo, mapeado) => filaDe(mapeado, campo.obligatorio));
  return filas.ok ? exito({ tipo: "campos", filas: filas.data }) : filas;
}
