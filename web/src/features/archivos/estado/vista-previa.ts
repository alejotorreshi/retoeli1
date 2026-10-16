import { ESTADO_VISTA_PREVIA, RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import { TEXTO_VISTA_PREVIA } from "@web/config/strings.ts";
import { esArchivoNoEncontrado } from "@web/features/casos/estado/casos.ts";
import type { EstadoVistaPrevia, ResultadoFallido } from "@web/types/chat.type.ts";

function textoDelFallo(resultado: ResultadoFallido): string {
  if (esArchivoNoEncontrado(resultado)) return TEXTO_VISTA_PREVIA.error;
  switch (resultado.tipo) {
    case RESULTADO_API.RECHAZO:
    case RESULTADO_API.ACCESO_VENCIDO:
      return resultado.mensaje;
    case RESULTADO_API.SIN_RED:
      return TEXTO_VISTA_PREVIA.errorSinConexion;
  }
}

export function estadoDeVistaPreviaFallida(resultado: ResultadoFallido): EstadoVistaPrevia {
  return { tipo: ESTADO_VISTA_PREVIA.ERROR, texto: textoDelFallo(resultado) };
}
