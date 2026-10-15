import { describe, expect, test } from "bun:test";
import {
  CLAVES_SENSIBLES,
  LARGO_MINIMO_SECRETO,
  PROFUNDIDAD_MAXIMA_REDACCION,
} from "@/config/constants/redaction.constants.ts";
import { TEXTO_MASCARA } from "@/config/strings.ts";
import { redactar } from "@/domain/policies/redaccion.policy.ts";

const OCULTO = TEXTO_MASCARA.oculto;

type Nodo = { nivel: number; hijo?: Nodo };

function anidar(niveles: number): Nodo {
  let actual: Nodo = { nivel: niveles };
  for (let nivel = niveles - 1; nivel >= 0; nivel -= 1) actual = { nivel, hijo: actual };
  return actual;
}

function bajar(valor: unknown, pasos: number): unknown {
  let actual = valor;
  for (let paso = 0; paso < pasos; paso += 1) {
    if (typeof actual !== "object" || actual === null || !("hijo" in actual)) return undefined;
    actual = actual.hijo;
  }
  return actual;
}

describe("redactar: claves sensibles (SEG-02)", () => {
  test("oculta el valor de toda clave sensible sin importar mayúsculas ni profundidad", () => {
    const resultado = redactar({
      apiKey: "x",
      Authorization: "Bearer y",
      nested: { LLM_API_KEY: "z", valor: "900123456", caso: "co-industrias-delta" },
      ok: true,
    });
    expect(resultado).toEqual({
      apiKey: OCULTO,
      Authorization: OCULTO,
      nested: { LLM_API_KEY: OCULTO, valor: OCULTO, caso: "co-industrias-delta" },
      ok: true,
    });
  });

  test("una clave sensible oculta el valor entero aunque sea un objeto o un arreglo", () => {
    expect(
      redactar({ valores: ["900123456", "71555123"], headers: { authorization: { esquema: "Bearer" } } }),
    ).toEqual({ valores: OCULTO, headers: { authorization: OCULTO } });
  });

  test("todas las claves sensibles están en minúsculas", () => {
    for (const clave of CLAVES_SENSIBLES) expect(clave).toBe(clave.toLowerCase());
    for (const clave of ["apikey", "authorization", "llm_api_key", "deepseek_api_key", "valor", "valores"]) {
      expect(CLAVES_SENSIBLES.has(clave)).toBe(true);
    }
  });
});

describe("redactar: secretos dentro del texto", () => {
  test("reemplaza cada aparición del secreto dentro de cualquier texto", () => {
    expect(redactar({ detalle: "falló con sk-ABCDEFGH1234 al llamar" }, ["sk-ABCDEFGH1234"])).toEqual({
      detalle: `falló con ${OCULTO} al llamar`,
    });
    expect(redactar("sk-ABCDEFGH1234 y otra vez sk-ABCDEFGH1234", ["sk-ABCDEFGH1234"])).toBe(
      `${OCULTO} y otra vez ${OCULTO}`,
    );
  });

  test("un secreto más corto que el mínimo se ignora y nunca borra el texto", () => {
    const corto = "a".repeat(LARGO_MINIMO_SECRETO - 1);
    expect(redactar({ detalle: "abc" }, ["", "ab", corto])).toEqual({ detalle: "abc" });
    expect(redactar(`hola ${corto}`, [corto])).toBe(`hola ${corto}`);
  });

  test("limpia los textos dentro de arreglos y deja pasar números, booleanos y null", () => {
    const secreto = "clave-de-prueba-Zq9X";
    expect(redactar({ lista: [`x ${secreto}`, 3, false, null], n: 7, b: true, v: null }, [secreto])).toEqual({
      lista: [`x ${OCULTO}`, 3, false, null],
      n: 7,
      b: true,
      v: null,
    });
    expect(redactar(42)).toBe(42);
    expect(redactar(null)).toBeNull();
  });

  test("con conPila la copia del error trae la pila limpia; sin la opción no la trae", () => {
    const secreto = "clave-de-prueba-Zq9X";
    const fallo = new TypeError(`sin red ${secreto}`);
    const conPila = redactar({ fallo }, [secreto], { conPila: true });
    const pila = JSON.stringify(conPila);
    expect(pila).toContain('"stack"');
    expect(pila).toContain("redaccion.policy.test");
    expect(pila).not.toContain(secreto);
    expect(redactar({ fallo }, [secreto])).toEqual({
      fallo: { name: "TypeError", message: `sin red ${OCULTO}` },
    });
  });

  test("el mensaje de un error se limpia y no se pierde", () => {
    const secreto = "clave-de-prueba-Zq9X";
    expect(redactar({ fallo: new TypeError(`sin red ${secreto}`) }, [secreto])).toEqual({
      fallo: { name: "TypeError", message: `sin red ${OCULTO}` },
    });
  });
});

describe("redactar: estructuras peligrosas", () => {
  test("corta lo que está más hondo que la profundidad máxima", () => {
    const resultado = redactar(anidar(PROFUNDIDAD_MAXIMA_REDACCION + 3));
    expect(bajar(resultado, PROFUNDIDAD_MAXIMA_REDACCION)).toEqual({
      nivel: PROFUNDIDAD_MAXIMA_REDACCION,
      hijo: OCULTO,
    });
    expect(bajar(resultado, PROFUNDIDAD_MAXIMA_REDACCION + 1)).toBe(OCULTO);
  });

  test("un objeto circular no lanza y el ciclo queda oculto", () => {
    const circular: { nombre: string; yo?: unknown; lista: unknown[] } = { nombre: "a", lista: [] };
    circular.yo = circular;
    circular.lista.push(circular);
    expect(() => redactar(circular)).not.toThrow();
    expect(redactar(circular)).toEqual({ nombre: "a", lista: [OCULTO], yo: OCULTO });
  });

  test("una referencia compartida que no es ciclo se conserva en ambos lugares", () => {
    const compartido = { caso: "co-industrias-delta" };
    expect(redactar({ a: compartido, b: compartido })).toEqual({ a: compartido, b: compartido });
  });

  test("nunca muta la entrada", () => {
    const entrada = { apiKey: "x", nested: { valor: "900123456", lista: ["sk-ABCDEFGH1234"] } };
    const copia = structuredClone(entrada);
    const resultado = redactar(entrada, ["sk-ABCDEFGH1234"]);
    expect(entrada).toEqual(copia);
    expect(resultado).not.toBe(entrada);
  });
});
