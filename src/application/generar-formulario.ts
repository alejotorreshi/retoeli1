import { construirFilas } from "../domain/formulario.ts";
import { type CampoMapeado, type ConteoEstados, contarEstados } from "../domain/mapeo.ts";
import type { EstadoCampo } from "../domain/reglas.ts";
import { exito, fallo, type Resultado } from "../domain/resultado.ts";
import type { Formato } from "../domain/tipos.ts";
import { type ContextoCaso, cargarContextoCaso } from "./contexto-caso.ts";
import { escribirMapeo, mapeoCanonico } from "./mapear-campos.ts";
import type { Entorno } from "./puertos.ts";

export type ItemMapeoRecibido = {
  readonly etiqueta: string;
  readonly estado: EstadoCampo;
  readonly ruta: string | null;
};

export type ArgsGenerarFormulario = {
  readonly caso: string;
  readonly mapeo: readonly ItemMapeoRecibido[];
};

export type DatosFormulario = {
  readonly caso: string;
  readonly ruta: string;
  readonly formato: Formato;
  readonly conteo: ConteoEstados;
};

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
  await escribirMapeo(contexto, canonico, entorno);
  return exito({ caso: contexto.caso, ruta, formato: "xlsx", conteo: contarEstados(canonico) });
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
  return despachar(contexto.data, canonico.data, entorno);
}

export function generarFormulario(
  args: ArgsGenerarFormulario,
  entorno: Entorno,
): Promise<Resultado<DatosFormulario>> {
  return entorno.candado(args.caso, () => generarBajoCandado(args, entorno));
}
