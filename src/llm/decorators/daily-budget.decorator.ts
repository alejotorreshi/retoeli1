import { TIPO_ERROR_LLM } from "@/config/constants/llm.constants.ts";
import type { AdaptadorLlm, ErrorLlm } from "@/llm/types/llm.type.ts";
import type { DailyBudget, DailyBudgetOptions } from "@/llm/types/resilience.type.ts";

const DAILY_CAP_REACHED: ErrorLlm = {
  tipo: TIPO_ERROR_LLM.TOPE_DIARIO,
  reintentable: false,
  estado: null,
  reintentarTrasMs: null,
};

export function createDailyBudget(options: DailyBudgetOptions): DailyBudget {
  let day = options.today();
  let used = 0;
  const rollOver = () => {
    const current = options.today();
    if (current === day) return;
    day = current;
    used = 0;
  };
  return {
    exhausted: () => {
      rollOver();
      return used >= options.limit;
    },
    record: (tokens) => {
      rollOver();
      used += tokens;
    },
  };
}

export function withDailyBudget(base: AdaptadorLlm, budget: DailyBudget): AdaptadorLlm {
  return {
    proveedor: base.proveedor,
    modelo: base.modelo,
    enviar: async (messages, tools, options) => {
      if (budget.exhausted()) return { ok: false, error: DAILY_CAP_REACHED };
      const result = await base.enviar(messages, tools, options);
      if (result.ok) budget.record(result.respuesta.uso.entrada + result.respuesta.uso.salida);
      return result;
    },
  };
}
