import { type ContextoCaso, cargarContextoCaso } from "@/application/contexto-caso.ts";
import { escribirMapeo, mapeoCanonico } from "@/application/mapear-campos.ts";
import type { Entorno } from "@/application/puertos.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { compararMapeo, type ItemMapeo } from "@/domain/comparar-mapeo.ts";
import { construirFilas } from "@/domain/formulario.ts";
import { type CampoMapeado, type ConteoEstados, contarEstados } from "@/domain/mapeo.ts";
import { renderizarPlantilla } from "@/domain/plantillas.ts";
import { AVISO_FORMATO_NO_SOPORTADO, construirDatosPortal } from "@/domain/portal.ts";
import { exito, fallo, type Resultado } from "@/domain/resultado.ts";
import type { Formato } from "@/domain/tipos.ts";

export type ArgsGenerarFormulario = {
  readonly caso: string;
  readonly mapeo: readonly ItemMapeo[];
};

export type DatosFormulario = {
  readonly caso: string;
  readonly ruta: string;
  readonly formato: Formato;
  readonly conteo: ConteoEstados;
  readonly aviso: string | null;
};

async function cerrar(
  contexto: ContextoCaso,
  canonico: readonly CampoMapeado[],
  entorno: Entorno,
  ruta: string,
  formato: Formato,
  aviso: string | null = null,
): Promise<Resultado<DatosFormulario>> {
  await escribirMapeo(contexto, canonico, entorno);
  return exito({ caso: contexto.caso, ruta, formato, conteo: contarEstados(canonico), aviso });
}

async function generarXlsx(
  contexto: ContextoCaso,
  canonico: readonly CampoMapeado[],
  entorno: Entorno,
): Promise<Resultado<DatosFormulario>> {
  const formulario = construirFilas(contexto.plantilla, canonico);
  if (!formulario.ok) return formulario;
  if (formulario.data.tipo !== "celdas") return fallo(CODIGO_ERROR.PLANTILLA_INVALIDA);
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

async function generarPortal(
  contexto: ContextoCaso,
  canonico: readonly CampoMapeado[],
  entorno: Entorno,
): Promise<Resultado<DatosFormulario>> {
  const plantilla = await entorno.plantillas.cargar(contexto.reglas, "valores_portal");
  if (!plantilla.ok) return plantilla;
  const caso = { caso: contexto.caso, cliente: contexto.solicitud.cliente };
  const datos = construirDatosPortal(caso, canonico, entorno.reloj.hoy());
  const texto = renderizarPlantilla(plantilla.data, datos, contexto.reglas.plantillas.valores_portal);
  if (!texto.ok) return texto;
  const ruta = await entorno.salida.escribir(contexto.caso, "valoresPortal", texto.data);
  return cerrar(contexto, canonico, entorno, ruta, "portal", AVISO_FORMATO_NO_SOPORTADO);
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
      return generarPortal(contexto, canonico, entorno);
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
    return fallo(CODIGO_ERROR.MAPEO_INCONSISTENTE, { parcial: { diferencias: comparacion.diferencias } });
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
