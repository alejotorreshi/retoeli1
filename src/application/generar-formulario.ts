import { compararMapeo, type ItemMapeo } from "../domain/comparar-mapeo.ts";
import { construirFilas } from "../domain/formulario.ts";
import { type CampoMapeado, type ConteoEstados, contarEstados } from "../domain/mapeo.ts";
import { exito, fallo, type Resultado } from "../domain/resultado.ts";
import type { Formato } from "../domain/tipos.ts";
import { type ContextoCaso, cargarContextoCaso } from "./contexto-caso.ts";
import { escribirMapeo, mapeoCanonico } from "./mapear-campos.ts";
import type { Entorno } from "./puertos.ts";

export type ArgsGenerarFormulario = {
  readonly caso: string;
  readonly mapeo: readonly ItemMapeo[];
};

export type DatosFormulario = {
  readonly caso: string;
  readonly ruta: string;
  readonly formato: Formato;
  readonly conteo: ConteoEstados;
};

async function cerrar(
  contexto: ContextoCaso,
  canonico: readonly CampoMapeado[],
  entorno: Entorno,
  ruta: string,
  formato: Formato,
): Promise<Resultado<DatosFormulario>> {
  await escribirMapeo(contexto, canonico, entorno);
  return exito({ caso: contexto.caso, ruta, formato, conteo: contarEstados(canonico) });
}

async function generarXlsx(
  contexto: ContextoCaso,
  canonico: readonly CampoMapeado[],
  entorno: Entorno,
): Promise<Resultado<DatosFormulario>> {
  const formulario = construirFilas(contexto.plantilla, canonico);
  if (!formulario.ok) return formulario;
  if (formulario.data.tipo !== "celdas") return fallo("PLANTILLA_INVALIDA");
  const bytes = await entorno.formularios.xlsx(formulario.data.filas, entorno.reloj.hoy());
  const ruta = await entorno.salida.binario(contexto.caso, "formularioXlsx", bytes);
  return cerrar(contexto, canonico, entorno, ruta, "xlsx");
}

async function generarPdf(
  contexto: ContextoCaso,
  canonico: readonly CampoMapeado[],
  entorno: Entorno,
): Promise<Resultado<DatosFormulario>> {
  const formulario = construirFilas(contexto.plantilla, canonico);
  if (!formulario.ok) return formulario;
  const entrada = { caso: contexto.caso, cliente: contexto.solicitud.cliente, filas: formulario.data.filas };
  const bytes = await entorno.formularios.pdf(entrada, entorno.reloj.hoy());
  const ruta = await entorno.salida.binario(contexto.caso, "formularioPdf", bytes);
  return cerrar(contexto, canonico, entorno, ruta, "pdf");
}

async function despachar(
  contexto: ContextoCaso,
  canonico: readonly CampoMapeado[],
  entorno: Entorno,
): Promise<Resultado<DatosFormulario>> {
  switch (contexto.solicitud.formato) {
    case "xlsx":
      return generarXlsx(contexto, canonico, entorno);
    case "pdf":
      return generarPdf(contexto, canonico, entorno);
    case "portal":
      return fallo("ERROR_INTERNO");
  }
}

async function generarBajoCandado(
  args: ArgsGenerarFormulario,
  entorno: Entorno,
): Promise<Resultado<DatosFormulario>> {
  const contexto = await cargarContextoCaso(args.caso, entorno);
  if (!contexto.ok) return contexto;
  const canonico = mapeoCanonico(contexto.data);
  if (!canonico.ok) return canonico;
  const comparacion = compararMapeo(canonico.data, args.mapeo);
  if (!comparacion.iguales) {
    return fallo("MAPEO_INCONSISTENTE", { parcial: { diferencias: comparacion.diferencias } });
  }
  await entorno.salida.limpiarPrevios(contexto.data.caso);
  return despachar(contexto.data, canonico.data, entorno);
}

export function generarFormulario(
  args: ArgsGenerarFormulario,
  entorno: Entorno,
): Promise<Resultado<DatosFormulario>> {
  return entorno.candado(args.caso, () => generarBajoCandado(args, entorno));
}
