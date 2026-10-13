import type { Corrida, OpcionesCorrida, Respuesta } from "@tests/helpers/types/correr-demo.type.ts";
import { ejecutarDemo } from "@/demo/ejecutar-demo.ts";

export async function correrDemo(directorio: string, opciones: OpcionesCorrida = {}): Promise<Corrida> {
  const previa = process.env.FECHA_EJECUCION;
  const lineas: string[] = [];
  const respuestas: Respuesta[] = [];
  try {
    const { fallido } = await ejecutarDemo({
      directorio,
      escribir: (linea) => lineas.push(linea),
      observar: (herramienta, respuesta) => respuestas.push({ herramienta, respuesta }),
    });
    await opciones.despues?.();
    return { lineas, respuestas, fallido };
  } finally {
    if (previa === undefined) delete process.env.FECHA_EJECUCION;
    else process.env.FECHA_EJECUCION = previa;
  }
}
