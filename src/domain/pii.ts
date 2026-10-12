import type { CampoMapeado } from "./mapeo.ts";
import type { EstadoCampo, ReglaMapeo } from "./reglas.ts";

export type TipoMascara = "publico" | "ultimos4" | "iniciales" | "correo" | "telefono" | "monto" | "oculto";

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

export const VARIABLES_NOTA_PERMITIDAS = ["moneda", "ano", "pais", "identificador", "pais_emisor"] as const;

export type VariableNota = (typeof VARIABLES_NOTA_PERMITIDAS)[number];

export const VARIABLES_NOTA_DEL_MAESTRO: readonly (readonly [VariableNota, string])[] = [
  ["moneda", "ingresos_ultimo_ano.moneda"],
  ["ano", "ingresos_ultimo_ano.ano"],
];

const PUNTO = "•";
const LARGO_VISIBLE = 4;
const MASCARA_MONTO = "[monto oculto]";
const MASCARA_OCULTO = "[dato oculto]";
const ESPACIOS = /\s+/;

function politica(
  entradas: readonly (readonly [TipoMascara, readonly string[]])[],
): ReadonlyMap<string, TipoMascara> {
  return new Map(entradas.flatMap(([tipo, rutas]) => rutas.map((ruta) => [ruta, tipo] as const)));
}

export const POLITICA_PII: ReadonlyMap<string, TipoMascara> = politica([
  [
    "publico",
    [
      "razon_social",
      "tipo_sociedad",
      "ciudad",
      "departamento",
      "pais",
      "sitio_web",
      "actividad_economica",
      "ciiu_principal",
      "ciiu_secundario",
      "regimen_tributario",
      "numero_empleados",
    ],
  ],
  [
    "ultimos4",
    [
      "nit",
      "digito_verificacion",
      "codigo_postal",
      "matricula_mercantil",
      "representante_legal.identificacion",
      "banco.numero_cuenta",
      "banco.swift",
    ],
  ],
  ["iniciales", ["representante_legal.nombre", "contacto_comercial.nombre", "contacto_financiero.nombre"]],
  ["correo", ["representante_legal.email", "contacto_comercial.email", "contacto_financiero.email"]],
  ["telefono", ["telefono", "contacto_comercial.telefono", "contacto_financiero.telefono"]],
  ["monto", ["ingresos_ultimo_ano.valor"]],
]);

function ultimos4(valor: string): string {
  if (valor.length <= LARGO_VISIBLE) return PUNTO.repeat(LARGO_VISIBLE);
  return PUNTO.repeat(valor.length - LARGO_VISIBLE) + valor.slice(-LARGO_VISIBLE);
}

function iniciales(valor: string): string {
  return valor
    .split(ESPACIOS)
    .filter((palabra) => palabra !== "")
    .map((palabra) => `${palabra.charAt(0)}.`)
    .join(" ");
}

function correo(valor: string): string {
  const arroba = valor.lastIndexOf("@");
  if (arroba <= 0) return MASCARA_OCULTO;
  return `${valor.charAt(0)}${PUNTO.repeat(3)}@${valor.slice(arroba + 1)}`;
}

function telefono(valor: string): string {
  const grupos = valor.trim().split(ESPACIOS);
  if (grupos.length < 2) return ultimos4(valor.trim());
  const ultimo = grupos.length - 1;
  return grupos
    .map((grupo, indice) => {
      if (indice === 0 && grupo.startsWith("+")) return grupo;
      if (indice === ultimo) return grupo.length > LARGO_VISIBLE ? ultimos4(grupo) : grupo;
      return PUNTO.repeat(3);
    })
    .join(" ");
}

const MASCARAS: Readonly<Record<TipoMascara, (valor: string) => string>> = {
  publico: (valor) => valor,
  ultimos4,
  iniciales,
  correo,
  telefono,
  monto: () => MASCARA_MONTO,
  oculto: () => MASCARA_OCULTO,
};

export function enmascarar(ruta: string, valor: string): string {
  return MASCARAS[POLITICA_PII.get(ruta) ?? "oculto"](valor);
}

function valorEnmascarado(campo: CampoMapeado): string | null {
  if (campo.estado === "faltante" || campo.ruta === null || campo.valor === null) return null;
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
