import type { Almacen } from "@web/types/store.type.ts";

export function crearAlmacen<E, A>(reducir: (estado: E, accion: A) => E, inicial: E): Almacen<E, A> {
  let estado = inicial;
  const oyentes = new Set<() => void>();
  return {
    leer: () => estado,
    suscribir: (oyente) => {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
    despachar: (accion) => {
      const siguiente = reducir(estado, accion);
      if (Object.is(siguiente, estado)) return;
      estado = siguiente;
      for (const oyente of oyentes) oyente();
    },
  };
}
