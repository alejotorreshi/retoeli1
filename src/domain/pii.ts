import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { PATRON_ESPACIOS } from "@/config/constants/patterns.constants.ts";
import { LARGO_VISIBLE, RUTAS_POR_MASCARA, TIPO_MASCARA } from "@/config/constants/pii.constants.ts";
import { TEXTO_MASCARA } from "@/config/strings.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { CampoMapeado } from "@/domain/mapeo.ts";
import type { EstadoCampo, ReglaMapeo } from "@/domain/reglas.ts";

export type TipoMascara = ValorDe<typeof TIPO_MASCARA>;

export type CampoPresentado = {
  readonly etiqueta: string;
  readonly ruta: string | null;
  readonly estado: EstadoCampo;
  readonly regla: ReglaMapeo;
  readonly confianza: number;
  readonly valor_enmascarado: string | null;
  readonly nota: string | null;
  readonly propuesta: string | null;
};

function politica(
  entradas: readonly (readonly [TipoMascara, readonly string[]])[],
): ReadonlyMap<string, TipoMascara> {
  return new Map(entradas.flatMap(([tipo, rutas]) => rutas.map((ruta) => [ruta, tipo] as const)));
}

export const POLITICA_PII: ReadonlyMap<string, TipoMascara> = politica(RUTAS_POR_MASCARA);

function ultimos4(valor: string): string {
  if (valor.length <= LARGO_VISIBLE) return TEXTO_MASCARA.punto.repeat(LARGO_VISIBLE);
  return TEXTO_MASCARA.punto.repeat(valor.length - LARGO_VISIBLE) + valor.slice(-LARGO_VISIBLE);
}

function iniciales(valor: string): string {
  return valor
    .split(PATRON_ESPACIOS)
    .filter((palabra) => palabra !== "")
    .map((palabra) => `${palabra.charAt(0)}.`)
    .join(" ");
}

function correo(valor: string): string {
  const arroba = valor.lastIndexOf("@");
  if (arroba <= 0) return TEXTO_MASCARA.oculto;
  return `${valor.charAt(0)}${TEXTO_MASCARA.punto.repeat(3)}@${valor.slice(arroba + 1)}`;
}

function telefono(valor: string): string {
  const grupos = valor.trim().split(PATRON_ESPACIOS);
  if (grupos.length < 2) return ultimos4(valor.trim());
  const ultimo = grupos.length - 1;
  return grupos
    .map((grupo, indice) => {
      if (indice === 0 && grupo.startsWith("+")) return grupo;
      if (indice === ultimo) return grupo.length > LARGO_VISIBLE ? ultimos4(grupo) : grupo;
      return TEXTO_MASCARA.punto.repeat(3);
    })
    .join(" ");
}

const MASCARAS: Readonly<Record<TipoMascara, (valor: string) => string>> = {
  [TIPO_MASCARA.PUBLICO]: (valor) => valor,
  [TIPO_MASCARA.ULTIMOS4]: ultimos4,
  [TIPO_MASCARA.INICIALES]: iniciales,
  [TIPO_MASCARA.CORREO]: correo,
  [TIPO_MASCARA.TELEFONO]: telefono,
  [TIPO_MASCARA.MONTO]: () => TEXTO_MASCARA.monto,
  [TIPO_MASCARA.OCULTO]: () => TEXTO_MASCARA.oculto,
};

export function enmascarar(ruta: string, valor: string): string {
  return MASCARAS[POLITICA_PII.get(ruta) ?? TIPO_MASCARA.OCULTO](valor);
}

function valorEnmascarado(campo: CampoMapeado): string | null {
  if (campo.estado === ESTADO_CAMPO.FALTANTE || campo.ruta === null || campo.valor === null) return null;
  return enmascarar(campo.ruta, campo.valor);
}

export function presentarCampo(campo: CampoMapeado): CampoPresentado {
  return {
    etiqueta: campo.etiqueta,
    ruta: campo.ruta,
    estado: campo.estado,
    regla: campo.regla,
    confianza: campo.confianza,
    valor_enmascarado: valorEnmascarado(campo),
    nota: campo.nota,
    propuesta: campo.propuesta,
  };
}
