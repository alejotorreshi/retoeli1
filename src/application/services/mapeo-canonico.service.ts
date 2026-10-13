import type { ContextoCaso } from "@/application/types/contexto-caso.type.ts";
import type { DocumentoMapeo } from "@/application/types/mapeo-canonico.type.ts";
import type { Entorno } from "@/application/types/puertos.type.ts";
import { ARCHIVOS_SALIDA } from "@/config/constants/files.constants.ts";
import { SANGRIA_JSON } from "@/config/constants/limits.constants.ts";
import { construirCampoPresentado } from "@/domain/builders/campo-presentado.builder.ts";
import { mapearEtiquetas } from "@/domain/engines/mapeo.engine.ts";
import type { CampoMapeado } from "@/domain/types/mapeo.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";

function serializar(documento: DocumentoMapeo): string {
  return `${JSON.stringify(documento, null, SANGRIA_JSON)}\n`;
}

export function mapeoCanonico(contexto: ContextoCaso): Resultado<readonly CampoMapeado[]> {
  const { solicitud, plantilla, maestro, indice, reglas } = contexto;
  return mapearEtiquetas({
    etiquetas: plantilla.campos.map((campo) => campo.etiqueta),
    pais: solicitud.pais,
    indice,
    maestro,
    reglas,
  });
}

export function escribirMapeo(
  contexto: ContextoCaso,
  canonico: readonly CampoMapeado[],
  entorno: Entorno,
): Promise<string> {
  return entorno.salida.escribir(
    contexto.caso,
    ARCHIVOS_SALIDA.MAPEO,
    serializar({
      caso: contexto.caso,
      pais: contexto.solicitud.pais,
      fecha_ejecucion: entorno.reloj.hoy(),
      campos: canonico.map(construirCampoPresentado),
    }),
  );
}
