import { z } from "zod";
import * as P from "@/tools/proveedor.ts";
const out: Record<string, unknown> = {};
for (const [k, t] of Object.entries(P) as [string, { description: string; args: z.ZodRawShape }][]) {
  const js = z.toJSONSchema(z.object(t.args).strict(), { target: "draft-07" }) as Record<string, any>;
  const sentences = t.description.trim().split(/(?<=[.!?])\s+/).filter(Boolean).length;
  out[k] = { description: t.description, sentences, required: js.required, props: Object.keys(js.properties ?? {}), additionalProperties: js.additionalProperties, nested: JSON.stringify(js.properties).match(/"additionalProperties":(true|false)/g) ?? [], propDescs: Object.fromEntries(Object.entries(js.properties ?? {}).map(([p, v]: [string, any]) => [p, v.description ?? null])) };
}
console.log(JSON.stringify(Object.keys(P).sort()));
console.log(JSON.stringify(out, null, 1));
