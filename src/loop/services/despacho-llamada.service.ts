import { EVENTO_COMPUERTA } from "@/config/constants/confirmation.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { MENSAJE_ERROR, RESUMEN_HERRAMIENTA } from "@/config/strings.ts";
import { evaluarEnvio, paqueteConocido, revocarAlArmar } from "@/domain/policies/compuerta.policy.ts";
import type { MotivoBloqueo } from "@/domain/types/checklist.type.ts";
import type { CasoPendiente } from "@/domain/types/compuerta.type.ts";
import { cuerpoDeFallo } from "@/domain/utils/respuesta-herramienta.util.ts";
import type { LlamadaHerramienta } from "@/llm/types/llm.type.ts";
import { argumentosConCasoSchema, armarPaqueteSchema } from "@/loop/schemas/resultado-herramienta.schema.ts";
import { argumentosDeLlamada, resultadoDeFallo } from "@/loop/services/registro-herramientas.service.ts";
import type { SoporteArmado } from "@/loop/types/resultado-herramienta.type.ts";
import type { ContextoDespacho, ResultadoDespacho, ResultadoLlamada } from "@/loop/types/turno.type.ts";

const SIMULAR_ENVIO = NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO];
const ARMAR_PAQUETE = NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE];
const SIN_CONFIRMACION = CODIGO_ERROR.CONFIRMACION_REQUERIDA;
const RESUMEN_SIN_CONFIRMACION = RESUMEN_HERRAMIENTA.fallo(HERRAMIENTA.SIMULAR_ENVIO, SIN_CONFIRMACION);

export function casoDeArgumentos(argumentos: unknown): string | null {
  const args = argumentosConCasoSchema.safeParse(argumentos);
  return args.success ? args.data.caso : null;
}

export function casoDeLlamada(llamada: LlamadaHerramienta): string | null {
  return casoDeArgumentos(argumentosDeLlamada(llamada.argumentos));
}

function ejecutar(llamada: LlamadaHerramienta, contexto: ContextoDespacho): Promise<ResultadoLlamada> {
  return contexto.registro.ejecutar(llamada, {
    directory: contexto.directorio,
    sessionId: contexto.sesionId,
  });
}

function rechazoSinConfirmacion(): ResultadoLlamada {
  const fallo = { codigo: SIN_CONFIRMACION, error: MENSAJE_ERROR[SIN_CONFIRMACION] };
  return resultadoDeFallo(cuerpoDeFallo(fallo, RESUMEN_SIN_CONFIRMACION));
}

function casosDeBitacora(caso: string | null, contexto: ContextoDespacho) {
  if (caso === null) return {};
  return paqueteConocido(contexto.conocidos, caso) === undefined ? { caso } : { caso, casoResuelto: caso };
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
    envioPermitido: false,
  };
}

async function despacharEnvio(
  llamada: LlamadaHerramienta,
  contexto: ContextoDespacho,
): Promise<ResultadoDespacho> {
  const caso = casoDeLlamada(llamada);
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
    evento: { tipo: resultado.ok ? EVENTO_COMPUERTA.ENVIADO : EVENTO_COMPUERTA.FALLIDO, caso },
    paquete: null,
    envioPermitido: true,
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

export function motivosDeSoportes(soportes: readonly SoporteArmado[]): readonly MotivoBloqueo[] {
  return soportes.flatMap(motivoDe);
}

function paqueteArmado(caso: string, resultado: ResultadoLlamada): CasoPendiente | null {
  const armado = armarPaqueteSchema.safeParse(resultado.respuesta);
  if (!armado.success) return null;
  const { bloqueos, checklist } = armado.data.data;
  return { caso, bloqueos, motivos: motivosDeSoportes(checklist.soportes) };
}

function sinCompuerta(resultado: ResultadoLlamada, contexto: ContextoDespacho): ResultadoDespacho {
  return {
    resultado,
    autorizacion: contexto.autorizacion,
    evento: null,
    paquete: null,
    envioPermitido: null,
  };
}

async function despacharArmado(
  llamada: LlamadaHerramienta,
  contexto: ContextoDespacho,
): Promise<ResultadoDespacho> {
  const caso = casoDeLlamada(llamada);
  const resultado = await ejecutar(llamada, contexto);
  if (caso === null) return sinCompuerta(resultado, contexto);
  const paquete = paqueteArmado(caso, resultado);
  return {
    resultado,
    autorizacion: revocarAlArmar(contexto.autorizacion, caso),
    evento: paquete === null ? null : { tipo: EVENTO_COMPUERTA.ARMADO, pendiente: paquete },
    paquete,
    envioPermitido: null,
  };
}

export async function despacharLlamada(
  llamada: LlamadaHerramienta,
  contexto: ContextoDespacho,
): Promise<ResultadoDespacho> {
  if (llamada.nombre === SIMULAR_ENVIO) return despacharEnvio(llamada, contexto);
  if (llamada.nombre === ARMAR_PAQUETE) return despacharArmado(llamada, contexto);
  return sinCompuerta(await ejecutar(llamada, contexto), contexto);
}
