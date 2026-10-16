import { crearAcciones } from "@web/store/acciones.ts";
import { crearAlmacen } from "@web/store/almacen.ts";
import { estadoRaizInicial, reducirRaiz } from "@web/store/raiz.ts";
import type { Dependencias, InstanciaAlmacen } from "@web/types/store.type.ts";

export function crearInstancia(dependencias: Dependencias): InstanciaAlmacen {
  const almacen = crearAlmacen(reducirRaiz, estadoRaizInicial(dependencias.leerSesionGuardada()));
  return { almacen, acciones: crearAcciones(almacen, dependencias) };
}
