import { ejecutarDemo } from "../../src/demo/ejecutar-demo.ts";

export type Respuesta = { readonly herramienta: string; readonly respuesta: string };

export type Corrida = {
  readonly lineas: string[];
  readonly respuestas: Respuesta[];
  readonly fallido: boolean;
};

export type OpcionesCorrida = { readonly despues?: () => Promise<void> };

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
