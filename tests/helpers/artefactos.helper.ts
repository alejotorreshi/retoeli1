import { correrDemo } from "@tests/helpers/correr-demo.helper.ts";
import { FECHA_DEMO, SESION_DEMO } from "@/config/constants/demo.constants.ts";
import { PARAMETRO_ARCHIVO, PARAMETRO_CASO, RUTA_API } from "@/config/constants/http.constants.ts";
import { simular_envio } from "@/tools/proveedor.ts";

export const CASO_CONFIRMADO = "ec-corp-andina";

export async function generarArtefactos(raiz: string): Promise<void> {
  const ctx = { directory: raiz, sessionId: SESION_DEMO };
  let envio = "";
  const corrida = await correrDemo(raiz, {
    despues: async () => {
      process.env.FECHA_EJECUCION = FECHA_DEMO;
      envio = await simular_envio.execute({ caso: CASO_CONFIRMADO, confirmado: true }, ctx);
    },
  });
  if (corrida.fallido || JSON.parse(envio).ok !== true) throw new Error("la demo no generó los artefactos");
}

function conCaso(ruta: string, caso: string): string {
  return ruta.replace(`:${PARAMETRO_CASO}`, encodeURIComponent(caso));
}

export function rutaArchivos(caso: string): string {
  return conCaso(RUTA_API.ARCHIVOS, caso);
}

export function rutaArchivo(caso: string, nombre: string): string {
  return `${rutaArchivos(caso)}/${nombre}`;
}

export function rutaVistaPrevia(caso: string, nombre: string): string {
  return conCaso(RUTA_API.VISTA_PREVIA, caso).replace(`:${PARAMETRO_ARCHIVO}`, nombre);
}
