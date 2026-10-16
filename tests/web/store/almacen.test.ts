import { describe, expect, test } from "bun:test";
import { crearAlmacen } from "@web/store/almacen.ts";

const ACCION_CONTADOR = {
  SUMAR: "sumar",
  IGNORAR: "ignorar",
} as const;

type Contador = { readonly valor: number };

type AccionContador = { readonly tipo: (typeof ACCION_CONTADOR)[keyof typeof ACCION_CONTADOR] };

const INICIAL: Contador = { valor: 0 };

function reducirContador(estado: Contador, accion: AccionContador): Contador {
  return accion.tipo === ACCION_CONTADOR.SUMAR ? { valor: estado.valor + 1 } : estado;
}

describe("crearAlmacen", () => {
  test("leer devuelve el estado inicial tal cual", () => {
    const almacen = crearAlmacen(reducirContador, INICIAL);
    expect(almacen.leer()).toBe(INICIAL);
  });

  test("despachar aplica el reductor y avisa una vez a cada oyente suscrito", () => {
    const almacen = crearAlmacen(reducirContador, INICIAL);
    const avisos: string[] = [];
    almacen.suscribir(() => avisos.push("a"));
    almacen.suscribir(() => avisos.push("b"));
    almacen.despachar({ tipo: ACCION_CONTADOR.SUMAR });
    expect(almacen.leer()).toEqual({ valor: 1 });
    expect(avisos).toEqual(["a", "b"]);
  });

  test("un reductor que devuelve la misma referencia no avisa a nadie", () => {
    const almacen = crearAlmacen(reducirContador, INICIAL);
    let avisos = 0;
    almacen.suscribir(() => {
      avisos += 1;
    });
    almacen.despachar({ tipo: ACCION_CONTADOR.IGNORAR });
    expect(almacen.leer()).toBe(INICIAL);
    expect(avisos).toBe(0);
  });

  test("la función que devuelve suscribir quita al oyente", () => {
    const almacen = crearAlmacen(reducirContador, INICIAL);
    let avisos = 0;
    const desuscribir = almacen.suscribir(() => {
      avisos += 1;
    });
    almacen.despachar({ tipo: ACCION_CONTADOR.SUMAR });
    desuscribir();
    almacen.despachar({ tipo: ACCION_CONTADOR.SUMAR });
    expect(almacen.leer()).toEqual({ valor: 2 });
    expect(avisos).toBe(1);
  });
});
