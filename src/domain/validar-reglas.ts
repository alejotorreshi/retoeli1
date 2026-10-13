import {
  NOMBRE_TEXTO_REGLA,
  VALOR_DE_MUESTRA,
  VARIABLES_AVISO_SOPORTE,
  VARIABLES_NOTA_CAMPO,
} from "@/config/constants/mapping.constants.ts";
import { renderizarTextoPlano } from "@/domain/plantillas.ts";
import type { Reglas } from "@/domain/reglas.ts";
import { exito, type Resultado } from "@/domain/resultado.ts";

type TextoDeRegla = {
  readonly nombre: string;
  readonly texto: string;
  readonly variables: readonly string[];
};

function textosDe(reglas: Reglas): readonly TextoDeRegla[] {
  const tributario = reglas.identificador_tributario;
  return [
    {
      nombre: NOMBRE_TEXTO_REGLA.NOTA_EXTRANJERO,
      texto: tributario.nota_extranjero,
      variables: VARIABLES_NOTA_CAMPO,
    },
    {
      nombre: NOMBRE_TEXTO_REGLA.NOTA_GENERICA,
      texto: tributario.nota_generica,
      variables: VARIABLES_NOTA_CAMPO,
    },
    ...reglas.notas_contexto.map((nota, indice) => ({
      nombre: `${NOMBRE_TEXTO_REGLA.NOTAS_CONTEXTO}[${indice}]`,
      texto: nota.texto,
      variables: VARIABLES_NOTA_CAMPO,
    })),
    {
      nombre: NOMBRE_TEXTO_REGLA.AVISO_EMISOR,
      texto: reglas.soportes.aviso_emisor_distinto,
      variables: VARIABLES_AVISO_SOPORTE,
    },
  ];
}

export function validarTextosDeReglas(reglas: Reglas): Resultado<Reglas> {
  for (const { nombre, texto, variables } of textosDe(reglas)) {
    const muestra = Object.fromEntries(variables.map((variable) => [variable, VALOR_DE_MUESTRA]));
    const renderizado = renderizarTextoPlano(texto, muestra, nombre);
    if (!renderizado.ok) return renderizado;
  }
  return exito(reglas);
}
