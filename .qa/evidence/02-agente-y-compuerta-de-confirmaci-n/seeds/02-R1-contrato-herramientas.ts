import { z } from "zod";
import * as P from "@/tools/proveedor.ts";
import { PREFIJO_HERRAMIENTA } from "@/config/constants/tools.constants.ts";
type Expuesta = { description: string; args: z.ZodRawShape };
const salida = Object.keys(P).sort().map((exportado) => {
  const h = (P as Record<string, Expuesta>)[exportado];
  return {
    nombreVisible: `${PREFIJO_HERRAMIENTA}${exportado}`,
    description: h.description,
    argsSchema: z.toJSONSchema(z.object(h.args)),
    argsSchemaModelo: z.toJSONSchema(z.object(h.args).strict(), { target: "draft-07", io: "input" }),
  };
});
console.log(JSON.stringify(salida, null, 2));
