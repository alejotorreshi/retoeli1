export type EstadoVigencia = "vigente" | "vencido";

export type Vigencia = {
  readonly estado: EstadoVigencia;
  readonly dias_restantes: number | null;
  readonly aviso: string | null;
};

export function evaluarVigencia(_vigenciaHasta: string | null, _hoy: string, _diasAviso: number): Vigencia {
  return { estado: "vigente", dias_restantes: null, aviso: null };
}
