import { ACCION_UI, ESTADO_HERRAMIENTA, RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import { TEXTO_CONFIRMACION, TEXTO_ERROR } from "@web/config/strings.ts";
import { reducirConfirmaciones } from "@web/features/confirmacion/estado/confirmaciones.ts";
import type {
  AccionUi,
  EstadoHidratado,
  HerramientaVistaUi,
  LlamadaDelTurno,
  PendienteVistaUi,
  ResultadoApi,
  TarjetaDeConfirmacion,
  TurnoConversacion,
  TurnoVistaUi,
  VistaSesionUi,
} from "@web/types/chat.type.ts";
import { TIPO_ACCION } from "@/config/constants/confirmation.constants.ts";
import { RESPUESTA_HTTP } from "@/config/constants/http.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";

type Pendientes = ReadonlyMap<string, readonly string[]>;

const ARMAR_PAQUETE = NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE];

const SIMULAR_ENVIO = NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO];

function llamadaDesdeVista(herramienta: HerramientaVistaUi): LlamadaDelTurno {
  return {
    llamadaId: herramienta.llamadaId,
    herramienta: herramienta.herramienta,
    caso: herramienta.caso,
    argumentos: herramienta.argumentos,
    estado: herramienta.ok ? ESTADO_HERRAMIENTA.CORRECTA : ESTADO_HERRAMIENTA.ERROR,
    resumen: herramienta.resumen,
    codigo: herramienta.ok ? null : herramienta.codigo,
    resultado: herramienta.resultado,
  };
}

function turnoDesdeVista(vista: TurnoVistaUi, clave: number): TurnoConversacion {
  return {
    clave,
    mensaje: vista.mensaje,
    llamadas: vista.herramientas.map(llamadaDesdeVista),
    eventos: 0,
    textos: vista.texto === null ? [] : [{ clave: 0, texto: vista.texto }],
    confirmaciones: [],
    error: null,
  };
}

function cancelaConTarjeta(mensaje: string, caso: string): boolean {
  return mensaje === TEXTO_CONFIRMACION.mensaje({ tipo: TIPO_ACCION.CANCELAR, caso });
}

function pendientesTrasTurno(previos: Pendientes, turno: TurnoConversacion): Pendientes {
  const pendientes = new Map([...previos].filter(([caso]) => !cancelaConTarjeta(turno.mensaje, caso)));
  for (const llamada of turno.llamadas) {
    if (llamada.estado !== ESTADO_HERRAMIENTA.CORRECTA || llamada.caso === null) continue;
    if (llamada.herramienta === ARMAR_PAQUETE) {
      pendientes.set(llamada.caso, llamada.resultado?.bloqueosLegibles ?? []);
    }
    if (llamada.herramienta === SIMULAR_ENVIO) pendientes.delete(llamada.caso);
  }
  return pendientes;
}

function pendientesVigentes(pendientes: readonly PendienteVistaUi[]): Pendientes {
  return new Map(pendientes.map((pendiente) => [pendiente.caso, pendiente.bloqueosLegibles]));
}

function conConfirmaciones(turno: TurnoConversacion, pendientes: Pendientes): TurnoConversacion {
  return {
    ...turno,
    confirmaciones: [...pendientes].map(([caso, bloqueosLegibles]) => ({
      caso,
      bloqueosLegibles,
      trasLlamadas: turno.llamadas.length,
    })),
  };
}

export function estadoDesdeVista(vista: VistaSesionUi): EstadoHidratado {
  const turnos: TurnoConversacion[] = [];
  let tarjetas: readonly TarjetaDeConfirmacion[] = [];
  let pendientes: Pendientes = new Map();
  vista.turnos.forEach((turnoVista, indice) => {
    const turno = turnoDesdeVista(turnoVista, indice);
    const ultimo = indice === vista.turnos.length - 1;
    pendientes = ultimo ? pendientesVigentes(vista.pendientes) : pendientesTrasTurno(pendientes, turno);
    const conPendientes = conConfirmaciones(turno, pendientes);
    turnos.push(conPendientes);
    tarjetas = reducirConfirmaciones(tarjetas, { turno: conPendientes, completo: true });
  });
  return {
    sesionId: vista.sesionId,
    turnos,
    tarjetasConfirmacion: tarjetas,
    tokensUsados: vista.tokensUsados,
  };
}

export function accionDeSesion(resultado: ResultadoApi<VistaSesionUi>): AccionUi {
  switch (resultado.tipo) {
    case RESULTADO_API.OK:
      return { tipo: ACCION_UI.HIDRATAR, hidratado: estadoDesdeVista(resultado.valor) };
    case RESULTADO_API.ACCESO_VENCIDO:
      return { tipo: ACCION_UI.ACCESO_PEDIDO, aviso: resultado.mensaje };
    case RESULTADO_API.RECHAZO:
      return resultado.status === RESPUESTA_HTTP.NO_ENCONTRADO
        ? { tipo: ACCION_UI.SESION_EXPIRADA, mensaje: resultado.mensaje }
        : { tipo: ACCION_UI.SESION_NO_CARGADA, mensaje: resultado.mensaje };
    default:
      return { tipo: ACCION_UI.SESION_NO_CARGADA, mensaje: TEXTO_ERROR.sinConexion };
  }
}

export function olvidaLaSesion(accion: AccionUi): boolean {
  return accion.tipo === ACCION_UI.SESION_EXPIRADA;
}
