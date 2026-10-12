import { construirDatosEnvio } from "../domain/borrador.ts";
import { renderizarPlantilla } from "../domain/plantillas.ts";
import { exito, fallo, type Resultado } from "../domain/resultado.ts";
import { evaluarEstadoPaquete } from "./armar-paquete.ts";
import { cargarSolicitudCaso, completarContextoCaso } from "./contexto-caso.ts";
import type { Entorno } from "./puertos.ts";

export type ArgsSimularEnvio = { readonly caso: string; readonly confirmado: boolean };

export type DatosEnvio = {
  readonly caso: string;
  readonly ruta: string;
  readonly bloqueos: readonly string[];
};

async function simularBajoCandado(args: ArgsSimularEnvio, entorno: Entorno): Promise<Resultado<DatosEnvio>> {
  const cargada = await cargarSolicitudCaso(args.caso, entorno);
  if (!cargada.ok) return cargada;
  if (args.confirmado !== true) return fallo("CONFIRMACION_REQUERIDA");

  const { caso } = cargada.data;
  if (!(await entorno.salida.existe(caso, "checklist"))) return fallo("PAQUETE_NO_ARMADO");

  const contexto = await completarContextoCaso(cargada.data, entorno);
  if (!contexto.ok) return contexto;
  const checklist = await evaluarEstadoPaquete(contexto.data, entorno);
  if (!checklist.ok) return checklist;

  const plantilla = await entorno.plantillas.cargar(contexto.data.reglas, "envio_simulado");
  if (!plantilla.ok) return plantilla;
  const archivos = await entorno.salida.listarPaquete(caso);
  const datos = construirDatosEnvio(caso, contexto.data.solicitud, checklist.data, archivos);
  const texto = renderizarPlantilla(plantilla.data, datos, contexto.data.reglas.plantillas.envio_simulado);
  if (!texto.ok) return texto;

  const ruta = await entorno.salida.escribir(caso, "envioSimulado", texto.data);
  return exito({ caso, ruta, bloqueos: checklist.data.bloqueos });
}

export function simularEnvio(args: ArgsSimularEnvio, entorno: Entorno): Promise<Resultado<DatosEnvio>> {
  return entorno.candado(args.caso, () => simularBajoCandado(args, entorno));
}
