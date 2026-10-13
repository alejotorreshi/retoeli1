import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { EntradaBitacora, Registrar, Reloj } from "@/application/puertos.ts";
import { ARCHIVOS_SALIDA, OUT_DIR, PATRON_CASO } from "@/config/constantes.ts";
import { directorioSalidaCaso } from "@/infra/salida/rutas-seguras.ts";

async function anexar(directorio: string, linea: Readonly<Record<string, unknown>>): Promise<void> {
  await mkdir(directorio, { recursive: true });
  await appendFile(join(directorio, ARCHIVOS_SALIDA.bitacora), `${JSON.stringify(linea)}\n`);
}

function casoSeguro(caso: string | undefined): string | undefined {
  return caso !== undefined && PATRON_CASO.test(caso) ? caso : undefined;
}

function nombreDeError(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

export function crearBitacora(raiz: string, reloj: Reloj): Registrar {
  return async (entrada: EntradaBitacora) => {
    const comun = {
      ts: reloj.instanteReal(),
      herramienta: entrada.herramienta,
      ok: entrada.ok,
      resumen: entrada.resumen,
      sesion: entrada.sesion,
    };
    const codigo = entrada.codigo === undefined ? {} : { codigo: entrada.codigo };
    const caso = casoSeguro(entrada.caso);
    const casoResuelto = casoSeguro(entrada.casoResuelto);
    try {
      await anexar(join(raiz, OUT_DIR), { ...comun, ...(caso === undefined ? {} : { caso }), ...codigo });
      if (casoResuelto !== undefined) {
        await anexar(directorioSalidaCaso(raiz, casoResuelto), { ...comun, ...codigo });
      }
    } catch (error) {
      console.error(`bitacora: ${nombreDeError(error)}`);
    }
  };
}
