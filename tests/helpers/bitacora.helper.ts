import type { CapturaLogs, LineaLog } from "@tests/helpers/types/bitacora.type.ts";
import type { BitacoraEstructurada } from "@/application/types/puertos-agente.type.ts";

export function bitacoraMuda(): BitacoraEstructurada {
  const muda: BitacoraEstructurada = {
    depurar: () => undefined,
    info: () => undefined,
    advertir: () => undefined,
    error: () => undefined,
    hijo: () => muda,
  };
  return muda;
}

export function capturarLogs(): CapturaLogs {
  const crudas: string[] = [];
  return {
    destino: {
      write: (linea) => {
        crudas.push(linea);
      },
    },
    crudas,
    lineas: () =>
      crudas
        .flatMap((cruda) => cruda.split("\n"))
        .filter((linea) => linea !== "")
        .map((linea): LineaLog => JSON.parse(linea)),
  };
}
