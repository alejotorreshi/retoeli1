import { cargarContextoCaso } from "@/application/contexto-caso.ts";
import { mapeoCanonico } from "@/application/mapear-campos.ts";
import type {
  ArgsArmarPaquete,
  DatosPaquete,
  ResumenChecklist,
} from "@/application/types/armar-paquete.type.ts";
import type { ContextoCaso } from "@/application/types/contexto-caso.type.ts";
import type { ArchivoFormulario, Entorno } from "@/application/types/puertos.type.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ARCHIVO_FORMULARIO, ARCHIVOS_PAQUETE } from "@/config/constants/files.constants.ts";
import { ESTADO_LECTURA, ORIGEN_COPIA } from "@/config/constants/io.constants.ts";
import { CLAVE_PLANTILLA } from "@/config/constants/knowledge.constants.ts";
import { construirDatosBorrador } from "@/domain/borrador.ts";
import { construirChecklist, construirDatosChecklist, evaluarSoportes } from "@/domain/checklist.ts";
import { renderizarPlantilla, renderizarTextoPlano } from "@/domain/plantillas.ts";
import { exito, fallo } from "@/domain/resultado.ts";
import type { Checklist, SoporteEvaluado } from "@/domain/types/checklist.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";

export async function evaluarEstadoPaquete(
  contexto: ContextoCaso,
  entorno: Entorno,
): Promise<Resultado<Checklist>> {
  const canonico = mapeoCanonico(contexto);
  if (!canonico.ok) return canonico;
  const indice = await entorno.soportes.indice();
  if (indice.estado !== ESTADO_LECTURA.OK) return fallo(CODIGO_ERROR.DATOS_INVALIDOS);
  const presentes = await entorno.soportes.presentes();
  if (presentes.estado !== ESTADO_LECTURA.OK) return fallo(CODIGO_ERROR.DATOS_INVALIDOS);
  const hoy = entorno.reloj.hoy();
  const soportes = evaluarSoportes(
    contexto.soportesExigidos,
    indice.valor,
    presentes.valor,
    hoy,
    contexto.solicitud.pais,
    contexto.reglas.soportes,
  );
  if (!soportes.ok) return soportes;
  return exito(construirChecklist(soportes.data, canonico.data, hoy));
}

async function renderizarChecklist(
  contexto: ContextoCaso,
  checklist: Checklist,
  entorno: Entorno,
): Promise<Resultado<string>> {
  const plantilla = await entorno.plantillas.cargar(contexto.reglas, CLAVE_PLANTILLA.CHECKLIST);
  if (!plantilla.ok) return plantilla;
  const caso = { caso: contexto.caso, cliente: contexto.solicitud.cliente };
  const datos = construirDatosChecklist(caso, checklist);
  return renderizarPlantilla(plantilla.data, datos, contexto.reglas.plantillas[CLAVE_PLANTILLA.CHECKLIST]);
}

async function renderizarBorrador(
  contexto: ContextoCaso,
  checklist: Checklist,
  formulario: ArchivoFormulario,
  entorno: Entorno,
): Promise<Resultado<string>> {
  const plantilla = await entorno.plantillas.cargar(contexto.reglas, CLAVE_PLANTILLA.BORRADOR_CORREO);
  if (!plantilla.ok) return plantilla;
  const datos = construirDatosBorrador(contexto.solicitud, contexto.maestro, checklist, formulario);
  return renderizarTextoPlano(
    plantilla.data,
    datos,
    contexto.reglas.plantillas[CLAVE_PLANTILLA.BORRADOR_CORREO],
  );
}

async function copiarContenido(
  caso: string,
  formulario: ArchivoFormulario,
  soportes: readonly SoporteEvaluado[],
  entorno: Entorno,
): Promise<readonly string[]> {
  const copias = [await entorno.salida.copiar(caso, { tipo: ORIGEN_COPIA.FORMULARIO, archivo: formulario })];
  const archivos = new Set(
    soportes.flatMap((soporte) => (soporte.archivo === null ? [] : [soporte.archivo])),
  );
  for (const archivo of archivos)
    copias.push(await entorno.salida.copiar(caso, { tipo: ORIGEN_COPIA.SOPORTE, archivo }));
  return copias;
}

function resumenChecklist(checklist: Checklist): ResumenChecklist {
  const { fecha_ejecucion, soportes, faltantes, requiere_confirmacion } = checklist;
  return { fecha_ejecucion, soportes, faltantes, requiere_confirmacion };
}

async function armarBajoCandado(args: ArgsArmarPaquete, entorno: Entorno): Promise<Resultado<DatosPaquete>> {
  const contexto = await cargarContextoCaso(args.caso, entorno);
  if (!contexto.ok) return contexto;
  const { caso, solicitud } = contexto.data;

  const formulario = ARCHIVO_FORMULARIO[solicitud.formato];
  if (!(await entorno.salida.existe(caso, formulario))) return fallo(CODIGO_ERROR.FORMULARIO_NO_GENERADO);

  const checklist = await evaluarEstadoPaquete(contexto.data, entorno);
  if (!checklist.ok) return checklist;
  const texto = await renderizarChecklist(contexto.data, checklist.data, entorno);
  if (!texto.ok) return texto;
  const borrador = await renderizarBorrador(contexto.data, checklist.data, formulario, entorno);
  if (!borrador.ok) return borrador;

  const ruta = await entorno.salida.reiniciarPaquete(caso);
  const copias = await copiarContenido(caso, formulario, checklist.data.soportes, entorno);
  const rutaChecklist = await entorno.salida.escribirEnPaquete(caso, ARCHIVOS_PAQUETE.CHECKLIST, texto.data);
  const rutaBorrador = await entorno.salida.escribirEnPaquete(
    caso,
    ARCHIVOS_PAQUETE.BORRADOR_CORREO,
    borrador.data,
  );

  return exito({
    caso,
    ruta,
    listo_para_firma: checklist.data.listo_para_firma,
    bloqueos: checklist.data.bloqueos,
    checklist: resumenChecklist(checklist.data),
    archivos: [...copias, rutaChecklist, rutaBorrador].sort(),
  });
}

export function armarPaquete(args: ArgsArmarPaquete, entorno: Entorno): Promise<Resultado<DatosPaquete>> {
  return entorno.candado(args.caso, () => armarBajoCandado(args, entorno));
}
