import { ESTADO_FIRMA, TONO_CONTADOR } from "@web/config/constants/ui.constants.ts";
import { contadoresDe, estadoDeFirma } from "@web/features/casos/estado/casos.ts";
import type { ContadorDeCaso, ResultadoDeCaso } from "@web/types/chat.type.ts";
import type { ContadorConTono, ControlTarjetaResultado, TonoContador } from "@web/types/ui.type.ts";
import { useId } from "react";

function tonoDe({ estado, cantidad }: ContadorDeCaso): TonoContador {
  return cantidad === null || cantidad === 0 ? TONO_CONTADOR.TENUE : estado;
}

function conTono(contador: ContadorDeCaso): ContadorConTono {
  return { ...contador, tono: tonoDe(contador) };
}

export function useTarjetaResultado(resultado: ResultadoDeCaso): ControlTarjetaResultado {
  const idTitulo = useId();
  const firma = estadoDeFirma(resultado.listoParaFirma);
  return {
    idTitulo,
    firma,
    bloqueosVisibles: firma === ESTADO_FIRMA.SIN_ARMAR ? null : resultado.bloqueosLegibles,
    contadores: contadoresDe(resultado).map(conTono),
  };
}
