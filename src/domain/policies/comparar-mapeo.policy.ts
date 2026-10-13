import { TEXTO_COMPARACION } from "@/config/strings.ts";
import type { ComparacionMapeo, ItemMapeo } from "@/domain/types/comparar-mapeo.type.ts";
import type { CampoMapeado } from "@/domain/types/mapeo.type.ts";

function agruparPorEtiqueta<T extends { readonly etiqueta: string }>(items: readonly T[]): Map<string, T[]> {
  const grupos = new Map<string, T[]>();
  for (const item of items) {
    const grupo = grupos.get(item.etiqueta);
    if (grupo === undefined) grupos.set(item.etiqueta, [item]);
    else grupo.push(item);
  }
  return grupos;
}

function diferenciasDeEtiqueta(
  etiqueta: string,
  esperados: readonly CampoMapeado[],
  recibidos: readonly ItemMapeo[],
): string[] {
  if (recibidos.length < esperados.length) return [TEXTO_COMPARACION.falta(etiqueta)];
  if (recibidos.length > esperados.length) return [TEXTO_COMPARACION.duplicado(etiqueta)];
  const rutaDistinta = recibidos.some((item, indice) => item.ruta !== esperados[indice]?.ruta);
  const estadoDistinto = recibidos.some((item, indice) => item.estado !== esperados[indice]?.estado);
  return [
    ...(rutaDistinta ? [TEXTO_COMPARACION.rutaDistinta(etiqueta)] : []),
    ...(estadoDistinto ? [TEXTO_COMPARACION.estadoDistinto(etiqueta)] : []),
  ];
}

export function compararMapeo(
  canonico: readonly CampoMapeado[],
  recibido: readonly ItemMapeo[],
): ComparacionMapeo {
  const esperados = agruparPorEtiqueta(canonico);
  const recibidos = agruparPorEtiqueta(recibido);
  const porEtiqueta = [...esperados].flatMap(([etiqueta, grupo]) =>
    diferenciasDeEtiqueta(etiqueta, grupo, recibidos.get(etiqueta) ?? []),
  );
  const sobrantes = recibido.flatMap((item, indice) =>
    esperados.has(item.etiqueta) ? [] : [TEXTO_COMPARACION.sobrante(indice)],
  );
  const diferencias = [...porEtiqueta, ...sobrantes];
  return diferencias.length === 0 ? { iguales: true } : { iguales: false, diferencias };
}
