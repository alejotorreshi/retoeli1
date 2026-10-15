import { ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { motivosDeBloqueo } from "@/domain/builders/checklist.builder.ts";
import { pendientesDe } from "@/domain/policies/compuerta.policy.ts";
import { redactar } from "@/domain/policies/redaccion.policy.ts";
import type { CasoPendiente } from "@/domain/types/compuerta.type.ts";
import type { LlamadaHerramienta, Mensaje, MensajeAsistente } from "@/llm/types/llm.type.ts";
import { vistaSesionSchema } from "@/loop/schemas/vista-sesion.schema.ts";
import { casoDeArgumentos } from "@/loop/services/despacho-llamada.service.ts";
import { argumentosDeLlamada, resultadoDeContenido } from "@/loop/services/registro-herramientas.service.ts";
import { resultadoVisible } from "@/loop/services/resultado-visible.service.ts";
import type { Sesion } from "@/loop/types/turno.type.ts";
import type {
  HerramientaVista,
  PendienteVista,
  TurnoVista,
  VistaSesion,
} from "@/loop/types/vista-sesion.type.ts";

type LlamadaConRespuesta = { readonly llamada: LlamadaHerramienta; contenido: string | null };

type TurnoAgrupado = {
  readonly mensaje: string;
  readonly llamadas: LlamadaConRespuesta[];
  texto: string | null;
};

function anotarAsistente(turno: TurnoAgrupado, { contenido, llamadas }: MensajeAsistente): void {
  if (llamadas.length === 0) {
    turno.texto = contenido;
    return;
  }
  turno.llamadas.push(...llamadas.map((llamada) => ({ llamada, contenido: null })));
}

function anotarRespuesta(turno: TurnoAgrupado, llamadaId: string, contenido: string): void {
  const pendiente = turno.llamadas.findLast(
    (respondida) => respondida.llamada.id === llamadaId && respondida.contenido === null,
  );
  if (pendiente !== undefined) pendiente.contenido = contenido;
}

function agruparTurnos(historial: readonly Mensaje[]): readonly TurnoAgrupado[] {
  const turnos: TurnoAgrupado[] = [];
  for (const mensaje of historial) {
    const actual = turnos.at(-1);
    switch (mensaje.rol) {
      case ROL_MENSAJE.USUARIO:
        turnos.push({ mensaje: mensaje.contenido, llamadas: [], texto: null });
        break;
      case ROL_MENSAJE.ASISTENTE:
        if (actual !== undefined) anotarAsistente(actual, mensaje);
        break;
      case ROL_MENSAJE.HERRAMIENTA:
        if (actual !== undefined) anotarRespuesta(actual, mensaje.llamadaId, mensaje.contenido);
        break;
      case ROL_MENSAJE.SISTEMA:
        break;
    }
  }
  return turnos;
}

function herramientaVista(
  { llamada, contenido }: LlamadaConRespuesta,
  secretos: readonly string[],
): HerramientaVista {
  const argumentos = redactar(argumentosDeLlamada(llamada.argumentos), secretos);
  const base = {
    llamadaId: llamada.id,
    herramienta: llamada.nombre,
    caso: casoDeArgumentos(argumentos),
    argumentos,
  };
  if (contenido === null) return { ...base, ok: false, codigo: null, resumen: null, resultado: null };
  const { ok, codigo, resumen, respuesta } = resultadoDeContenido(contenido);
  return { ...base, ok, codigo, resumen, resultado: resultadoVisible(llamada.nombre, respuesta) };
}

function turnoVista(turno: TurnoAgrupado, secretos: readonly string[]): TurnoVista {
  return {
    mensaje: turno.mensaje,
    herramientas: turno.llamadas.map((respondida) => herramientaVista(respondida, secretos)),
    texto: turno.texto,
  };
}

function pendienteVista(pendiente: CasoPendiente): PendienteVista {
  return {
    caso: pendiente.caso,
    bloqueos: pendiente.bloqueos,
    bloqueosLegibles: motivosDeBloqueo({ motivos_bloqueo: pendiente.motivos }),
  };
}

export function vistaDeSesion(sesion: Sesion, ocupada: boolean, secretos: readonly string[]): VistaSesion {
  const vista: VistaSesion = {
    sesionId: sesion.id,
    turnos: agruparTurnos(sesion.historial).map((turno) => turnoVista(turno, secretos)),
    pendientes: pendientesDe(sesion.compuerta).map(pendienteVista),
    casosEnviados: sesion.casosEnviados,
    tokensUsados: sesion.tokensUsados,
    ocupada,
  };
  const redactada = vistaSesionSchema.safeParse(redactar(vista, secretos));
  return redactada.success ? redactada.data : { ...vista, turnos: [], pendientes: [], casosEnviados: [] };
}
