type Msg = { role: string; content?: string | null; tool_calls?: { id: string; function: { name: string } }[]; tool_call_id?: string };

const PORT = Number(process.env.FAKE_LLM_PORT ?? 4023);
const DELAY = Number(process.env.FAKE_DELAY_MS ?? 150);
const SLOW = Number(process.env.FAKE_SLOW_MS ?? 4000);
const FORCE = process.env.FAKE_FORCE_STATUS ? Number(process.env.FAKE_FORCE_STATUS) : null;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const CASE = /\b(?:co|ec|pe|pa|hn)-[a-z0-9-]+/g;
let calls = 0;

function lastResult(messages: Msg[], name: string): string | null {
  const ids = new Set(
    messages
      .flatMap((m) => (m.role === "assistant" ? (m.tool_calls ?? []) : []))
      .filter((c) => c.function.name === name)
      .map((c) => c.id),
  );
  return messages.filter((m) => m.role === "tool" && ids.has(m.tool_call_id ?? "")).at(-1)?.content ?? null;
}

function mapeoFrom(content: string | null) {
  if (content === null) return [];
  const d = JSON.parse(content)?.data ?? {};
  return [...(d.llenos ?? []), ...(d.faltantes ?? []), ...(d.requiere_confirmacion ?? [])].map(
    ({ etiqueta, estado, ruta }: { etiqueta: string; estado: string; ruta: string | null }) => ({ etiqueta, estado, ruta }),
  );
}

type Step = { name: string; args: (messages: Msg[]) => unknown } | { text: string };

function flowFor(caso: string): Step[] {
  return [
    { name: "proveedor_leer_solicitud", args: () => ({ caso }) },
    { name: "proveedor_mapear_campos", args: () => ({ caso, campos: [] }) },
    { name: "proveedor_generar_formulario", args: (m) => ({ caso, mapeo: mapeoFrom(lastResult(m, "proveedor_mapear_campos")) }) },
    { name: "proveedor_armar_paquete", args: () => ({ caso }) },
  ];
}

function planFor(message: string): Step[] {
  const envio = /^Sí, envía (\S+)/.exec(message);
  if (envio) {
    const caso = envio[1] ?? "";
    return [{ name: "proveedor_simular_envio", args: () => ({ caso, confirmado: true }) }, { text: `Registré el envío simulado de ${caso} (LLM falso).` }];
  }
  const cancela = /^Cancela el envío de (\S+)/.exec(message);
  if (cancela) return [{ text: `Entendido, no registro el envío de ${cancela[1]} (LLM falso).` }];
  if (/casos hay/i.test(message)) {
    return [
      { name: "proveedor_leer_solicitud", args: () => ({ caso: "" }) },
      { text: "Casos disponibles (LLM falso):\n- co-industrias-delta\n- ec-corp-andina\n- hn-agroexport-sula\n- pa-logistica-istmo" },
    ];
  }
  if (message.includes("QA-TEXTO")) return [{ text: "Primera línea del LLM falso.\nSegunda línea.\n\nPárrafo aparte con <b>etiquetas</b> que deben verse como texto." }];
  const casos = [...new Set(message.match(CASE) ?? ["ec-corp-andina"])];
  return [...casos.flatMap(flowFor), { text: `Listo (respuesta guionada del LLM falso) para ${casos.join(", ")}.` }];
}

function reply(message: Record<string, unknown>, finish: string) {
  return Response.json({
    id: `fake-${calls}`,
    object: "chat.completion",
    model: "modelo-falso",
    choices: [{ index: 0, message: { role: "assistant", content: null, ...message }, finish_reason: finish }],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  });
}

function forcedStatus(message: string): number | null {
  if (FORCE !== null) return FORCE;
  const m = /QA-(402|500|503)/.exec(message);
  return m ? Number(m[1]) : null;
}

Bun.serve({
  port: PORT,
  hostname: "127.0.0.1",
  async fetch(req) {
    const url = new URL(req.url);
    if (req.method !== "POST" || !url.pathname.endsWith("/chat/completions")) return new Response("not found", { status: 404 });
    calls += 1;
    const { messages } = (await req.json()) as { messages: Msg[] };
    const lastUser = messages.findLastIndex((m) => m.role === "user");
    const text = String(messages[lastUser]?.content ?? "");
    const status = forcedStatus(text);
    if (status !== null) return Response.json({ error: { message: `fake ${status}` } }, { status });
    const step = messages.slice(lastUser + 1).filter((m) => m.role === "assistant").length;
    const plan = planFor(text);
    await sleep(text.includes("QA-LENTO") ? SLOW : DELAY);
    const current = plan[Math.min(step, plan.length - 1)];
    if (current === undefined || "text" in current) return reply({ content: current?.text ?? "Listo." }, "stop");
    return reply(
      { tool_calls: [{ id: `call_${step}_${current.name}`, type: "function", function: { name: current.name, arguments: JSON.stringify(current.args(messages)) } }] },
      "tool_calls",
    );
  },
});
console.log(`fake LLM (QA 03) on http://127.0.0.1:${PORT}`);
