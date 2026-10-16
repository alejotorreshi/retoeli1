import {
  EVENTO_VISIBILIDAD,
  REINTENTO_CONFIG_MS,
  VISIBILIDAD_VISIBLE,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_ALMACEN } from "@web/config/strings.ts";
import {
  seleccionarAccesoConcedido,
  seleccionarFaltaConfig,
  seleccionarSesionPorCargar,
} from "@web/store/selectores.ts";
import type { Acciones, EstadoRaiz, InstanciaAlmacen } from "@web/types/store.type.ts";
import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

export const ContextoAlmacen = createContext<InstanciaAlmacen | null>(null);

export function useAlmacen(): InstanciaAlmacen {
  const instancia = useContext(ContextoAlmacen);
  if (instancia === null) throw new Error(TEXTO_ALMACEN.fueraDelProveedor);
  return instancia;
}

export function useSeleccion<T>(seleccionar: (estado: EstadoRaiz) => T): T {
  const { almacen } = useAlmacen();
  return useSyncExternalStore(almacen.suscribir, () => seleccionar(almacen.leer()));
}

export function useAcciones(): Acciones {
  return useAlmacen().acciones;
}

function alVolverVisible(accion: () => void): () => void {
  return () => {
    if (document.visibilityState === VISIBILIDAD_VISIBLE) accion();
  };
}

export function useSincronizacion(): void {
  const acciones = useAcciones();
  const accesoConcedido = useSeleccion(seleccionarAccesoConcedido);
  const sesionPorCargar = useSeleccion(seleccionarSesionPorCargar);
  const faltaConfig = useSeleccion(seleccionarFaltaConfig);

  useEffect(() => {
    const alVolverALaPestana = alVolverVisible(acciones.refrescarSalud);
    acciones.refrescarSalud();
    document.addEventListener(EVENTO_VISIBILIDAD, alVolverALaPestana);
    return () => {
      document.removeEventListener(EVENTO_VISIBILIDAD, alVolverALaPestana);
      acciones.cancelarSalud();
    };
  }, [acciones]);

  useEffect(() => {
    if (!accesoConcedido || sesionPorCargar === null) return;
    const controlador = new AbortController();
    void acciones.cargarSesion(sesionPorCargar, controlador.signal);
    return () => controlador.abort();
  }, [acciones, accesoConcedido, sesionPorCargar]);

  useEffect(() => {
    const controlador = new AbortController();
    void acciones.cargarConfig(controlador.signal);
    return () => controlador.abort();
  }, [acciones]);

  useEffect(() => {
    if (!faltaConfig) return;
    const controlador = new AbortController();
    function reintentar(): void {
      void acciones.reintentarConfig(controlador.signal);
    }
    const alVolverALaPestana = alVolverVisible(reintentar);
    const temporizador = setInterval(reintentar, REINTENTO_CONFIG_MS);
    document.addEventListener(EVENTO_VISIBILIDAD, alVolverALaPestana);
    return () => {
      clearInterval(temporizador);
      document.removeEventListener(EVENTO_VISIBILIDAD, alVolverALaPestana);
      controlador.abort();
    };
  }, [acciones, faltaConfig]);
}
