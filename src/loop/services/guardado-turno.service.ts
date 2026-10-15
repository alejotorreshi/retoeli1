import { EVENTO_BITACORA, MOTIVO_FIN } from "@/config/constants/agent.constants.ts";
import { ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { SEPARADOR_PARRAFOS } from "@/config/constants/text.constants.ts";
import { HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import { enviadosTrasEventos, recuperarAutorizado } from "@/domain/policies/compuerta.policy.ts";
import type { MensajeAsistente } from "@/llm/types/llm.type.ts";
import { interrumpido } from "@/loop/services/cierre-error.service.ts";
import { cerrarTurnoConCompuerta } from "@/loop/services/cierre-turno.service.ts";
import type { Cierre, CierreTurnoCompuerta, FinAnotado, Turno } from "@/loop/types/turno.type.ts";

function mensajeAsistente(cierre: Cierre): MensajeAsistente {
  return {
    rol: ROL_MENSAJE.ASISTENTE,
    contenido: cierre.texto,
    llamadas: [],
    razonamiento: cierre.razonamiento,
  };
}

function enviosSinCaso(turno: Turno): number {
  return turno.llamadas.filter(
    ({ herramienta, caso, ok }) => herramienta === HERRAMIENTA.SIMULAR_ENVIO && caso === null && !ok,
  ).length;
}

export function cerrarCompuerta(turno: Turno, cierre: Cierre): CierreTurnoCompuerta {
  return cerrarTurnoConCompuerta({
    turnoId: turno.turnoId,
    texto: cierre.porError ? "" : cierre.texto,
    arrastrados: [
      ...turno.arrastrados,
      ...recuperarAutorizado(cierre.motivo, turno.autorizacion, turno.conocidos),
    ],
    eventos: turno.eventosCompuerta,
    conocidos: turno.conocidos,
    enviados: turno.sesion.casosEnviados,
    abortado: cierre.motivo === MOTIVO_FIN.ABORTADO,
    enviosSinCaso: enviosSinCaso(turno),
  });
}

function textoGuardado(cierre: Cierre, compuerta: CierreTurnoCompuerta): string {
  if (!cierre.porError) return compuerta.texto;
  return compuerta.texto === "" ? cierre.texto : `${cierre.texto}${SEPARADOR_PARRAFOS}${compuerta.texto}`;
}

export function guardarSesion(turno: Turno, cierre: Cierre, compuerta: CierreTurnoCompuerta): boolean {
  turno.guardado = true;
  const asistente = mensajeAsistente({ ...cierre, texto: textoGuardado(cierre, compuerta) });
  return turno.deps.sesiones.guardar(
    {
      ...turno.sesion,
      historial: [...turno.sesion.historial, turno.usuario, ...turno.pasos, asistente],
      compuerta: compuerta.estado,
      paquetesConocidos: turno.conocidos,
      casosEnviados: enviadosTrasEventos(turno.sesion.casosEnviados, turno.eventosCompuerta),
    },
    turno.candado,
  );
}

export function anotarFin(turno: Turno, cierre: Cierre, fin: FinAnotado): void {
  turno.bitacora.info(EVENTO_BITACORA.TURNO_FIN, {
    motivo: cierre.motivo,
    codigo: cierre.codigo,
    ...fin,
    llamadas: turno.llamadas.length,
    tokensSesion: turno.sesion.tokensUsados,
    duracionMs: Date.now() - turno.inicioMs,
  });
}

export function guardarInterrumpido(turno: Turno): void {
  const cierre = interrumpido();
  const compuerta = cerrarCompuerta(turno, cierre);
  const sesionGuardada = guardarSesion(turno, cierre, compuerta);
  anotarFin(turno, cierre, {
    needsConfirmation: compuerta.needsConfirmation,
    abandonado: true,
    sesionGuardada,
  });
}
