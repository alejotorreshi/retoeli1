import type { Context, Hono } from "hono";
import type { LectorArtefactos } from "@/application/types/artefactos.type.ts";
import { PREFIJO_PAQUETE } from "@/config/constants/files.constants.ts";
import {
  CABECERA,
  DISPOSICION_ADJUNTO,
  PARAMETRO_ARCHIVO,
  PARAMETRO_CASO,
  RESPUESTA_HTTP,
  RUTA_API,
  VALOR_CABECERA,
} from "@/config/constants/http.constants.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";
import type { ErrorResponse, FileListResponse } from "@/http/types/api.type.ts";
import type { HttpEnv } from "@/http/types/server.type.ts";

type ArtifactDeps = {
  readonly lector: LectorArtefactos;
};

function notFound(c: Context<HttpEnv>, mensaje: string): Response {
  const body: ErrorResponse = { mensaje };
  return c.json(body, RESPUESTA_HTTP.NO_ENCONTRADO);
}

function attachment(fileName: string): string {
  return `${DISPOSICION_ADJUNTO}; filename="${fileName}"`;
}

async function download(
  c: Context<HttpEnv>,
  deps: ArtifactDeps,
  caso: string,
  nombre: string,
): Promise<Response> {
  const archivo = await deps.lector.abrir(caso, nombre);
  if (archivo === null) return notFound(c, MENSAJE_HTTP.archivoNoEncontrado);
  return c.body(archivo.cuerpo, RESPUESTA_HTTP.OK, {
    [CABECERA.TIPO_CONTENIDO]: archivo.tipoContenido,
    [CABECERA.CONTENT_DISPOSITION]: attachment(archivo.nombre),
    [CABECERA.CACHE_CONTROL]: VALOR_CABECERA.SIN_ALMACENAR,
  });
}

export function registerArtifactRoutes(app: Hono<HttpEnv>, deps: ArtifactDeps): void {
  app.get(RUTA_API.ARCHIVOS, async (c) => {
    const archivos = await deps.lector.listar(c.req.param(PARAMETRO_CASO));
    if (archivos === null) return notFound(c, MENSAJE_HTTP.casoNoEncontrado);
    const body: FileListResponse = { archivos };
    return c.json(body, RESPUESTA_HTTP.OK);
  });
  app.get(RUTA_API.ARCHIVO, (c) =>
    download(c, deps, c.req.param(PARAMETRO_CASO), c.req.param(PARAMETRO_ARCHIVO)),
  );
  app.get(RUTA_API.ARCHIVO_PAQUETE, (c) =>
    download(c, deps, c.req.param(PARAMETRO_CASO), `${PREFIJO_PAQUETE}${c.req.param(PARAMETRO_ARCHIVO)}`),
  );
}
