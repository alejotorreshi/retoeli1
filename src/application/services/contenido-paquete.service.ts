import type { ContextoCaso } from "@/application/types/contexto-caso.type.ts";
import type { ArchivoFormulario, Entorno } from "@/application/types/puertos.type.ts";
import { CLAVE_PLANTILLA } from "@/config/constants/knowledge.constants.ts";
import { construirDatosBorrador } from "@/domain/builders/borrador.builder.ts";
import { construirDatosChecklist } from "@/domain/builders/checklist.builder.ts";
import { renderizarPlantilla, renderizarTextoPlano } from "@/domain/engines/motor-plantillas.engine.ts";
import { archivosDelPaquete } from "@/domain/policies/paquete-vigente.policy.ts";
import type { Checklist } from "@/domain/types/checklist.type.ts";
import type { PaqueteEsperado } from "@/domain/types/paquete.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";
import { exito } from "@/domain/utils/resultado.util.ts";

export async function renderizarChecklist(
  contexto: ContextoCaso,
  checklist: Checklist,
  entorno: Entorno,
): Promise<Resultado<string>> {
  const plantilla = await entorno.conocimiento.cargar(contexto.reglas, CLAVE_PLANTILLA.CHECKLIST);
  if (!plantilla.ok) return plantilla;
  const caso = { caso: contexto.caso, cliente: contexto.solicitud.cliente };
  const datos = construirDatosChecklist(caso, checklist);
  return renderizarPlantilla(plantilla.data, datos, contexto.reglas.plantillas[CLAVE_PLANTILLA.CHECKLIST]);
}

export async function renderizarBorrador(
  contexto: ContextoCaso,
  checklist: Checklist,
  formulario: ArchivoFormulario,
  entorno: Entorno,
): Promise<Resultado<string>> {
  const plantilla = await entorno.conocimiento.cargar(contexto.reglas, CLAVE_PLANTILLA.BORRADOR_CORREO);
  if (!plantilla.ok) return plantilla;
  const datos = construirDatosBorrador(contexto.solicitud, contexto.maestro, checklist, formulario);
  return renderizarTextoPlano(
    plantilla.data,
    datos,
    contexto.reglas.plantillas[CLAVE_PLANTILLA.BORRADOR_CORREO],
  );
}

export async function paqueteEsperado(
  contexto: ContextoCaso,
  checklist: Checklist,
  formulario: ArchivoFormulario,
  entorno: Entorno,
): Promise<Resultado<PaqueteEsperado>> {
  const borrador = await renderizarBorrador(contexto, checklist, formulario, entorno);
  if (!borrador.ok) return borrador;
  return exito({ archivos: archivosDelPaquete(checklist, formulario), borrador: borrador.data });
}
