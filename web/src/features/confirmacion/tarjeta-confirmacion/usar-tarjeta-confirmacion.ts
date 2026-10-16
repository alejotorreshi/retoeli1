import { ESTADO_TARJETA_CONFIRMACION } from "@web/config/constants/ui.constants.ts";
import { TEXTO_CONFIRMACION } from "@web/config/strings.ts";
import { estadoDeFirma, listoParaFirmaHasta } from "@web/features/casos/estado/casos.ts";
import type { TarjetaDeConfirmacion, TipoAccion, TurnoConversacion } from "@web/types/chat.type.ts";
import type {
  ControlTarjetaConfirmacion,
  PropsTarjetaConfirmacion,
  TarjetaEnPila,
} from "@web/types/ui.type.ts";
import { useId } from "react";
import { TIPO_ACCION } from "@/config/constants/confirmation.constants.ts";

function ayudaDeBloqueo(ocupada: boolean, enviando: TipoAccion | null): string {
  return ocupada || enviando !== null ? TEXTO_CONFIRMACION.ocupada : TEXTO_CONFIRMACION.enPausa;
}

function textoDelBoton(tipo: TipoAccion, enviando: TipoAccion | null, texto: string): string {
  return enviando === tipo ? TEXTO_CONFIRMACION.enviando : texto;
}

export function useTarjetaConfirmacion({
  tarjeta,
  listoParaFirma,
  ocupada,
  pausada,
  alResponder,
}: PropsTarjetaConfirmacion): ControlTarjetaConfirmacion {
  const idTitulo = useId();
  const idAyuda = useId();
  const bloqueada = ocupada || pausada || tarjeta.enviando !== null;

  function responder(tipo: TipoAccion): void {
    if (bloqueada) return;
    alResponder({ tipo, caso: tarjeta.caso });
  }

  function alConfirmar(): void {
    responder(TIPO_ACCION.CONFIRMAR);
  }

  function alCancelar(): void {
    responder(TIPO_ACCION.CANCELAR);
  }

  return {
    idTitulo,
    idAyuda,
    firma: estadoDeFirma(listoParaFirma),
    abierta: tarjeta.estado === ESTADO_TARJETA_CONFIRMACION.ABIERTA,
    bloqueada,
    cantidadBloqueos: tarjeta.bloqueosLegibles.length,
    ayuda: ayudaDeBloqueo(ocupada, tarjeta.enviando),
    textoConfirmar: textoDelBoton(TIPO_ACCION.CONFIRMAR, tarjeta.enviando, TEXTO_CONFIRMACION.confirmar),
    textoCancelar: textoDelBoton(TIPO_ACCION.CANCELAR, tarjeta.enviando, TEXTO_CONFIRMACION.cancelar),
    alConfirmar,
    alCancelar,
  };
}

export function tarjetasEnPila(
  tarjetas: readonly TarjetaDeConfirmacion[],
  turnos: readonly TurnoConversacion[],
): readonly TarjetaEnPila[] {
  return tarjetas.map((tarjeta) => ({
    tarjeta,
    listoParaFirma: listoParaFirmaHasta(turnos, tarjeta.caso, tarjeta.resueltaEnTurno),
  }));
}
