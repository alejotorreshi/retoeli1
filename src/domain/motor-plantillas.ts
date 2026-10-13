import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { TEXTO_MOTOR_PLANTILLAS } from "@/config/strings.ts";
import { exito, fallo } from "@/domain/resultado.ts";
import type {
  ContextoPlantilla,
  SeccionCondicional,
  ValorEscalar,
  ValorPlantilla,
} from "@/domain/types/motor-plantillas.type.ts";
import type { Fallo, Resultado } from "@/domain/types/resultado.type.ts";

type Ambito = Readonly<Record<string, ValorPlantilla>>;

type Escape = (valor: string) => string;

type Render = { readonly escapar: Escape; readonly problemas: string[] };

const ETIQUETA = /\{\{([^{}]*)\}\}/g;
const BLOQUE = /\{\{([#^])([^{}]*)\}\}([\s\S]*?)\{\{\/\2\}\}|\{\{([^{}]*)\}\}/g;
const MARCA_DE_SECCION = /^[#^/]/;
const SALTO_DE_LINEA = /\r\n|\r|\n/g;
const BARRA_VERTICAL = /\|/g;

function contar(texto: string, patron: string): number {
  return texto.split(patron).length - 1;
}

function etiquetasBalanceadas(texto: string): boolean {
  const completas = [...texto.matchAll(ETIQUETA)].length;
  return contar(texto, "{{") === completas && contar(texto, "}}") === completas;
}

const ESCAPE_MARKDOWN: Escape = (valor) => valor.replace(BARRA_VERTICAL, "\\|");

const SIN_ESCAPE: Escape = (valor) => valor;

function enUnaLinea(valor: ValorEscalar): string {
  return String(valor).replace(SALTO_DE_LINEA, " ");
}

function buscar(nombre: string, ambitos: readonly Ambito[]): ValorPlantilla | undefined {
  const ambito = ambitos.find((candidato) => Object.hasOwn(candidato, nombre));
  return ambito?.[nombre];
}

function esEscalar(valor: ValorPlantilla | undefined): valor is ValorEscalar {
  return typeof valor === "string" || typeof valor === "number";
}

function renderizarVariable(crudo: string, ambitos: readonly Ambito[], render: Render): string {
  const nombre = crudo.trim();
  if (MARCA_DE_SECCION.test(nombre)) {
    render.problemas.push(TEXTO_MOTOR_PLANTILLAS.seccionSinCerrar(nombre));
    return "";
  }
  const valor = buscar(nombre, ambitos);
  if (!esEscalar(valor)) {
    render.problemas.push(TEXTO_MOTOR_PLANTILLAS.variableDesconocida(nombre));
    return "";
  }
  return render.escapar(enUnaLinea(valor));
}

function renderizarVariables(texto: string, ambitos: readonly Ambito[], render: Render): string {
  return texto.replace(ETIQUETA, (_etiqueta, crudo: string) => renderizarVariable(crudo, ambitos, render));
}

function renderizarSeccion(
  marca: string,
  nombre: string,
  interior: string,
  contexto: ContextoPlantilla,
  render: Render,
): string {
  const lista = buscar(nombre.trim(), [contexto]);
  if (lista === undefined || esEscalar(lista)) {
    render.problemas.push(TEXTO_MOTOR_PLANTILLAS.seccionDesconocida(nombre.trim()));
    return "";
  }
  if (marca === "^") return lista.length === 0 ? renderizarVariables(interior, [contexto], render) : "";
  return lista.map((fila) => renderizarVariables(interior, [fila, contexto], render)).join("");
}

export function plantillaInvalida(nombrePlantilla: string, problema: string): Fallo {
  return fallo(CODIGO_ERROR.REGLAS_INVALIDAS, {
    detalle: TEXTO_MOTOR_PLANTILLAS.plantillaInvalida(nombrePlantilla, problema),
  });
}

function renderizar(
  texto: string,
  contexto: ContextoPlantilla,
  nombrePlantilla: string,
  escapar: Escape,
): Resultado<string> {
  if (!etiquetasBalanceadas(texto))
    return plantillaInvalida(nombrePlantilla, TEXTO_MOTOR_PLANTILLAS.etiquetaSinCerrar);
  const render: Render = { escapar, problemas: [] };
  const salida = texto.replace(
    BLOQUE,
    (
      _bloque: string,
      marca: string | undefined,
      seccion: string | undefined,
      interior: string | undefined,
      variable: string | undefined,
    ) => {
      if (marca !== undefined && seccion !== undefined) {
        return renderizarSeccion(marca, seccion, interior ?? "", contexto, render);
      }
      return renderizarVariable(variable ?? "", [contexto], render);
    },
  );
  const primero = render.problemas[0];
  return primero === undefined ? exito(salida) : plantillaInvalida(nombrePlantilla, primero);
}

export function renderizarPlantilla(
  texto: string,
  contexto: ContextoPlantilla,
  nombrePlantilla: string,
): Resultado<string> {
  return renderizar(texto, contexto, nombrePlantilla, ESCAPE_MARKDOWN);
}

export function renderizarTextoPlano(
  texto: string,
  contexto: ContextoPlantilla,
  nombrePlantilla: string,
): Resultado<string> {
  return renderizar(texto, contexto, nombrePlantilla, SIN_ESCAPE);
}

export function seccionSi(condicion: boolean): SeccionCondicional {
  return condicion ? [{}] : [];
}
