export const PRECIOS_DEEPSEEK_FLASH = {
  FUENTE: "https://api-docs.deepseek.com/quick_start/pricing",
  CONSULTADO: "2026-10-15",
  MONEDA: "USD",
  TOKENS_POR_UNIDAD: 1_000_000,
  PICO: { CACHE_HIT: 0.006, CACHE_MISS: 0.3, SALIDA: 1.2 },
  VALLE: { CACHE_HIT: 0.003, CACHE_MISS: 0.15, SALIDA: 0.6 },
} as const;

export const ESTADO_EVIDENCIA_COSTO = {
  MEDIDO: "medido",
  PENDIENTE: "pendiente_de_corrida",
} as const;

export const ESCENARIO_GUION = "guion-11";

export const RUTA_EVIDENCIA_COSTO = "docs/evidencia/costo-por-caso.json";

export const DECIMALES_COSTO = 6;
