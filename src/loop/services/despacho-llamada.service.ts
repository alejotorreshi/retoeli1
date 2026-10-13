import type { z } from "zod";
import { EVENTO_COMPUERTA } from "@/config/constants/confirmacion.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { HERRAMIENTA, PREFIJO_HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import { MENSAJE_ERROR, RESUMEN_HERRAMIENTA } from "@/config/strings.ts";
import { evaluarEnvio, revocarAlArmar } from "@/domain/policies/compuerta.policy.ts";
import type { MotivoBloqueo } from "@/domain/types/checklist.type.ts";
import type { CasoPendiente } from "@/domain/types/compuerta.type.ts";
import type { LlamadaHerramienta } from "@/llm/types/llm.type.ts";
import { argumentosConCasoSchema, armarPaqueteSchema } from "@/loop/schemas/resultado-herramienta.schema.ts";
import { argumentosDeLlamada } from "@/loop/services/registro-herramientas.service.ts";
import type { ContextoDespacho, ResultadoDespacho, ResultadoLlamada } from "@/loop/types/turno.type.ts";

const SIMULAR_ENVIO = `${PREFIJO_HERRAMIENTA}${HERRAMIENTA.SIMULAR_ENVIO}`;
const ARMAR_PAQUETE = `${PREFIJO_HERRAMIENTA}${HERRAMIENTA.ARMAR_PAQUETE}`;
const SIN_CONFIRMACION = CODIGO_ERROR.CONFIRMACION_REQUERIDA;
const RESUMEN_SIN_CONFIRMACION = RESUMEN_HERRAMIENTA.fallo(HERRAMIENTA.SIMULAR_ENVIO, SIN_CONFIRMACION);

type SoporteArmado = z.output<typeof armarPaqueteSchema>["data"]["checklist"]["soportes"][number];

function casoDe(llamada: LlamadaHerramienta): string | null {
  const args = argumentosConCasoSchema.safeParse(argumentosDeLlamada(llamada.argumentos));
  return args.success ? args.data.caso : null;
}

function ejecutar(llamada: LlamadaHerramienta, contexto: ContextoDespacho): Promise<ResultadoLlamada> {
  return contexto.registro.ejecutar(llamada, {
    directory: contexto.directorio,
    sessionId: contexto.sesionId,
  });
}

function rechazoSinConfirmacion(): ResultadoLlamada {
  const respuesta = {
    ok: false,
    error: MENSAJE_ERROR[SIN_CONFIRMACION],
    codigo: SIN_CONFIRMACION,
    resumen: RESUMEN_SIN_CONFIRMACION,
  };
  return {
    contenido: JSON.stringify(respuesta),
    ok: false,
    codigo: SIN_CONFIRMACION,
    resumen: RESUMEN_SIN_CONFIRMACION,
    respuesta,
  };
}

function casosDeBitacora(caso: string | null, contexto: ContextoDespacho) {
  if (caso === null) return {};
  return Object.hasOwn(contexto.conocidos, caso) ? { caso, casoResuelto: caso } : { caso };
}

async function bloquearEnvio(caso: string | null, contexto: ContextoDespacho): Promise<ResultadoDespacho> {
  await contexto.registrar({
    herramienta: SIMULAR_ENVIO,
    ok: false,
    resumen: RESUMEN_SIN_CONFIRMACION,
    sesion: contexto.sesionId,
    ...casosDeBitacora(caso, contexto),
    codigo: SIN_CONFIRMACION,
  });
  return {
    resultado: rechazoSinConfirmacion(),
    autorizacion: contexto.autorizacion,
    evento: caso === null ? null : { tipo: EVENTO_COMPUERTA.BLOQUEADO, caso },
    paquete: null,
  };
}

async function despacharEnvio(
  llamada: LlamadaHerramienta,
  contexto: ContextoDespacho,
): Promise<ResultadoDespacho> {
  const caso = casoDe(llamada);
  if (caso === null) return bloquearEnvio(caso, contexto);
  const evaluacion = evaluarEnvio(contexto.autorizacion, caso);
  if (!evaluacion.permitido) return bloquearEnvio(caso, contexto);
  const autorizada: LlamadaHerramienta = {
    id: llamada.id,
    nombre: SIMULAR_ENVIO,
    argumentos: JSON.stringify({ caso, confirmado: true }),
  };
  const resultado = await ejecutar(autorizada, contexto);
  return {
    resultado,
    autorizacion: evaluacion.siguiente,
    evento: resultado.ok ? { tipo: EVENTO_COMPUERTA.ENVIADO, caso } : null,
    paquete: null,
  };
}

function motivoDe(soporte: SoporteArmado): readonly MotivoBloqueo[] {
  const { tipo, estado, vigencia_hasta } = soporte;
  if (estado === ESTADO_SOPORTE.AUSENTE) return [{ tipo, causa: ESTADO_SOPORTE.AUSENTE }];
  if (estado === ESTADO_SOPORTE.VENCIDO && vigencia_hasta !== null) {
    return [{ tipo, causa: ESTADO_SOPORTE.VENCIDO, vigencia: vigencia_hasta }];
  }
  return [];
}

function paqueteArmado(caso: string, resultado: ResultadoLlamada): CasoPendiente | null {
  const armado = armarPaqueteSchema.safeParse(resultado.respuesta);
  if (!armado.success) return null;
  const { bloqueos, checklist } = armado.data.data;
  return { caso, bloqueos, motivos: checklist.soportes.flatMap(motivoDe) };
}

async function despacharArmado(
  llamada: LlamadaHerramienta,
  contexto: ContextoDespacho,
): Promise<ResultadoDespacho> {
  const caso = casoDe(llamada);
  const resultado = await ejecutar(llamada, contexto);
  if (caso === null) return { resultado, autorizacion: contexto.autorizacion, evento: null, paquete: null };
  const paquete = paqueteArmado(caso, resultado);
  return {
    resultado,
    autorizacion: revocarAlArmar(contexto.autorizacion, caso),
    evento: paquete === null ? null : { tipo: EVENTO_COMPUERTA.ARMADO, pendiente: paquete },
    paquete,
  };
}

export async function despacharLlamada(
  llamada: LlamadaHerramienta,
  contexto: ContextoDespacho,
): Promise<ResultadoDespacho> {
  if (llamada.nombre === SIMULAR_ENVIO) return despacharEnvio(llamada, contexto);
  if (llamada.nombre === ARMAR_PAQUETE) return despacharArmado(llamada, contexto);
  const resultado = await ejecutar(llamada, contexto);
  return { resultado, autorizacion: contexto.autorizacion, evento: null, paquete: null };
}
