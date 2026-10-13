import { cargarSolicitudCaso, completarContextoCaso } from "@/application/services/contexto-caso.service.ts";
import { evaluarEstadoPaquete } from "@/application/services/estado-paquete.service.ts";
import type { Entorno } from "@/application/types/puertos.type.ts";
import type { ArgsSimularEnvio, DatosEnvio } from "@/application/types/simular-envio.type.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ARCHIVOS_PAQUETE, ARCHIVOS_SALIDA } from "@/config/constants/files.constants.ts";
import { CLAVE_PLANTILLA } from "@/config/constants/knowledge.constants.ts";
import { construirDatosEnvio } from "@/domain/borrador.ts";
import { renderizarPlantilla } from "@/domain/motor-plantillas.ts";
import { exito, fallo } from "@/domain/resultado.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";

async function simularBajoCandado(args: ArgsSimularEnvio, entorno: Entorno): Promise<Resultado<DatosEnvio>> {
  const cargada = await cargarSolicitudCaso(args.caso, entorno);
  if (!cargada.ok) return cargada;
  if (args.confirmado !== true) return fallo(CODIGO_ERROR.CONFIRMACION_REQUERIDA);

  const { caso } = cargada.data;
  if (!(await entorno.salida.existeEnPaquete(caso, ARCHIVOS_PAQUETE.CHECKLIST)))
    return fallo(CODIGO_ERROR.PAQUETE_NO_ARMADO);

  const contexto = await completarContextoCaso(cargada.data, entorno);
  if (!contexto.ok) return contexto;
  const checklist = await evaluarEstadoPaquete(contexto.data, entorno);
  if (!checklist.ok) return checklist;

  const plantilla = await entorno.plantillas.cargar(contexto.data.reglas, CLAVE_PLANTILLA.ENVIO_SIMULADO);
  if (!plantilla.ok) return plantilla;
  const archivos = await entorno.salida.listarPaquete(caso);
  const datos = construirDatosEnvio(caso, contexto.data.solicitud, checklist.data, archivos);
  const texto = renderizarPlantilla(
    plantilla.data,
    datos,
    contexto.data.reglas.plantillas[CLAVE_PLANTILLA.ENVIO_SIMULADO],
  );
  if (!texto.ok) return texto;

  const ruta = await entorno.salida.escribir(caso, ARCHIVOS_SALIDA.ENVIO_SIMULADO, texto.data);
  return exito({ caso, ruta, bloqueos: checklist.data.bloqueos });
}

export function simularEnvio(args: ArgsSimularEnvio, entorno: Entorno): Promise<Resultado<DatosEnvio>> {
  return entorno.candado(args.caso, () => simularBajoCandado(args, entorno));
}
