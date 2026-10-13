export type EstadoVigencia = "vigente" | "vencido";

export type Vigencia = {
  readonly estado: EstadoVigencia;
  readonly dias_restantes: number | null;
  readonly aviso: string | null;
};

const MILISEGUNDOS_POR_DIA = 86_400_000;

export function textoVence(dias: number): string {
  if (dias === 0) return "vence hoy";
  if (dias === 1) return "vence en 1 día";
  return `vence en ${dias} días`;
}

function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / MILISEGUNDOS_POR_DIA);
}

export function evaluarVigencia(vigenciaHasta: string | null, hoy: string, diasAviso: number): Vigencia {
  if (vigenciaHasta === null) return { estado: "vigente", dias_restantes: null, aviso: null };
  const dias = diasEntre(hoy, vigenciaHasta);
  if (vigenciaHasta < hoy) return { estado: "vencido", dias_restantes: dias, aviso: null };
  const aviso = dias >= 0 && dias <= diasAviso ? textoVence(dias) : null;
  return { estado: "vigente", dias_restantes: dias, aviso };
}
