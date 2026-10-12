import { exito, type Fallo, fallo, type Resultado } from "./resultado.ts";

export type ValorEscalar = string | number;

export type FilaPlantilla = Readonly<Record<string, ValorEscalar>>;

export type ValorPlantilla = ValorEscalar | readonly FilaPlantilla[];

export type ContextoPlantilla = Readonly<Record<string, ValorPlantilla>>;

type Ambito = Readonly<Record<string, ValorPlantilla>>;

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

function escapar(valor: ValorEscalar): string {
  return String(valor).replace(SALTO_DE_LINEA, " ").replace(BARRA_VERTICAL, "\\|");
}

function buscar(nombre: string, ambitos: readonly Ambito[]): ValorPlantilla | undefined {
  const ambito = ambitos.find((candidato) => Object.hasOwn(candidato, nombre));
  return ambito?.[nombre];
}

function esEscalar(valor: ValorPlantilla | undefined): valor is ValorEscalar {
  return typeof valor === "string" || typeof valor === "number";
}

function renderizarVariable(crudo: string, ambitos: readonly Ambito[], problemas: string[]): string {
  const nombre = crudo.trim();
  if (MARCA_DE_SECCION.test(nombre)) {
    problemas.push(`tiene una sección sin cerrar o anidada: ${nombre}`);
    return "";
  }
  const valor = buscar(nombre, ambitos);
  if (!esEscalar(valor)) {
    problemas.push(`usa la variable desconocida ${nombre}`);
    return "";
  }
  return escapar(valor);
}

function renderizarVariables(texto: string, ambitos: readonly Ambito[], problemas: string[]): string {
  return texto.replace(ETIQUETA, (_etiqueta, crudo: string) => renderizarVariable(crudo, ambitos, problemas));
}

function renderizarSeccion(
  marca: string,
  nombre: string,
  interior: string,
  contexto: ContextoPlantilla,
  problemas: string[],
): string {
  const lista = buscar(nombre.trim(), [contexto]);
  if (lista === undefined || esEscalar(lista)) {
    problemas.push(`usa la sección desconocida ${nombre.trim()}`);
    return "";
  }
  if (marca === "^") return lista.length === 0 ? renderizarVariables(interior, [contexto], problemas) : "";
  return lista.map((fila) => renderizarVariables(interior, [fila, contexto], problemas)).join("");
}

function plantillaInvalida(nombrePlantilla: string, problema: string): Fallo {
  return fallo("REGLAS_INVALIDAS", { detalle: `la plantilla ${nombrePlantilla} ${problema}.` });
}

export function renderizarPlantilla(
  texto: string,
  contexto: ContextoPlantilla,
  nombrePlantilla: string,
): Resultado<string> {
  if (!etiquetasBalanceadas(texto))
    return plantillaInvalida(nombrePlantilla, "tiene una etiqueta sin cerrar");
  const problemas: string[] = [];
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
        return renderizarSeccion(marca, seccion, interior ?? "", contexto, problemas);
      }
      return renderizarVariable(variable ?? "", [contexto], problemas);
    },
  );
  const primero = problemas[0];
  return primero === undefined ? exito(salida) : plantillaInvalida(nombrePlantilla, primero);
}
