import { cargarContextoCaso } from "@/application/services/contexto-caso.service.ts";
import { escribirMapeo, mapeoCanonico } from "@/application/services/mapeo-canonico.service.ts";
import type { ContextoCaso } from "@/application/types/contexto-caso.type.ts";
import type {
  ArgsGenerarFormulario,
  CierreFormulario,
  DatosFormulario,
} from "@/application/types/generar-formulario.type.ts";
import type { Entorno } from "@/application/types/puertos.type.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ARCHIVOS_SALIDA } from "@/config/constants/files.constants.ts";
import { FORMATO, TIPO_PLANTILLA } from "@/config/constants/forms.constants.ts";
import { CLAVE_PLANTILLA } from "@/config/constants/knowledge.constants.ts";
import { TEXTO_PORTAL } from "@/config/strings.ts";
import { construirFilas } from "@/domain/builders/formulario.builder.ts";
import { construirDatosPortal } from "@/domain/builders/portal.builder.ts";
import { contarEstados } from "@/domain/engines/mapeo.engine.ts";
import { renderizarPlantilla } from "@/domain/engines/motor-plantillas.engine.ts";
import { compararMapeo } from "@/domain/policies/comparar-mapeo.policy.ts";
import type { CampoMapeado } from "@/domain/types/mapeo.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";
import { exito, fallo } from "@/domain/utils/resultado.util.ts";

async function cerrar(cierre: CierreFormulario, entorno: Entorno): Promise<Resultado<DatosFormulario>> {
  const { contexto, canonico, ruta, formato, aviso } = cierre;
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
  if (formulario.data.tipo !== TIPO_PLANTILLA.CELDAS) return fallo(CODIGO_ERROR.PLANTILLA_INVALIDA);
  const bytes = await entorno.formularios.xlsx(formulario.data.filas, entorno.reloj.hoy());
  const ruta = await entorno.salida.binario(contexto.caso, ARCHIVOS_SALIDA.FORMULARIO_XLSX, bytes);
  return cerrar({ contexto, canonico, ruta, formato: FORMATO.XLSX, aviso: null }, entorno);
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
  const ruta = await entorno.salida.binario(contexto.caso, ARCHIVOS_SALIDA.FORMULARIO_PDF, bytes);
  return cerrar({ contexto, canonico, ruta, formato: FORMATO.PDF, aviso: null }, entorno);
}

async function generarPortal(
  contexto: ContextoCaso,
  canonico: readonly CampoMapeado[],
  entorno: Entorno,
): Promise<Resultado<DatosFormulario>> {
  const plantilla = await entorno.conocimiento.cargar(contexto.reglas, CLAVE_PLANTILLA.VALORES_PORTAL);
  if (!plantilla.ok) return plantilla;
  const caso = { caso: contexto.caso, cliente: contexto.solicitud.cliente };
  const datos = construirDatosPortal(caso, canonico, entorno.reloj.hoy());
  const texto = renderizarPlantilla(
    plantilla.data,
    datos,
    contexto.reglas.plantillas[CLAVE_PLANTILLA.VALORES_PORTAL],
  );
  if (!texto.ok) return texto;
  const ruta = await entorno.salida.escribir(contexto.caso, ARCHIVOS_SALIDA.VALORES_PORTAL, texto.data);
  return cerrar(
    { contexto, canonico, ruta, formato: FORMATO.PORTAL, aviso: TEXTO_PORTAL.avisoFormatoNoSoportado },
    entorno,
  );
}

async function despachar(
  contexto: ContextoCaso,
  canonico: readonly CampoMapeado[],
  entorno: Entorno,
): Promise<Resultado<DatosFormulario>> {
  switch (contexto.solicitud.formato) {
    case FORMATO.XLSX:
      return generarXlsx(contexto, canonico, entorno);
    case FORMATO.PDF:
      return generarPdf(contexto, canonico, entorno);
    case FORMATO.PORTAL:
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
