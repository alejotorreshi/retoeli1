import { ESTADO_VISTA_PREVIA, RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import { TEXTO_VISTA_PREVIA } from "@web/config/strings.ts";
import { esArchivoNoEncontrado } from "@web/state/casos.ts";
import type { EstadoVistaPrevia, ResultadoFallido } from "@web/types/chat.type.ts";

function textoDelFallo(resultado: ResultadoFallido): string {
  if (esArchivoNoEncontrado(resultado)) return TEXTO_VISTA_PREVIA.error;
  if (resultado.tipo === RESULTADO_API.RECHAZO) return resultado.mensaje;
  return TEXTO_VISTA_PREVIA.error;
}

export function estadoDeVistaPreviaFallida(resultado: ResultadoFallido): EstadoVistaPrevia {
  return { tipo: ESTADO_VISTA_PREVIA.ERROR, texto: textoDelFallo(resultado) };
}
