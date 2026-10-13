import {
  CLAVES_SENSIBLES,
  LARGO_MINIMO_SECRETO,
  PROFUNDIDAD_MAXIMA_REDACCION,
} from "@/config/constants/redaccion.constants.ts";
import { TEXTO_MASCARA } from "@/config/strings.ts";

type Recorrido = { readonly secretos: readonly string[]; readonly ancestros: WeakSet<object> };

function secretosUtiles(secretos: readonly string[]): readonly string[] {
  return secretos
    .filter((secreto) => secreto.length >= LARGO_MINIMO_SECRETO)
    .toSorted((a, b) => b.length - a.length);
}

function limpiarTexto(texto: string, secretos: readonly string[]): string {
  return secretos.reduce((acumulado, secreto) => acumulado.split(secreto).join(TEXTO_MASCARA.oculto), texto);
}

function esClaveSensible(clave: string): boolean {
  return CLAVES_SENSIBLES.has(clave.toLowerCase());
}

function copiar(valor: object, profundidad: number, recorrido: Recorrido): unknown {
  if (Array.isArray(valor)) return valor.map((item) => recorrer(item, profundidad + 1, recorrido));
  if (valor instanceof Error) {
    return {
      name: limpiarTexto(valor.name, recorrido.secretos),
      message: limpiarTexto(valor.message, recorrido.secretos),
    };
  }
  return Object.fromEntries(
    Object.entries(valor).map(([clave, item]) => [
      clave,
      esClaveSensible(clave) ? TEXTO_MASCARA.oculto : recorrer(item, profundidad + 1, recorrido),
    ]),
  );
}

function recorrer(valor: unknown, profundidad: number, recorrido: Recorrido): unknown {
  if (typeof valor === "string") return limpiarTexto(valor, recorrido.secretos);
  if (typeof valor !== "object" || valor === null) return valor;
  if (profundidad > PROFUNDIDAD_MAXIMA_REDACCION || recorrido.ancestros.has(valor))
    return TEXTO_MASCARA.oculto;
  recorrido.ancestros.add(valor);
  const copia = copiar(valor, profundidad, recorrido);
  recorrido.ancestros.delete(valor);
  return copia;
}

export function redactar(valor: unknown, secretos: readonly string[] = []): unknown {
  try {
    return recorrer(valor, 0, { secretos: secretosUtiles(secretos), ancestros: new WeakSet() });
  } catch {
    return TEXTO_MASCARA.oculto;
  }
}
