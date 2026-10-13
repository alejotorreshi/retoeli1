import { renderizarTextoPlano } from "./plantillas.ts";
import { type Reglas, VARIABLES_AVISO_SOPORTE, VARIABLES_NOTA_CAMPO } from "./reglas.ts";
import { exito, type Resultado } from "./resultado.ts";

type TextoDeRegla = {
  readonly nombre: string;
  readonly texto: string;
  readonly variables: readonly string[];
};

const VALOR_DE_MUESTRA = "x";

function textosDe(reglas: Reglas): readonly TextoDeRegla[] {
  const tributario = reglas.identificador_tributario;
  return [
    {
      nombre: "identificador_tributario.nota_extranjero",
      texto: tributario.nota_extranjero,
      variables: VARIABLES_NOTA_CAMPO,
    },
    {
      nombre: "identificador_tributario.nota_generica",
      texto: tributario.nota_generica,
      variables: VARIABLES_NOTA_CAMPO,
    },
    ...reglas.notas_contexto.map((nota, indice) => ({
      nombre: `notas_contexto[${indice}]`,
      texto: nota.texto,
      variables: VARIABLES_NOTA_CAMPO,
    })),
    {
      nombre: "soportes.aviso_emisor_distinto",
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
